import { NextResponse } from 'next/server'
import { SIGNATURE_HEADER_NAME, isValidSignature } from '@sanity/webhook'
import { sanityWriteClient } from '@/sanity/lib/writeClient'
import { getShopConfigInternal } from '@/lib/shop-server'
import { getOrderInternalByTrackId, restoreStockForOrder } from '@/lib/orders'
import { orderConfirmationEmail, orderStatusEmail } from '@/lib/email/templates'
import { safeSend } from '@/lib/email/client'
import { isOrderStatus } from '@/lib/shop'

export const dynamic = 'force-dynamic'

/**
 * Sanity order webhook.
 *
 * Fires whenever an `order` document is created or updated. It is what turns an
 * admin changing a dropdown in the Studio into a customer being told, and a
 * cancellation into stock going back on the shelf.
 *
 * ── FAIL CLOSED ───────────────────────────────────────────────
 * Without SANITY_WEBHOOK_SECRET this route rejects everything. An unauthenticated
 * caller who could reach it would be able to trigger arbitrary emails to
 * customers and move stock, so refusing to run is strictly better than running
 * unverified.
 *
 * ── AT-LEAST-ONCE ─────────────────────────────────────────────
 * Sanity retries on a non-2xx, and saving a document twice delivers twice.
 * Every effect here is therefore idempotent:
 *   • emails       — guarded by `notifiedStatuses[]`, one send per status
 *   • stock restore — guarded by `stockRestoredAt`, inside a CAS transaction
 *   • status history — appended only when the status actually changed
 *
 * Configure at sanity.io/manage → API → Webhooks. Setup steps and the exact
 * projection live in docs/shop-runbook.md.
 */
export async function POST(req: Request) {
  const secret = process.env.SANITY_WEBHOOK_SECRET

  if (!secret) {
    console.error('[shop:webhook] SANITY_WEBHOOK_SECRET is not set — rejecting')
    return NextResponse.json({ error: 'Webhook is not configured.' }, { status: 503 })
  }

  const signature = req.headers.get(SIGNATURE_HEADER_NAME)
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature.' }, { status: 401 })
  }

  // Must be the raw body. Re-encoding parsed JSON can reorder keys or change
  // number formatting, and the HMAC would then never match.
  const rawBody = await req.text()

  let valid = false
  try {
    valid = await isValidSignature(rawBody, signature, secret)
  } catch (err) {
    console.error('[shop:webhook] signature check threw', err)
  }
  if (!valid) {
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 401 })
  }

  let payload: { _id?: string; _type?: string; trackId?: string } | null = null
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON.' }, { status: 400 })
  }

  if (!payload || payload._type !== 'order' || !payload.trackId) {
    // Not ours, or a delete. 200 so Sanity does not retry something that will
    // never succeed.
    return NextResponse.json({ ok: true, skipped: 'not an order' })
  }

  try {
    const config = await getShopConfigInternal()

    // Re-read rather than trusting the payload: the webhook projection is
    // configured in a dashboard this repo does not control, so it may be
    // partial, and it can be stale by the time it arrives.
    const order = await getOrderInternalByTrackId(payload.trackId)
    if (!order) {
      return NextResponse.json({ ok: true, skipped: 'order not found' })
    }

    if (!isOrderStatus(order.status)) {
      console.error('[shop:webhook] unknown status', order.status, order.trackId)
      return NextResponse.json({ ok: true, skipped: 'unknown status' })
    }

    const actions: string[] = []

    // ── 1. Cancellation → put the stock back ──────────────────
    // Before the email, so a customer told their order is cancelled is never
    // told it while the units are still held.
    if (order.status === 'cancelled') {
      const restore = await restoreStockForOrder(order._id)
      if (restore.restored) {
        actions.push(`restored ${restore.units} unit(s)`)
      } else if (restore.reason === 'busy') {
        // The one case worth retrying. A non-2xx makes Sanity redeliver, and
        // the guards make the retry safe.
        console.error('[shop:webhook] stock restore contended', order.trackId)
        return NextResponse.json({ error: 'Stock restore contended, retry.' }, { status: 503 })
      } else {
        actions.push(`restore skipped (${restore.reason})`)
      }
    }

    // ── 2. Status history ─────────────────────────────────────
    const history = order.statusHistory ?? []
    if (history[history.length - 1]?.status !== order.status) {
      try {
        await sanityWriteClient
          .patch(order._id)
          .setIfMissing({ statusHistory: [] })
          .append('statusHistory', [
            {
              _key: crypto.randomUUID().replace(/-/g, '').slice(0, 12),
              _type: 'statusEvent',
              status: order.status,
              at: new Date().toISOString(),
            },
          ])
          .commit()
        actions.push('history appended')
      } catch (err) {
        // An audit-trail gap is not worth failing the delivery over — the
        // emails and the stock restore matter more.
        console.error('[shop:webhook] could not append history', order.trackId, err)
      }
    }

    // ── 3. Status email — once per status, ever ───────────────
    const notified = order.notifiedStatuses ?? []
    if (!notified.includes(order.status)) {
      const message = orderStatusEmail(order, config)
      if (message) {
        const outcome = await safeSend(message)
        if (outcome === 'sent') {
          try {
            await sanityWriteClient
              .patch(order._id)
              .setIfMissing({ notifiedStatuses: [] })
              .append('notifiedStatuses', [order.status])
              .commit()
          } catch (err) {
            // Worst case the customer gets one duplicate on a later save. That
            // is a far better failure than silently never telling them.
            console.error('[shop:webhook] could not record notification', order.trackId, err)
          }
        }
        actions.push(`status email ${outcome}`)
      }
    }

    // ── 4. Manual re-send ─────────────────────────────────────
    // The escape hatch for a confirmation that failed. An admin ticks the box
    // in the Studio; this sends and unticks it.
    if (order.resendEmail === true) {
      const outcome = await safeSend(orderConfirmationEmail(order, config))
      try {
        await sanityWriteClient
          .patch(order._id)
          .set({ resendEmail: false, emailStatus: outcome })
          .commit()
      } catch (err) {
        console.error('[shop:webhook] could not clear resend flag', order.trackId, err)
      }
      actions.push(`confirmation re-sent (${outcome})`)
    }

    return NextResponse.json({ ok: true, trackId: order.trackId, actions })
  } catch (err) {
    console.error('[shop:webhook]', err)
    // 500 so Sanity retries — every effect above is idempotent, so a redelivery
    // costs nothing but repeats whatever did not finish.
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 500 })
  }
}

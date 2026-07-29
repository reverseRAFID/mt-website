import type { CollectionAfterChangeHook } from 'payload'

import type { Order } from '@/payload-types'

/**
 * Everything that has to happen when an order changes.
 *
 * ── WHAT THIS REPLACES ────────────────────────────────────────
 * A Sanity webhook: an HTTP callback to /api/shop/webhook, authenticated with
 * an HMAC signature, retried by Sanity on any non-2xx, and configured in a
 * dashboard this repository does not control. It existed only because Sanity is
 * a separate system from the site.
 *
 * Payload runs in-process, so this is now a function call. Gone with the
 * webhook: the shared secret, the signature check, the "re-read the document
 * because the payload projection is configured elsewhere and may be partial or
 * stale" dance, and an entire public endpoint that could trigger customer
 * emails if the secret ever leaked.
 *
 * ── WHAT DID NOT CHANGE ───────────────────────────────────────
 * The idempotency guards, because they were never really about the webhook.
 * An admin can save the same document five times, correct a status and change
 * it back, or cancel an order twice in two tabs. So:
 *
 *   • emails        — guarded by `notifiedStatuses[]`, one send per status
 *   • stock restore — guarded by `stockRestoredAt`, claimed inside a transaction
 *   • status history — appended only when the status actually changed
 *
 * ── ORDERING ──────────────────────────────────────────────────
 * The stock restore runs BEFORE the cancellation email, so a customer told
 * their order is cancelled is never told it while the units are still held.
 *
 * Failures here are logged, never thrown. An email that does not send must not
 * roll back an admin's status change — the change is the real work, the email
 * is the notification about it.
 */
export const orderEffects: CollectionAfterChangeHook<Order> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  // The order route sends its own confirmation and pre-marks `placed` as
  // notified, so creation has nothing to do here.
  if (operation === 'create') return doc

  const statusChanged = previousDoc?.status !== doc.status

  // Imported lazily so the CMS config does not pull the email stack — and
  // through it the whole order module — into every context that loads Payload,
  // including the CLI and the migration script.
  const [{ restoreStockForOrder }, { orderConfirmationEmail, orderStatusEmail }, { safeSend }, { getShopConfigInternal }] =
    await Promise.all([
      import('@/lib/orders'),
      import('@/lib/email/templates'),
      import('@/lib/email/client'),
      import('@/lib/cms/shop'),
    ])

  try {
    const config = await getShopConfigInternal()

    // ── 1. Cancellation → put the stock back ──────────────────
    if (doc.status === 'cancelled' && statusChanged) {
      const restore = await restoreStockForOrder(String(doc.id), req.transactionID as string | undefined)
      if (!restore.restored && restore.reason === 'busy') {
        req.payload.logger.error(
          `[shop] stock restore contended for ${doc.trackId} — units NOT returned, restore by hand`
        )
      }
    }

    // ── 2. Status history ─────────────────────────────────────
    const history = doc.statusHistory ?? []
    if (statusChanged && history[history.length - 1]?.status !== doc.status) {
      await req.payload.update({
        collection: 'orders',
        id: doc.id,
        data: {
          statusHistory: [...history, { status: doc.status, at: new Date().toISOString() }],
        },
        // Join the caller's transaction rather than opening a competing one —
        // see the note on restoreStockForOrder.
        req,
        // Skips this hook on the write it is currently inside. Without it the
        // history append re-enters here and appends again, forever.
        context: { skipOrderEffects: true },
      })
    }

    // ── 3. Status email — once per status, ever ───────────────
    const notified = doc.notifiedStatuses ?? []
    if (statusChanged && !notified.includes(doc.status)) {
      const message = orderStatusEmail(doc, config)
      if (message) {
        const outcome = await safeSend(message)
        if (outcome === 'sent') {
          await req.payload.update({
            collection: 'orders',
            id: doc.id,
            data: { notifiedStatuses: [...notified, doc.status] },
            req,
            context: { skipOrderEffects: true },
          })
        }
      }
    }

    // ── 4. Manual re-send ─────────────────────────────────────
    // The escape hatch for a confirmation that failed. An admin ticks the box
    // in the CMS; this sends and unticks it.
    if (doc.resendEmail === true) {
      const outcome = await safeSend(orderConfirmationEmail(doc, config))
      await req.payload.update({
        collection: 'orders',
        id: doc.id,
        data: { resendEmail: false, emailStatus: outcome },
        req,
        context: { skipOrderEffects: true },
      })
    }
  } catch (err) {
    // Never rethrow. An admin changing a dropdown must not see a 500 because
    // Resend was briefly unreachable.
    req.payload.logger.error({ err, msg: `[shop] order effects failed for ${doc.trackId}` })
  }

  return doc
}

/** Wraps the hook so its own writes do not re-enter it. */
export const orderEffectsGuarded: CollectionAfterChangeHook<Order> = async (args) => {
  if (args.context?.skipOrderEffects) return args.doc
  return orderEffects(args)
}

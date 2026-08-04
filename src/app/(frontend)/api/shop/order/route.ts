import { NextResponse } from 'next/server'
import { getCms } from '@/lib/cms/client'
import { getShopConfigInternal } from '@/lib/cms/shop'
import { getOrderInternalByTrackId, reserveAndCreateOrder } from '@/lib/orders'
import { adminNewOrderEmail, orderConfirmationEmail } from '@/lib/email/templates'
import { safeSend } from '@/lib/email/client'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import {
  BD_PHONE_RE,
  EMAIL_RE,
  LIMITS,
  isBracuEmail,
  isDeliveryMethod,
  normalizePhone,
  type DeliveryMethod,
} from '@/lib/shop'

// Writes to Sanity and gates on live shop status — never prerender or cache.
export const dynamic = 'force-dynamic'

/**
 * Orders per IP per hour.
 *
 * Deliberately loose, and the number is load-bearing. BRAC University's campus
 * network puts hundreds of students behind a handful of public addresses, and a
 * merch drop is precisely when they all order within the same hour. A tight
 * per-IP limit does not stop an attacker — they rotate addresses, and this
 * limiter is per-instance in-memory anyway — it only locks out the shop's core
 * audience at its busiest moment. An earlier value of 15 was low enough that
 * the end-to-end test suite tripped it, which is a fair proxy for a real drop.
 *
 * The protections that actually carry weight are elsewhere: the honeypot and
 * fill timer reject scripted submissions, every order is cash-on-delivery so a
 * fake one costs review time rather than money, and cancelling a junk order
 * returns its stock automatically.
 */
const RATE = { limit: 40, windowMs: 60 * 60 * 1000 } as const

/** Nobody reads a checkout form and fills it honestly faster than this. */
const MIN_FILL_MS = 4000

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function bad(error: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error, ...extra }, { status })
}

export async function POST(req: Request) {
  try {
    // Writes need an Editor token. Fail clearly here rather than 401-ing deep
    // inside the Sanity client with a message nobody can act on.
    if (!process.env.SANITY_API_TOKEN) {
      console.error('[shop:order] SANITY_API_TOKEN is not set — cannot accept orders')
      return bad('The shop is temporarily unavailable. Please try again later.', 503)
    }

    const limited = rateLimit(`shop-order:${clientIp(req)}`, RATE.limit, RATE.windowMs)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many orders from this connection. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') return bad('Invalid request body.')

    // ── Spam traps ────────────────────────────────────────────
    // Both answer a decoy success, so a bot learns nothing about which check
    // caught it. Same approach as /api/donate.
    if (str((body as Record<string, unknown>).website)) {
      console.warn('[shop:order] honeypot triggered')
      return NextResponse.json({ ok: true, trackId: null })
    }
    const elapsed = Number((body as Record<string, unknown>).elapsedMs)
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
      console.warn('[shop:order] submitted implausibly fast:', elapsed, 'ms')
      return NextResponse.json({ ok: true, trackId: null })
    }

    const config = await getShopConfigInternal()

    // ── Shop gate ─────────────────────────────────────────────
    // Server-side so the endpoint holds even when posted to directly.
    if (config.status !== 'open') {
      return bad(
        config.closedMessage || 'The shop is not accepting orders right now.',
        403
      )
    }

    const raw = body as Record<string, unknown>

    // ── Customer ──────────────────────────────────────────────
    const customerName = str(raw.customerName)
    const customerEmail = str(raw.customerEmail).toLowerCase()
    const phoneInput = str(raw.customerPhone)
    const customerPhone = normalizePhone(phoneInput)

    if (!customerName) return bad('Please enter your name.')
    if (customerName.length > LIMITS.name) return bad('That name is too long.')

    if (!customerEmail) return bad('Please enter your email — it is where your receipt goes.')
    if (customerEmail.length > LIMITS.email || !EMAIL_RE.test(customerEmail)) {
      return bad('Please enter a valid email address.')
    }

    if (!phoneInput) return bad('Please enter your phone number so we can reach you on delivery.')
    if (!BD_PHONE_RE.test(customerPhone)) {
      return bad('Please enter a valid Bangladeshi mobile number, e.g. 01712345678.')
    }

    // ── Delivery ──────────────────────────────────────────────
    const deliveryMethodRaw = str(raw.deliveryMethod)
    if (!isDeliveryMethod(deliveryMethodRaw)) return bad('Please choose a delivery method.')
    const deliveryMethod: DeliveryMethod = deliveryMethodRaw

    let deliveryAddress: Record<string, string> | undefined
    let campusDetails: Record<string, string> | undefined

    if (deliveryMethod === 'standard') {
      const address = (raw.deliveryAddress ?? {}) as Record<string, unknown>
      const line1 = str(address.line1)
      const line2 = str(address.line2)
      const area = str(address.area)
      const city = str(address.city)
      const postcode = str(address.postcode)

      if (!line1) return bad('Please enter your street address.')
      if (!area) return bad('Please enter your area or thana.')
      if (!city) return bad('Please enter your city or district.')
      if (
        line1.length > LIMITS.addressLine ||
        line2.length > LIMITS.addressLine ||
        area.length > LIMITS.area ||
        city.length > LIMITS.city ||
        postcode.length > LIMITS.postcode
      ) {
        return bad('One or more address fields are too long.')
      }

      deliveryAddress = {
        line1,
        ...(line2 ? { line2 } : {}),
        area,
        city,
        ...(postcode ? { postcode } : {}),
      }
    } else {
      if (config.campusDeliveryEnabled === false) {
        return bad('Campus handover is not available at the moment. Please choose home delivery.')
      }

      // Off by default — free handover is open to anyone, as specified. The
      // team can turn it on from Studio if free delivery is ever abused.
      if (config.requireBracuEmailForCampus && !isBracuEmail(customerEmail)) {
        return bad(
          'Campus handover currently requires a BRACU email address (@bracu.ac.bd or @g.bracu.ac.bd). Please use home delivery instead.'
        )
      }

      const details = (raw.campusDetails ?? {}) as Record<string, unknown>
      const handoverPoint = str(details.handoverPoint)
      const bracuId = str(details.bracuId)

      if (!handoverPoint) return bad('Please choose where on campus we should hand your order over.')
      if (handoverPoint.length > LIMITS.handoverPoint) return bad('That handover point is too long.')
      if (bracuId.length > LIMITS.bracuId) return bad('That BRACU ID is too long.')

      campusDetails = { handoverPoint, ...(bracuId ? { bracuId } : {}) }
    }

    const customerNote = str(raw.customerNote)
    if (customerNote.length > LIMITS.note) return bad('Your note is too long.')

    // ── Place it ──────────────────────────────────────────────
    // Everything below — stock checks, prices, delivery fee, totals — is
    // computed server-side. Nothing the request supplied about money is used.
    const result = await reserveAndCreateOrder(
      {
        items: Array.isArray(raw.items) ? raw.items : [],
        customerName,
        customerEmail,
        customerPhone,
        deliveryMethod,
        deliveryAddress,
        campusDetails,
        customerNote: customerNote || undefined,
        idempotencyKey: str(raw.idempotencyKey) || undefined,
        expectedTotal:
          typeof raw.expectedTotal === 'number' && Number.isFinite(raw.expectedTotal)
            ? raw.expectedTotal
            : undefined,
      },
      config
    )

    if (!result.ok) {
      const status =
        result.code === 'cart_changed' || result.code === 'total_changed'
          ? 409
          : result.code === 'busy'
            ? 503
            : 400
      return NextResponse.json(
        {
          error: result.message,
          code: result.code,
          ...('cart' in result ? { cart: result.cart } : {}),
          ...('totals' in result ? { totals: result.totals } : {}),
        },
        { status }
      )
    }

    // ── Email ─────────────────────────────────────────────────
    // Past this point the order is durable and the stock is reserved. Nothing
    // below may turn a successful purchase into an error response.
    if (!result.replayed) {
      // Re-read so the email reflects exactly what was stored, rather than what
      // we believe we stored.
      const order = await getOrderInternalByTrackId(result.trackId)

      if (order) {
        const outcome = await safeSend(orderConfirmationEmail(order, config))

        try {
          const cms = await getCms()
          await cms.update({
            collection: 'orders',
            id: order.id,
            data: { emailStatus: outcome },
            // Bookkeeping only — it must not re-enter the status/email hook.
            context: { skipOrderEffects: true },
          })
        } catch (err) {
          // Cosmetic bookkeeping. The customer has their order either way.
          console.error('[shop:order] could not record emailStatus', result.trackId, err)
        }

        const adminMail = adminNewOrderEmail(order, config)
        if (adminMail) {
          // Not awaited into the response path: the customer should not wait on
          // the team's notification. Errors are swallowed inside safeSend.
          void safeSend(adminMail)
        }
      } else {
        console.error('[shop:order] order not readable after commit', result.trackId)
      }
    }

    return NextResponse.json({
      ok: true,
      trackId: result.trackId,
      total: result.totals.total,
      replayed: result.replayed,
    })
  } catch (err) {
    console.error('[shop:order]', err)
    return bad('We could not place your order. Please try again.', 500)
  }
}

import { NextResponse } from 'next/server'
import { getShopConfigInternal } from '@/lib/cms/shop'
import { priceCart } from '@/lib/orders'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import { CAMPUS_DELIVERY_FEE } from '@/lib/shop'

// Prices and stock are read live on every call, so this must never be
// prerendered or cached.
export const dynamic = 'force-dynamic'

/**
 * Generous by design. This fires on every cart page view, drawer open and
 * quantity change — it is a read, and throttling it hard would break normal
 * shopping. The endpoint that actually costs something (/api/shop/order) is
 * where the tight limit lives.
 */
const RATE = { limit: 120, windowMs: 60 * 1000 } as const

/**
 * Resolve a cart against live product data.
 *
 * The browser sends only `{productId, variantKey, quantity}`; this returns the
 * titles, prices, stock ceilings and any issues. It is the only way the client
 * ever learns what something costs — see the header of src/lib/cart.ts for why
 * prices never live in localStorage.
 *
 * Always answers 200 with a priced cart, even when every line failed. "Your
 * cart has problems" is a normal state to render, not an error condition, and
 * the client needs the issue list to explain what changed.
 */
export async function POST(req: Request) {
  try {
    const limited = rateLimit(`shop-cart:${clientIp(req)}`, RATE.limit, RATE.windowMs)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
    }

    const config = await getShopConfigInternal()
    // priceCart() sanitises the items itself, so an absent or malformed
    // `items` is answered with an empty cart rather than a 400.
    const cart = await priceCart((body as { items?: unknown }).items, config)

    return NextResponse.json({
      lines: cart.lines,
      issues: cart.issues,
      subtotal: cart.subtotal,
      itemCount: cart.itemCount,
      items: cart.items,
      // Enough config for the client to render a summary without a second
      // round trip. Public fields only — no admin inboxes.
      shop: {
        status: config.status,
        closedMessage: config.closedMessage,
        standardDeliveryFee: config.standardDeliveryFee,
        campusDeliveryFee: CAMPUS_DELIVERY_FEE,
        campusDeliveryEnabled: config.campusDeliveryEnabled,
        campusHandoverPoints: config.campusHandoverPoints,
        estimatedDeliveryDays: config.estimatedDeliveryDays,
        minOrderValue: config.minOrderValue,
        maxQtyPerItem: config.maxQtyPerItem,
        maxItemsPerOrder: config.maxItemsPerOrder,
      },
    })
  } catch (err) {
    console.error('[shop:cart]', err)
    return NextResponse.json({ error: 'Could not load your cart. Please retry.' }, { status: 500 })
  }
}

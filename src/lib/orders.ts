// ============================================================
// Orders — SERVER ONLY.
//
// Cart pricing, stock reservation, order creation, cancellation restore, and
// the masked track lookup. Never import this from a client component: it holds
// the write client and reads customer PII. `npm run check:privacy` fails the
// build if a 'use client' file reaches for it.
//
// ── THE PRICING RULE ──────────────────────────────────────────
// The browser never sends a price. It sends {productId, variantKey, quantity}
// and nothing else that costs money. Every figure on an invoice is computed
// here, from a fresh read of the product document, at the moment of the
// request. A tampered cart can order the wrong thing; it cannot order at the
// wrong price.
// ============================================================

import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { sanityWriteClient } from '@/sanity/lib/writeClient'
import {
  ORDER_BY_IDEMPOTENCY_KEY_INTERNAL_QUERY,
  ORDER_BY_TRACK_ID_INTERNAL_QUERY,
  ORDER_STOCK_STATE_INTERNAL_QUERY,
  PRODUCTS_BY_IDS_QUERY,
  TRACK_ID_EXISTS_INTERNAL_QUERY,
} from '@/sanity/lib/queries'
import type {
  OrderInternal,
  ProductForCart,
  ProductVariant,
  PublicOrder,
  ShopConfigInternal,
} from '@/sanity/lib/types'
import type { CartItem } from '@/lib/cart'
import { isVariantKey, sanitizeCart } from '@/lib/cart'
import { availableStock, findVariant, maxPurchasable, variantPrice } from '@/lib/product'
import {
  CAMPUS_DELIVERY_FEE,
  generateTrackId,
  isTrackIdShape,
  maskAddress,
  maskPhone,
  normalizeTrackId,
  type DeliveryMethod,
} from '@/lib/shop'

// ── Shapes ────────────────────────────────────────────────────

export type CartIssueCode =
  /** The product was deleted, unpublished, or withdrawn from sale. */
  | 'product_unavailable'
  /** The variant was removed from the product or switched off. */
  | 'variant_unavailable'
  /** Nothing left on the shelf. */
  | 'out_of_stock'
  /** Requested more than is available, or more than a cap allows. */
  | 'quantity_reduced'
  /** The whole-cart unit cap trimmed this line. */
  | 'order_limit_reached'

export interface CartIssue {
  code: CartIssueCode
  productId: string
  variantKey: string
  /** Best-effort name for the message — may be absent if the product is gone. */
  productTitle?: string
  variantLabel?: string
  requested?: number
  available?: number
  /** Customer-facing, already written to be shown verbatim. */
  message: string
}

/** A cart line resolved against live product data and priced. */
export interface PricedLine {
  productId: string
  variantKey: string
  productTitle: string
  productSlug: string
  variantLabel: string
  sku?: string
  unitPrice: number
  quantity: number
  lineTotal: number
  imageUrl?: string
  /**
   * Units on the shelf, or `null` when the product does not track inventory.
   *
   * Null rather than `Infinity` because this crosses a JSON boundary, and
   * `JSON.stringify(Infinity)` is `null` anyway — better to say so deliberately
   * than to let the client receive a null it was not told to expect. Use
   * `maxQuantity` for the stepper ceiling; it is always finite.
   */
  available: number | null
  /** Ceiling the quantity stepper should enforce. Always a finite number. */
  maxQuantity: number
}

export interface PricedCart {
  lines: PricedLine[]
  issues: CartIssue[]
  subtotal: number
  /** Total units, not lines. */
  itemCount: number
  /** The surviving, clamped cart — the client writes this back to localStorage. */
  items: CartItem[]
}

export interface OrderTotals {
  subtotal: number
  deliveryFee: number
  total: number
}

// ── Fetch ─────────────────────────────────────────────────────

/**
 * Read the products behind a set of cart lines.
 *
 * Uncached (`revalidate: 0`) on purpose. Stock and price are the two things
 * this call exists to check, and both change without warning — a 60-second
 * cache would let two customers reserve the same last unit.
 */
export async function fetchCartProducts(ids: string[]): Promise<ProductForCart[]> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return []
  return (await sanityFetch<ProductForCart[]>(PRODUCTS_BY_IDS_QUERY, { ids: unique }, 0)) ?? []
}

function imageUrlFor(product: ProductForCart): string | undefined {
  if (!product.image) return undefined
  try {
    return urlFor(product.image).width(160).height(160).fit('crop').url()
  } catch {
    // A malformed asset ref must not take down an order. The email and cart
    // both degrade to a placeholder.
    return undefined
  }
}

// ── Pricing ───────────────────────────────────────────────────

/**
 * Resolve and price cart lines against products already fetched.
 *
 * Pure, so the reservation transaction can re-run it on each retry with a fresh
 * read without paying for another round trip through the async layer.
 *
 * Unavailable lines are reported as issues and dropped rather than silently
 * removed. The customer picked those items deliberately; a cart that quietly
 * shrinks between two page loads reads as a bug, and they will not know whether
 * the order they eventually place is the one they meant.
 */
export function priceCartFrom(
  products: ProductForCart[],
  items: CartItem[],
  config: ShopConfigInternal
): PricedCart {
  const byId = new Map(products.map((p) => [p._id, p]))
  const lines: PricedLine[] = []
  const issues: CartIssue[] = []

  for (const item of items) {
    const product = byId.get(item.productId)

    if (!product || product.isActive === false) {
      issues.push({
        code: 'product_unavailable',
        productId: item.productId,
        variantKey: item.variantKey,
        productTitle: product?.title,
        message: product
          ? `“${product.title}” is no longer available and has been removed from your cart.`
          : 'An item in your cart is no longer available and has been removed.',
      })
      continue
    }

    const variant: ProductVariant | undefined = findVariant(product, item.variantKey)

    if (!variant || variant.isActive === false) {
      issues.push({
        code: 'variant_unavailable',
        productId: item.productId,
        variantKey: item.variantKey,
        productTitle: product.title,
        variantLabel: variant?.label,
        message: variant
          ? `“${product.title}” (${variant.label}) is no longer available and has been removed from your cart.`
          : `An option of “${product.title}” is no longer available and has been removed from your cart.`,
      })
      continue
    }

    const available = availableStock(product, variant)

    if (available <= 0) {
      issues.push({
        code: 'out_of_stock',
        productId: item.productId,
        variantKey: item.variantKey,
        productTitle: product.title,
        variantLabel: variant.label,
        available: 0,
        message: `“${product.title}” (${variant.label}) has sold out and has been removed from your cart.`,
      })
      continue
    }

    const maxQuantity = maxPurchasable(product, variant, config.maxQtyPerItem)
    let quantity = item.quantity

    if (quantity > maxQuantity) {
      issues.push({
        code: 'quantity_reduced',
        productId: item.productId,
        variantKey: item.variantKey,
        productTitle: product.title,
        variantLabel: variant.label,
        requested: quantity,
        available: maxQuantity,
        message:
          available < item.quantity
            ? `Only ${maxQuantity} left of “${product.title}” (${variant.label}) — your quantity was reduced.`
            : `You can order at most ${maxQuantity} of “${product.title}” (${variant.label}) — your quantity was reduced.`,
      })
      quantity = maxQuantity
    }

    if (quantity < 1) continue

    const unitPrice = variantPrice(product, variant)

    lines.push({
      productId: product._id,
      variantKey: variant._key,
      productTitle: product.title,
      productSlug: product.slug?.current ?? '',
      variantLabel: variant.label,
      sku: variant.sku,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      imageUrl: imageUrlFor(product),
      available: Number.isFinite(available) ? available : null,
      maxQuantity,
    })
  }

  // Whole-cart unit cap. Applied after per-line clamping, trimming from the end
  // so the items added first — the ones the customer most wanted — survive.
  let unitsSoFar = 0
  const capped: PricedLine[] = []
  for (const line of lines) {
    const room = config.maxItemsPerOrder - unitsSoFar
    if (room <= 0) {
      issues.push({
        code: 'order_limit_reached',
        productId: line.productId,
        variantKey: line.variantKey,
        productTitle: line.productTitle,
        variantLabel: line.variantLabel,
        requested: line.quantity,
        available: 0,
        message: `An order can hold at most ${config.maxItemsPerOrder} items, so “${line.productTitle}” (${line.variantLabel}) was removed.`,
      })
      continue
    }
    const quantity = Math.min(line.quantity, room)
    if (quantity < line.quantity) {
      issues.push({
        code: 'order_limit_reached',
        productId: line.productId,
        variantKey: line.variantKey,
        productTitle: line.productTitle,
        variantLabel: line.variantLabel,
        requested: line.quantity,
        available: quantity,
        message: `An order can hold at most ${config.maxItemsPerOrder} items, so “${line.productTitle}” (${line.variantLabel}) was reduced to ${quantity}.`,
      })
    }
    unitsSoFar += quantity
    capped.push({ ...line, quantity, lineTotal: line.unitPrice * quantity })
  }

  const subtotal = capped.reduce((sum, line) => sum + line.lineTotal, 0)

  return {
    lines: capped,
    issues,
    subtotal,
    itemCount: unitsSoFar,
    items: capped.map((line) => ({
      productId: line.productId,
      variantKey: line.variantKey,
      quantity: line.quantity,
    })),
  }
}

/** Fetch-and-price in one step, for the cart endpoint. */
export async function priceCart(
  rawItems: unknown,
  config: ShopConfigInternal
): Promise<PricedCart> {
  const items = sanitizeCart(rawItems, config.maxQtyPerItem)
  if (items.length === 0) {
    return { lines: [], issues: [], subtotal: 0, itemCount: 0, items: [] }
  }
  const products = await fetchCartProducts(items.map((i) => i.productId))
  return priceCartFrom(products, items, config)
}

// ── Totals ────────────────────────────────────────────────────

/**
 * Subtotal plus delivery.
 *
 * The fee comes from the config or, for campus handover, from a constant — never
 * from the request. Campus is asserted against CAMPUS_DELIVERY_FEE rather than
 * a config field so that no admin edit and no crafted payload can put a charge
 * on a pickup the team does by hand.
 */
export function computeTotals(
  subtotal: number,
  deliveryMethod: DeliveryMethod,
  config: ShopConfigInternal
): OrderTotals {
  const deliveryFee =
    deliveryMethod === 'campus' ? CAMPUS_DELIVERY_FEE : Math.max(0, Math.round(config.standardDeliveryFee))
  return { subtotal, deliveryFee, total: subtotal + deliveryFee }
}

// ════════════════════════════════════════════════════════════════════════
// STOCK RESERVATION + ORDER CREATION
//
// The correctness centre of the shop. Read the comment on
// `reserveAndCreateOrder()` before changing anything below.
// ════════════════════════════════════════════════════════════════════════

/** How many times a compare-and-set conflict is retried before giving up. */
const MAX_RESERVATION_ATTEMPTS = 5

/** How many track IDs to generate before concluding something is wrong. */
const MAX_TRACK_ID_ATTEMPTS = 5

export interface PlaceOrderInput {
  items: CartItem[]
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: {
    line1?: string
    line2?: string
    area?: string
    city?: string
    postcode?: string
  }
  campusDetails?: { handoverPoint?: string; bracuId?: string }
  customerNote?: string
  /** Client-generated, stable across retries of one checkout attempt. */
  idempotencyKey?: string
  /** The total the customer was shown. Guards against being charged more. */
  expectedTotal?: number
}

export type PlaceOrderResult =
  | {
      ok: true
      orderId: string
      trackId: string
      totals: OrderTotals
      lines: PricedLine[]
      /** True when this request replayed an order that already existed. */
      replayed: boolean
    }
  | { ok: false; code: 'empty_cart'; message: string }
  | { ok: false; code: 'cart_changed'; message: string; cart: PricedCart }
  | { ok: false; code: 'min_order'; message: string; cart: PricedCart }
  | {
      ok: false
      code: 'total_changed'
      message: string
      cart: PricedCart
      totals: OrderTotals
    }
  | { ok: false; code: 'busy'; message: string }

/** Sanity array members need a `_key` unique within their array. */
function arrayKey(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

/**
 * A track ID nothing else is using.
 *
 * 40 bits of entropy makes a collision vanishingly unlikely, but "vanishingly"
 * is not "never", and two orders sharing a track ID would show one customer the
 * other's order. Cheap to check, so it gets checked.
 */
async function reserveTrackId(prefix: string): Promise<string> {
  for (let attempt = 0; attempt < MAX_TRACK_ID_ATTEMPTS; attempt++) {
    const trackId = generateTrackId(prefix)
    const exists = await sanityFetch<boolean>(TRACK_ID_EXISTS_INTERNAL_QUERY, { trackId }, 0)
    if (!exists) return trackId
  }
  throw new Error('[shop] could not allocate a unique track ID after repeated attempts')
}

/** Idempotency keys become part of a document id, so keep them id-safe. */
function normalizeIdempotencyKey(key: string | undefined): string | undefined {
  if (typeof key !== 'string') return undefined
  const cleaned = key.trim()
  return /^[A-Za-z0-9-]{8,64}$/.test(cleaned) ? cleaned : undefined
}

type ExistingOrder = { _id: string; trackId: string } & Partial<OrderTotals>

async function findOrderByIdempotencyKey(key: string): Promise<ExistingOrder | null> {
  return await sanityFetch<ExistingOrder | null>(
    ORDER_BY_IDEMPOTENCY_KEY_INTERNAL_QUERY,
    { key },
    0
  )
}

/**
 * Totals for a replayed order, taken from what was actually stored.
 *
 * A replay is answered with the original order, so it must also be answered
 * with the original order's money. Returning zeroes would put "৳0" on the
 * customer's confirmation screen for an order they genuinely owe for.
 */
function totalsOf(order: ExistingOrder): OrderTotals {
  return {
    subtotal: order.subtotal ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    total: order.total ?? 0,
  }
}

/**
 * Place an order: reserve the stock and record the order, atomically.
 *
 * ── WHY IT IS SHAPED LIKE THIS ────────────────────────────────
 *
 * Everything happens in ONE Sanity transaction — every stock decrement plus
 * the order document. Sanity applies a transaction whole or not at all, which
 * rules out the two failure modes that matter:
 *
 *   • Stock decremented but the order lost. The customer is charged nothing,
 *     the team ships nothing, and the inventory is quietly wrong forever.
 *   • Order recorded but stock not taken. The same unit gets sold twice and
 *     somebody has to send an apology.
 *
 * Overselling is prevented by compare-and-set, not by locking. Each product
 * patch is guarded by `ifRevisionId(_rev)` — the revision read moments earlier.
 * If anyone changed that product in between, Sanity rejects the whole
 * transaction and the loop retries against fresh stock. Two customers racing
 * for the last unit therefore cannot both win: one commits, the other retries,
 * re-reads a stock of 0, and is told it sold out.
 *
 * Decrements are grouped one-patch-per-product. A cart holding two sizes of the
 * same tee would otherwise produce two patches against one document inside a
 * single transaction, and the second `ifRevisionId` would fail against the
 * revision the first had just created — a self-inflicted conflict that no
 * amount of retrying fixes.
 *
 * Untracked products (`trackInventory: false`) are skipped entirely: a
 * made-to-order item has no shelf to take anything off.
 *
 * Idempotency uses the key as the document id, so `create` — which refuses to
 * overwrite — is what enforces uniqueness. A double-click cannot produce two
 * orders even if both requests are in flight at once, because the second
 * transaction fails as a whole and takes its stock decrements down with it.
 */
export async function reserveAndCreateOrder(
  input: PlaceOrderInput,
  config: ShopConfigInternal
): Promise<PlaceOrderResult> {
  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)
  const orderId = idempotencyKey ? `order-${idempotencyKey}` : undefined

  // Fast path: an obvious replay (the customer hit the button twice, seconds
  // apart). The transaction below is what makes the truly concurrent case safe.
  if (idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(idempotencyKey)
    if (existing) {
      return {
        ok: true,
        orderId: existing._id,
        trackId: existing.trackId,
        totals: totalsOf(existing),
        lines: [],
        replayed: true,
      }
    }
  }

  const items = sanitizeCart(input.items, config.maxQtyPerItem)
  if (items.length === 0) {
    return { ok: false, code: 'empty_cart', message: 'Your cart is empty.' }
  }

  const trackId = await reserveTrackId(config.orderPrefix)

  for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt++) {
    // Re-read on every attempt. A retry exists precisely because the data moved,
    // so reusing the previous read would retry against the stale revision and
    // fail identically forever.
    const products = await fetchCartProducts(items.map((i) => i.productId))
    const cart = priceCartFrom(products, items, config)

    if (cart.issues.length > 0) {
      return {
        ok: false,
        code: 'cart_changed',
        message: 'Some items changed while you were checking out. Please review your cart.',
        cart,
      }
    }

    if (cart.lines.length === 0) {
      return { ok: false, code: 'empty_cart', message: 'Your cart is empty.' }
    }

    if (cart.subtotal < config.minOrderValue) {
      return {
        ok: false,
        code: 'min_order',
        message: `Orders start at ৳${config.minOrderValue.toLocaleString('en-BD')}. Please add a little more.`,
        cart,
      }
    }

    const totals = computeTotals(cart.subtotal, input.deliveryMethod, config)

    // The customer agreed to a number on screen. If the shop's own figure has
    // since moved — an admin repriced mid-checkout — stop and make them
    // re-confirm rather than silently charging a different amount. This guards
    // the customer, not the shop.
    if (typeof input.expectedTotal === 'number' && input.expectedTotal !== totals.total) {
      return {
        ok: false,
        code: 'total_changed',
        message: 'The price changed while you were checking out. Please review the new total.',
        cart,
        totals,
      }
    }

    const byId = new Map(products.map((p) => [p._id, p]))

    // Group decrements per product — see the note above on self-inflicted
    // conflicts.
    const patches = new Map<string, { rev: string; decrements: Record<string, number> }>()
    for (const line of cart.lines) {
      const product = byId.get(line.productId)
      if (!product || product.trackInventory === false) continue

      // The key came back from Sanity via findVariant(), not from the request.
      // Re-checked anyway because it is about to be interpolated into a patch
      // path, and a guard that costs nothing on a path that matters is worth
      // keeping.
      if (!isVariantKey(line.variantKey)) {
        throw new Error(`[shop] refusing to build a patch path for key: ${line.variantKey}`)
      }

      const entry = patches.get(product._id) ?? { rev: product._rev, decrements: {} }
      const path = `variants[_key=="${line.variantKey}"].stock`
      entry.decrements[path] = (entry.decrements[path] ?? 0) + line.quantity
      patches.set(product._id, entry)
    }

    const now = new Date().toISOString()
    const doc = {
      _type: 'order' as const,
      ...(orderId ? { _id: orderId } : {}),
      trackId,
      status: 'placed' as const,
      paymentMethod: 'cod' as const,
      paymentStatus: 'unpaid' as const,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      deliveryMethod: input.deliveryMethod,
      // Only the fields belonging to the chosen method are stored. A campus
      // order therefore cannot carry a home address alongside its free
      // handover, whatever the request contained.
      ...(input.deliveryMethod === 'standard' && input.deliveryAddress
        ? { deliveryAddress: input.deliveryAddress }
        : {}),
      ...(input.deliveryMethod === 'campus' && input.campusDetails
        ? { campusDetails: input.campusDetails }
        : {}),
      ...(input.customerNote ? { customerNote: input.customerNote } : {}),
      items: cart.lines.map((line) => ({
        _key: arrayKey(),
        _type: 'orderItem' as const,
        productTitle: line.productTitle,
        variantLabel: line.variantLabel,
        ...(line.sku ? { sku: line.sku } : {}),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        lineTotal: line.lineTotal,
        productId: line.productId,
        variantKey: line.variantKey,
        productSlug: line.productSlug,
        // Recorded now, so a later cancellation returns exactly what was taken
        // regardless of how trackInventory is configured by then.
        stockTaken: patches.has(line.productId),
        ...(line.imageUrl ? { imageUrl: line.imageUrl } : {}),
        product: { _type: 'reference' as const, _ref: line.productId, _weak: true },
      })),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      placedAt: now,
      statusHistory: [
        { _key: arrayKey(), _type: 'statusEvent' as const, status: 'placed', at: now },
      ],
      // Pre-marked, so the webhook that fires on this very creation cannot also
      // send a confirmation. The route below owns that email; if its send fails
      // it sets emailStatus and an admin re-sends from the Studio.
      notifiedStatuses: ['placed'],
      stockReserved: true,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    }

    const txn = sanityWriteClient.transaction()
    for (const [productId, { rev, decrements }] of patches) {
      txn.patch(productId, (patch) => patch.ifRevisionId(rev).dec(decrements))
    }
    txn.create(doc)

    try {
      // 'sync' so the order is queryable the instant this resolves — the
      // customer is redirected straight to the track page for it.
      const result = await txn.commit({ visibility: 'sync' })
      const createdId = orderId ?? result.results?.find((r) => r.operation === 'create')?.id

      return {
        ok: true,
        orderId: createdId ?? '',
        trackId,
        totals,
        lines: cart.lines,
        replayed: false,
      }
    } catch (err) {
      // Two different 409s land here: a revision conflict (retry) and a
      // duplicate document id (a genuinely concurrent replay). Rather than
      // parsing error text, ask the dataset which one it was.
      if (idempotencyKey) {
        const existing = await findOrderByIdempotencyKey(idempotencyKey)
        if (existing) {
          return {
            ok: true,
            orderId: existing._id,
            trackId: existing.trackId,
            totals: totalsOf(existing),
            lines: cart.lines,
            replayed: true,
          }
        }
      }

      const isLastAttempt = attempt === MAX_RESERVATION_ATTEMPTS - 1
      if (isLastAttempt) {
        console.error('[shop] reservation failed after retries', err)
        return {
          ok: false,
          code: 'busy',
          message:
            'The shop is unusually busy right now and we could not confirm stock. Please try again in a moment.',
        }
      }
      // Otherwise: contention. Loop, re-read, re-price, retry.
    }
  }

  return {
    ok: false,
    code: 'busy',
    message: 'We could not confirm stock. Please try again in a moment.',
  }
}

export { isTrackIdShape }

// ════════════════════════════════════════════════════════════════════════
// CANCELLATION RESTORE + PUBLIC LOOKUP
// ════════════════════════════════════════════════════════════════════════

export type RestoreResult =
  | { restored: true; units: number }
  | {
      restored: false
      reason: 'not_found' | 'not_cancelled' | 'never_reserved' | 'already_restored' | 'busy'
    }

/**
 * Return a cancelled order's stock to inventory. Exactly once, ever.
 *
 * The webhook that calls this can fire more than once for one cancellation:
 * Sanity retries on a non-2xx, and an admin can re-save the document. Adding
 * the same units back twice would invent inventory that does not exist and
 * lead straight to overselling it.
 *
 * `stockRestoredAt` is the guard, and it is set inside the same transaction as
 * the increments, under `ifRevisionId`. Two concurrent restores therefore
 * cannot both commit — the loser's revision check fails, it re-reads, sees the
 * timestamp, and stops.
 *
 * What gets returned comes from the order's own `stockTaken` flags, not from
 * asking the product what it does now. If inventory tracking was toggled
 * between the order and the cancellation, asking the product would either
 * strand the units or conjure stock that was never taken.
 */
export async function restoreStockForOrder(orderId: string): Promise<RestoreResult> {
  for (let attempt = 0; attempt < MAX_RESERVATION_ATTEMPTS; attempt++) {
    const order = await sanityFetch<{
      _id: string
      _rev: string
      status: string
      stockReserved?: boolean
      stockRestoredAt?: string | null
      items?: { productId: string; variantKey: string; quantity: number; stockTaken?: boolean }[]
    } | null>(ORDER_STOCK_STATE_INTERNAL_QUERY, { id: orderId }, 0)

    if (!order) return { restored: false, reason: 'not_found' }
    if (order.status !== 'cancelled') return { restored: false, reason: 'not_cancelled' }
    if (order.stockReserved !== true) return { restored: false, reason: 'never_reserved' }
    if (order.stockRestoredAt) return { restored: false, reason: 'already_restored' }

    const lines = (order.items ?? []).filter(
      (item) => item.stockTaken !== false && isVariantKey(item.variantKey) && item.quantity > 0
    )

    // Only products that still exist can be patched — a transaction naming a
    // deleted document fails as a whole, which would block the restore of every
    // other line in the order.
    const products = await fetchCartProducts(lines.map((l) => l.productId))
    const byId = new Map(products.map((p) => [p._id, p]))

    const patches = new Map<string, { rev: string; increments: Record<string, number> }>()
    let units = 0
    for (const line of lines) {
      const product = byId.get(line.productId)
      if (!product) continue
      const entry = patches.get(product._id) ?? { rev: product._rev, increments: {} }
      const path = `variants[_key=="${line.variantKey}"].stock`
      entry.increments[path] = (entry.increments[path] ?? 0) + line.quantity
      patches.set(product._id, entry)
      units += line.quantity
    }

    const txn = sanityWriteClient.transaction()
    for (const [productId, { rev, increments }] of patches) {
      txn.patch(productId, (patch) => patch.ifRevisionId(rev).inc(increments))
    }
    // Stamped in the same transaction as the increments. If this patch fails,
    // no stock moved either.
    txn.patch(order._id, (patch) =>
      patch.ifRevisionId(order._rev).set({ stockRestoredAt: new Date().toISOString() })
    )

    try {
      await txn.commit({ visibility: 'sync' })
      return { restored: true, units }
    } catch (err) {
      if (attempt === MAX_RESERVATION_ATTEMPTS - 1) {
        console.error('[shop] stock restore failed after retries', orderId, err)
        return { restored: false, reason: 'busy' }
      }
      // Contention — loop, re-read, and let the guards decide again.
    }
  }
  return { restored: false, reason: 'busy' }
}

// ── Public lookup ─────────────────────────────────────────────

/**
 * Strip an order down to what a track-page visitor may see.
 *
 * Built field by field rather than by spreading and deleting. A spread would
 * mean every field added to the order schema in future is published by default
 * and has to be remembered about; this way the default is that a new field
 * stays private until someone deliberately adds it here.
 */
function toPublicOrder(order: OrderInternal, estimatedDeliveryDays?: string): PublicOrder {
  return {
    trackId: order.trackId,
    status: order.status,
    paymentStatus: order.paymentStatus,
    placedAt: order.placedAt,
    // Kept: the buyer has to recognise this as their own order.
    customerName: order.customerName,
    // Dropped entirely: customerEmail, deliveryAddress.line1/line2/postcode,
    // campusDetails.bracuId, adminNotes, idempotencyKey.
    maskedPhone: maskPhone(order.customerPhone ?? ''),
    deliveryMethod: order.deliveryMethod,
    maskedAddress:
      order.deliveryMethod === 'campus'
        ? 'BRACU campus'
        : maskAddress(order.deliveryAddress?.area, order.deliveryAddress?.city),
    campusHandoverPoint: order.campusDetails?.handoverPoint,
    items: (order.items ?? []).map((item) => ({
      productTitle: item.productTitle,
      variantLabel: item.variantLabel,
      sku: item.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineTotal: item.lineTotal,
      productId: item.productId,
      variantKey: item.variantKey,
      productSlug: item.productSlug,
      imageUrl: item.imageUrl,
    })),
    subtotal: order.subtotal,
    deliveryFee: order.deliveryFee,
    total: order.total,
    statusHistory: order.statusHistory ?? [],
    cancellationReason: order.cancellationReason,
    estimatedDeliveryDays,
  }
}

/** SERVER ONLY — the unmasked order, for building emails. */
export async function getOrderInternalByTrackId(trackId: string): Promise<OrderInternal | null> {
  return await sanityFetch<OrderInternal | null>(
    ORDER_BY_TRACK_ID_INTERNAL_QUERY,
    { trackId },
    0
  )
}

/**
 * Look up an order for the public track page.
 *
 * Accepts whatever the customer typed. The shape is validated before the
 * dataset is touched so a junk string costs nothing, and a bare code with no
 * prefix gets the configured one prepended — people copy the digits and leave
 * the "MT-" behind more often than not.
 *
 * Returns null for both "no such order" and "that is not a track ID", so the
 * page cannot be used to tell the difference.
 */
export async function getOrderByTrackId(
  raw: string,
  config: Pick<ShopConfigInternal, 'orderPrefix' | 'estimatedDeliveryDays'>
): Promise<PublicOrder | null> {
  const normalized = normalizeTrackId(raw ?? '')
  if (!normalized) return null

  const trackId = normalized.includes('-')
    ? normalized
    : `${config.orderPrefix}-${normalized}`

  if (!isTrackIdShape(trackId)) return null

  const order = await getOrderInternalByTrackId(trackId)
  if (!order) return null

  return toPublicOrder(order, config.estimatedDeliveryDays)
}

export { toPublicOrder }

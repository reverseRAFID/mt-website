// ============================================================
// Orders — SERVER ONLY.
//
// Cart pricing, stock reservation, order creation, cancellation restore, and
// the masked track lookup. Never import this from a client component: it reads
// customer PII. `npm run check:privacy` fails the build if a 'use client' file
// reaches for it.
//
// ── THE PRICING RULE ──────────────────────────────────────────
// The browser never sends a price. It sends {productId, variantKey, quantity}
// and nothing else that costs money. Every figure on an invoice is computed
// here, from a fresh read of the product document, at the moment of the
// request. A tampered cart can order the wrong thing; it cannot order at the
// wrong price.
// ============================================================

import type { ClientSession, Connection } from 'mongoose'

import type { Order, Product } from '@/payload-types'

import { getCms } from '@/lib/cms/client'
import { relativeUrl, sizeUrl } from '@/lib/cms/media'
import type { ShopConfigInternal } from '@/lib/cms/shop'
import type { CartItem } from '@/lib/cart'
import { isVariantKey, sanitizeCart } from '@/lib/cart'
import { availableStock, findVariant, maxPurchasable, variantPrice } from '@/lib/product'
import {
  CAMPUS_DELIVERY_FEE,
  type DeliveryMethod,
  type OrderStatus,
  type PaymentStatus,
  generateTrackId,
  isTrackIdShape,
  maskAddress,
  normalizeTrackId,
} from '@/lib/shop'

type ProductVariant = NonNullable<Product['variants']>[number]

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

export interface OrderItem {
  productTitle: string
  variantLabel: string
  sku?: string | null
  quantity: number
  unitPrice: number
  lineTotal: number
  productId: string
  variantKey: string
  productSlug?: string | null
  imageUrl?: string | null
  /** Whether this line actually decremented inventory when the order was placed. */
  stockTaken?: boolean | null
}

export interface OrderStatusEvent {
  status: string
  at: string
  note?: string | null
}

/** SERVER ONLY — the raw order, PII included. */
export type OrderInternal = Order

/**
 * The masked order the track page renders.
 *
 * `customerName` survives because the buyer needs to recognise their own order;
 * everything that could be used to find or contact them at home does not. There
 * is no email, no street address, no postcode, and the phone is reduced to its
 * last three digits.
 */
export interface PublicOrder {
  trackId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  placedAt: string
  customerName: string
  /** Already masked, e.g. "••••••789". Safe to render directly. */
  maskedPhone: string
  deliveryMethod: DeliveryMethod
  /** Already coarsened to area + city, e.g. "Mirpur, Dhaka". */
  maskedAddress: string
  campusHandoverPoint?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  statusHistory: OrderStatusEvent[]
  cancellationReason?: string
  estimatedDeliveryDays?: string
}

// ── Fetch ─────────────────────────────────────────────────────

/**
 * Read the products behind a set of cart lines.
 *
 * Uncached on purpose. Stock and price are the two things this call exists to
 * check, and both change without warning — serving them from a cache would let
 * two customers reserve the same last unit.
 */
export async function fetchCartProducts(ids: string[]): Promise<Product[]> {
  const unique = [...new Set(ids)].filter(Boolean)
  if (unique.length === 0) return []
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'products',
    depth: 1, // populate the first image, for the cart thumbnail and the email
    limit: unique.length,
    where: { id: { in: unique } },
  })
  return docs
}

// ── Pricing ───────────────────────────────────────────────────

/**
 * Resolve and price cart lines against products already fetched.
 *
 * Pure, so the reservation can re-run it on a retry with a fresh read without
 * paying for another round trip through the async layer.
 *
 * Unavailable lines are reported as issues and dropped rather than silently
 * removed. The customer picked those items deliberately; a cart that quietly
 * shrinks between two page loads reads as a bug, and they will not know whether
 * the order they eventually place is the one they meant.
 */
export function priceCartFrom(
  products: Product[],
  items: CartItem[],
  config: ShopConfigInternal
): PricedCart {
  const byId = new Map(products.map((p) => [p.id, p]))
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
      productId: product.id,
      variantKey: variant.id ?? '',
      productTitle: product.title,
      productSlug: product.slug ?? '',
      variantLabel: variant.label,
      sku: variant.sku ?? undefined,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      // The stored 160x160 crop, as a RELATIVE path.
      //
      // Deliberately not absolute. This value is frozen into the order and
      // outlives everything around it: the product can be deleted, and the site
      // can move origin. An absolute URL baked in at order time would rot on the
      // day the domain changes and break every historical order's thumbnail —
      // and it would also be a foreign host to next/image on the track page.
      // Anything that needs it absolute (an email, an OG tag) calls
      // absoluteUrl() at the moment it sends, when it knows the origin.
      imageUrl: relativeUrl(sizeUrl(product.images?.[0], 'email')) ?? undefined,
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
 * The fee comes from the config or, for campus handover, from a constant —
 * never from the request. Campus is asserted against CAMPUS_DELIVERY_FEE rather
 * than a config field so that no admin edit and no crafted payload can put a
 * charge on a pickup the team does by hand.
 */
export function computeTotals(
  subtotal: number,
  deliveryMethod: DeliveryMethod,
  config: ShopConfigInternal
): OrderTotals {
  const deliveryFee =
    deliveryMethod === 'campus'
      ? CAMPUS_DELIVERY_FEE
      : Math.max(0, Math.round(config.standardDeliveryFee))
  return { subtotal, deliveryFee, total: subtotal + deliveryFee }
}

// ════════════════════════════════════════════════════════════════════════
// STOCK RESERVATION + ORDER CREATION
//
// The correctness centre of the shop. Read the comment on
// `reserveAndCreateOrder()` before changing anything below.
// ════════════════════════════════════════════════════════════════════════

/** How many times a losing race is retried before giving up. */
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

/** The bits of the Mongo adapter this module reaches into directly. */
type MongoAdapter = {
  connection: Connection
  sessions: Record<string, ClientSession>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  collections: Record<string, any>
  beginTransaction: () => Promise<string>
  commitTransaction: (id: string) => Promise<void>
  rollbackTransaction: (id: string) => Promise<void>
}

/** Thrown inside the reservation when a line lost its race for the last unit. */
class LostRace extends Error {}

/**
 * A track ID nothing else is using.
 *
 * 40 bits of entropy makes a collision vanishingly unlikely, but "vanishingly"
 * is not "never", and two orders sharing a track ID would show one customer the
 * other's order. Cheap to check, so it gets checked.
 */
async function reserveTrackId(prefix: string): Promise<string> {
  const cms = await getCms()
  for (let attempt = 0; attempt < MAX_TRACK_ID_ATTEMPTS; attempt++) {
    const trackId = generateTrackId(prefix)
    const { totalDocs } = await cms.count({
      collection: 'orders',
      where: { trackId: { equals: trackId } },
    })
    if (totalDocs === 0) return trackId
  }
  throw new Error('[shop] could not allocate a unique track ID after repeated attempts')
}

/** Idempotency keys are stored and compared verbatim, so keep them well-formed. */
function normalizeIdempotencyKey(key: string | undefined): string | undefined {
  if (typeof key !== 'string') return undefined
  const cleaned = key.trim()
  return /^[A-Za-z0-9-]{8,64}$/.test(cleaned) ? cleaned : undefined
}

async function findOrderByIdempotencyKey(key: string) {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    where: { idempotencyKey: { equals: key } },
    select: { trackId: true, subtotal: true, deliveryFee: true, total: true },
  })
  return docs[0] ?? null
}

/**
 * Place an order: reserve the stock and record the order, atomically.
 *
 * ── WHY IT IS SHAPED LIKE THIS ────────────────────────────────
 *
 * Everything happens in ONE MongoDB transaction — every stock decrement plus
 * the order document. A transaction applies whole or not at all, which rules
 * out the two failure modes that matter:
 *
 *   • Stock decremented but the order lost. The customer is charged nothing,
 *     the team ships nothing, and the inventory is quietly wrong forever.
 *   • Order recorded but stock not taken. The same unit gets sold twice and
 *     somebody has to send an apology.
 *
 * ── HOW OVERSELLING IS PREVENTED ──────────────────────────────
 *
 * Not by locking, and not by re-reading. Each decrement is a single
 * conditional update:
 *
 *     { _id, variants: { $elemMatch: { id, stock: { $gte: qty } } } }
 *     { $inc: { 'variants.$[v].stock': -qty } }
 *
 * MongoDB matches and updates one document atomically, so the `stock >= qty`
 * test and the decrement cannot be separated by another writer. If somebody
 * else took the last unit in between, the filter simply stops matching,
 * `matchedCount` is 0, and this attempt is abandoned and retried against fresh
 * stock. Two customers racing for the last unit therefore cannot both win: one
 * commits, the other re-reads a stock of 0 and is told it sold out.
 *
 * This is strictly stronger than the Sanity implementation it replaces, which
 * guarded a whole product document with `ifRevisionId` — there, any unrelated
 * edit to the product forced a retry. Here the condition is on the exact
 * variant's stock, so only a genuine contest for the same units causes one.
 *
 * Untracked products (`trackInventory: false`) are skipped entirely: a
 * made-to-order item has no shelf to take anything off.
 *
 * ── IDEMPOTENCY ───────────────────────────────────────────────
 * A key is looked up before the transaction (the common double-click) and again
 * after a failure (the genuinely concurrent case), so a retried request is
 * answered with the original order rather than creating a second one.
 */
export async function reserveAndCreateOrder(
  input: PlaceOrderInput,
  config: ShopConfigInternal
): Promise<PlaceOrderResult> {
  const cms = await getCms()
  const db = cms.db as unknown as MongoAdapter

  const idempotencyKey = normalizeIdempotencyKey(input.idempotencyKey)

  // Fast path: an obvious replay (the customer hit the button twice, seconds
  // apart). The transaction below is what makes the truly concurrent case safe.
  if (idempotencyKey) {
    const existing = await findOrderByIdempotencyKey(idempotencyKey)
    if (existing) {
      return {
        ok: true,
        orderId: String(existing.id),
        trackId: existing.trackId,
        totals: {
          subtotal: existing.subtotal ?? 0,
          deliveryFee: existing.deliveryFee ?? 0,
          total: existing.total ?? 0,
        },
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
    // so reusing the previous read would retry against stale stock and fail
    // identically forever.
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

    const byId = new Map(products.map((p) => [p.id, p]))
    const tracked = cart.lines.filter((line) => byId.get(line.productId)?.trackInventory !== false)

    const now = new Date().toISOString()
    const orderData = {
      trackId,
      status: 'placed' as const,
      paymentMethod: 'cod',
      paymentStatus: 'unpaid' as const,
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      customerPhone: input.customerPhone,
      // Computed here, once, so the track page can show a recognisable tail
      // without its query ever selecting the full number. Masking in React
      // would be too late — the raw value would already have been fetched into
      // the page.
      phoneLast3: input.customerPhone.replace(/\D/g, '').slice(-3),
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
        stockTaken: tracked.some(
          (t) => t.productId === line.productId && t.variantKey === line.variantKey
        ),
        ...(line.imageUrl ? { imageUrl: line.imageUrl } : {}),
      })),
      subtotal: totals.subtotal,
      deliveryFee: totals.deliveryFee,
      total: totals.total,
      placedAt: now,
      statusHistory: [{ status: 'placed', at: now }],
      // Pre-marked, so the afterChange hook that fires on this very creation
      // cannot also send a confirmation. The route owns that email; if its send
      // fails it sets emailStatus and an admin re-sends from the CMS.
      notifiedStatuses: ['placed'],
      stockReserved: true,
      ...(idempotencyKey ? { idempotencyKey } : {}),
    }

    const transactionID = await db.beginTransaction()
    const session = db.sessions[transactionID]

    try {
      const Products = db.collections['products']

      for (const line of tracked) {
        if (!isVariantKey(line.variantKey)) {
          throw new Error(`[shop] refusing to build an update for key: ${line.variantKey}`)
        }

        const result = await Products.updateOne(
          {
            _id: line.productId,
            variants: { $elemMatch: { id: line.variantKey, stock: { $gte: line.quantity } } },
          },
          { $inc: { 'variants.$[v].stock': -line.quantity } },
          { arrayFilters: [{ 'v.id': line.variantKey }], session }
        )

        // Zero matches means the guard failed: somebody else took the units
        // between the read above and this write. Abandon the whole attempt.
        if (result.matchedCount === 0) throw new LostRace(line.variantKey)
      }

      const created = await cms.create({
        collection: 'orders',
        data: orderData as unknown as Order,
        // Joins this write to the same transaction as the decrements above.
        req: { transactionID } as Parameters<typeof cms.create>[0]['req'],
      })

      await db.commitTransaction(transactionID)

      return {
        ok: true,
        orderId: String(created.id),
        trackId,
        totals,
        lines: cart.lines,
        replayed: false,
      }
    } catch (err) {
      await db.rollbackTransaction(transactionID).catch(() => {})

      // A genuinely concurrent replay: the other request won and created the
      // order. Answer with theirs rather than trying again.
      if (idempotencyKey) {
        const existing = await findOrderByIdempotencyKey(idempotencyKey)
        if (existing) {
          return {
            ok: true,
            orderId: String(existing.id),
            trackId: existing.trackId,
            totals: {
              subtotal: existing.subtotal ?? 0,
              deliveryFee: existing.deliveryFee ?? 0,
              total: existing.total ?? 0,
            },
            lines: cart.lines,
            replayed: true,
          }
        }
      }

      const isLastAttempt = attempt === MAX_RESERVATION_ATTEMPTS - 1
      if (!(err instanceof LostRace) && isLastAttempt) {
        console.error('[shop] reservation failed after retries', err)
      }
      if (isLastAttempt) {
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
 * The hook that calls this can fire more than once for one cancellation — an
 * admin can re-save the document, and a status can be corrected and re-applied.
 * Adding the same units back twice would invent inventory that does not exist
 * and lead straight to overselling it.
 *
 * `stockRestoredAt` is the guard, and the claim on it is itself the lock: the
 * update that stamps it requires the field to still be missing. Two concurrent
 * restores therefore cannot both proceed — the loser matches nothing and stops.
 * The stamp is claimed FIRST, inside the transaction, before any stock moves,
 * so a crash between the two leaves the units unrestored (recoverable by hand)
 * rather than restored twice (silently wrong forever).
 *
 * What gets returned comes from the order's own `stockTaken` flags, not from
 * asking the product what it does now. If inventory tracking was toggled
 * between the order and the cancellation, asking the product would either
 * strand the units or conjure stock that was never taken.
 */
export async function restoreStockForOrder(
  orderId: string,
  /**
   * The transaction to join, when one is already open.
   *
   * This matters more than it looks. The caller is normally the `orders`
   * afterChange hook, which Payload runs INSIDE the transaction of the update
   * that triggered it — the admin saving "cancelled". Starting a second
   * transaction here would try to write the same order document that the outer
   * one is still holding, and MongoDB answers that with a write conflict: the
   * restore fails, the status change succeeds, and the units are stranded.
   *
   * Joining instead makes "this order is cancelled" and "its stock is back on
   * the shelf" a single atomic fact, which is what they always should have been.
   */
  existingTransactionID?: string
): Promise<RestoreResult> {
  const cms = await getCms()
  const db = cms.db as unknown as MongoAdapter

  const order = await cms.findByID({
    collection: 'orders',
    id: orderId,
    depth: 0,
    select: {
      status: true,
      stockReserved: true,
      stockRestoredAt: true,
      items: true,
    },
    ...(existingTransactionID
      ? { req: { transactionID: existingTransactionID } as Parameters<typeof cms.findByID>[0]['req'] }
      : {}),
  })

  if (!order) return { restored: false, reason: 'not_found' }
  if (order.status !== 'cancelled') return { restored: false, reason: 'not_cancelled' }
  if (order.stockReserved !== true) return { restored: false, reason: 'never_reserved' }
  if (order.stockRestoredAt) return { restored: false, reason: 'already_restored' }

  const lines = (order.items ?? []).filter(
    (item) =>
      item.stockTaken !== false &&
      typeof item.variantKey === 'string' &&
      isVariantKey(item.variantKey) &&
      (item.quantity ?? 0) > 0
  )

  // Own the transaction only if nobody else does.
  const ownsTransaction = !existingTransactionID
  const transactionID = existingTransactionID ?? (await db.beginTransaction())
  const session = db.sessions[transactionID]

  try {
    const Orders = db.collections['orders']
    const Products = db.collections['products']

    // Claim the restore before moving anything. `stockRestoredAt: null` in the
    // filter is what makes this a claim rather than a write: only one caller can
    // match a document that has not been stamped yet.
    const claim = await Orders.updateOne(
      { _id: orderId, $or: [{ stockRestoredAt: null }, { stockRestoredAt: { $exists: false } }] },
      { $set: { stockRestoredAt: new Date() } },
      { session }
    )
    if (claim.matchedCount === 0) {
      if (ownsTransaction) await db.rollbackTransaction(transactionID)
      return { restored: false, reason: 'already_restored' }
    }

    let units = 0
    for (const line of lines) {
      // A product deleted since the order was placed simply has nowhere to put
      // its units back. Skipped rather than failing the whole restore, which
      // would strand every other line in the order.
      const result = await Products.updateOne(
        { _id: line.productId, 'variants.id': line.variantKey },
        { $inc: { 'variants.$[v].stock': line.quantity } },
        { arrayFilters: [{ 'v.id': line.variantKey }], session }
      )
      if (result.matchedCount > 0) units += line.quantity ?? 0
    }

    if (ownsTransaction) await db.commitTransaction(transactionID)
    return { restored: true, units }
  } catch (err) {
    // Only roll back what we started. Aborting somebody else's transaction
    // would silently undo the status change that called us.
    if (ownsTransaction) await db.rollbackTransaction(transactionID).catch(() => {})
    console.error('[shop] stock restore failed', orderId, err)
    return { restored: false, reason: 'busy' }
  }
}

// ── Public lookup ─────────────────────────────────────────────

/** SERVER ONLY — the unmasked order, for building emails. */
export async function getOrderInternalByTrackId(trackId: string): Promise<OrderInternal | null> {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    where: { trackId: { equals: trackId } },
  })
  return docs[0] ?? null
}

/**
 * The track page's projection — and the ONLY order read that is safe to render.
 *
 * Masking used to happen in TypeScript, after the full order had been fetched.
 * That was too late: Next serialises fetched data into the page, so the raw
 * street address, postcode, phone number and email ended up in the page source
 * even though nothing rendered them. Selecting them was the mistake, not
 * displaying them.
 *
 * So this `select` never asks for them. `area` and `city` are lifted out of
 * `deliveryAddress` individually rather than taking the object, and the phone
 * comes from `phoneLast3`, computed when the order was placed.
 */
const TRACK_SELECT = {
  trackId: true,
  status: true,
  paymentStatus: true,
  placedAt: true,
  customerName: true,
  phoneLast3: true,
  deliveryMethod: true,
  deliveryAddress: { area: true, city: true },
  campusDetails: { handoverPoint: true },
  items: true,
  subtotal: true,
  deliveryFee: true,
  total: true,
  statusHistory: true,
  cancellationReason: true,
} as const

/**
 * Look up an order for the public track page.
 *
 * Accepts whatever the customer typed. The shape is validated before the
 * database is touched so a junk string costs nothing, and a bare code with no
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

  const trackId = normalized.includes('-') ? normalized : `${config.orderPrefix}-${normalized}`
  if (!isTrackIdShape(trackId)) return null

  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'orders',
    depth: 0,
    limit: 1,
    where: { trackId: { equals: trackId } },
    // Deliberately NOT the whole document — that carries PII, and simply
    // fetching it inside a page is enough to put it in the page source.
    select: TRACK_SELECT,
  })

  const row = docs[0]
  if (!row) return null

  return {
    trackId: row.trackId,
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    placedAt: row.placedAt,
    // Kept: the buyer has to recognise this as their own order.
    customerName: row.customerName,
    // `phoneLast3` was computed at order time precisely so the full number never
    // has to be selected. Orders predating it show nothing.
    maskedPhone: row.phoneLast3 ? `••••••${row.phoneLast3}` : '••••••',
    deliveryMethod: row.deliveryMethod as DeliveryMethod,
    maskedAddress:
      row.deliveryMethod === 'campus'
        ? 'BRACU campus'
        : maskAddress(row.deliveryAddress?.area, row.deliveryAddress?.city),
    campusHandoverPoint: row.campusDetails?.handoverPoint ?? undefined,
    items: (row.items ?? []) as OrderItem[],
    subtotal: row.subtotal,
    deliveryFee: row.deliveryFee,
    total: row.total,
    statusHistory: (row.statusHistory ?? []) as OrderStatusEvent[],
    cancellationReason: row.cancellationReason ?? undefined,
    estimatedDeliveryDays: config.estimatedDeliveryDays,
  }
}

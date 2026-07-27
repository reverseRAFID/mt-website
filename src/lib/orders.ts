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
import { PRODUCTS_BY_IDS_QUERY } from '@/sanity/lib/queries'
import type { ProductForCart, ProductVariant, ShopConfigInternal } from '@/sanity/lib/types'
import type { CartItem } from '@/lib/cart'
import { sanitizeCart } from '@/lib/cart'
import { availableStock, findVariant, maxPurchasable, variantPrice } from '@/lib/product'
import { CAMPUS_DELIVERY_FEE, type DeliveryMethod } from '@/lib/shop'

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
  /** `Infinity` when the product does not track inventory. */
  available: number
  /** Ceiling the quantity stepper should enforce. */
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
      available,
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

// ============================================================
// Product pricing and availability — isomorphic derivations.
//
// One place that answers "what does this cost" and "can I buy it", so the
// product page, the cart, the checkout summary and the order route cannot
// drift apart on the answer.
//
// These are display and pre-flight helpers. They are NOT the authority: the
// figures that end up on an invoice are recomputed inside
// `priceCart()` / `reserveAndCreateOrder()` in src/lib/orders.ts, from a fresh
// read of the product, at the moment the order is placed. Anything computed
// here may be seconds out of date by the time the customer clicks Place Order.
// ============================================================

import type { Product, ProductVariant } from '@/lib/cms/types'

/** Any product shape that carries enough to price and stock-check a variant. */
type PricedProduct = Pick<Product, 'basePrice' | 'trackInventory' | 'variants'>

/**
 * What one unit of this variant costs.
 *
 * `priceOverride` of 0 is a legitimate price — a free item — so this checks the
 * type rather than truthiness. `?? basePrice` would be wrong for the same
 * reason `|| basePrice` would.
 */
export function variantPrice(product: PricedProduct, variant: ProductVariant): number {
  return typeof variant.priceOverride === 'number' ? variant.priceOverride : product.basePrice
}

/** Variants a customer is allowed to choose. */
export function activeVariants(product: PricedProduct): ProductVariant[] {
  return (product.variants ?? []).filter((v) => v.isActive !== false)
}

/**
 * Units available for a variant.
 *
 * Returns `Infinity` when the product does not track inventory — made-to-order
 * and pre-order items are never "out of stock". Callers can then compare
 * against it arithmetically without special-casing the untracked path.
 */
export function availableStock(product: PricedProduct, variant: ProductVariant): number {
  if (product.trackInventory === false) return Infinity
  return typeof variant.stock === 'number' && variant.stock > 0 ? variant.stock : 0
}

/** True when this exact variant can be added to a cart right now. */
export function isVariantPurchasable(product: PricedProduct, variant: ProductVariant): boolean {
  return variant.isActive !== false && availableStock(product, variant) > 0
}

/** True when nothing on this product can be bought. */
export function isSoldOut(product: PricedProduct): boolean {
  return !activeVariants(product).some((v) => isVariantPurchasable(product, v))
}

/** Total live units, used for the "only N left" nudge. `Infinity` if untracked. */
export function totalStock(product: PricedProduct): number {
  if (product.trackInventory === false) return Infinity
  return activeVariants(product).reduce((sum, v) => sum + Math.max(0, v.stock ?? 0), 0)
}

/**
 * Cheapest and dearest live variant.
 *
 * Falls back to the base price when every variant is inactive, so a card never
 * renders a blank or NaN price just because the product is temporarily off.
 */
export function priceRange(product: PricedProduct): { min: number; max: number } {
  const prices = activeVariants(product).map((v) => variantPrice(product, v))
  if (prices.length === 0) return { min: product.basePrice, max: product.basePrice }
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

/** True when variants disagree on price, so the card must show "from ৳X". */
export function hasPriceRange(product: PricedProduct): boolean {
  const { min, max } = priceRange(product)
  return min !== max
}

/**
 * Find a variant by the key an order recorded.
 *
 * That key is the array row's `id` — what Sanity called `_key`. It is a real
 * identifier, not a positional index, which is what lets a cancelled order
 * return stock to exactly the row it took it from even after the variant list
 * has been reordered.
 */
export function findVariant(
  product: Pick<Product, 'variants'>,
  variantKey: string
): ProductVariant | undefined {
  return (product.variants ?? []).find((v) => v.id === variantKey)
}

/**
 * The largest quantity of one variant a customer may order.
 *
 * The binding constraint is whichever is smallest: what is physically on the
 * shelf, the per-product cap, and the shop-wide cap. Returns 0 when the variant
 * cannot be bought at all.
 */
export function maxPurchasable(
  product: PricedProduct & { maxPerOrder?: number | null },
  variant: ProductVariant,
  shopMaxQtyPerItem: number
): number {
  if (!isVariantPurchasable(product, variant)) return 0
  const caps = [availableStock(product, variant), shopMaxQtyPerItem]
  if (typeof product.maxPerOrder === 'number' && product.maxPerOrder > 0) {
    caps.push(product.maxPerOrder)
  }
  return Math.max(0, Math.min(...caps))
}

/**
 * The variant a product page should select on load.
 *
 * Prefers the first one that can actually be bought, so a customer landing on a
 * product whose first size is sold out does not have to work out why the button
 * is disabled. Falls back to the first variant so the picker is never empty.
 */
export function defaultVariant(product: PricedProduct): ProductVariant | undefined {
  const active = activeVariants(product)
  return active.find((v) => isVariantPurchasable(product, v)) ?? active[0] ?? product.variants?.[0]
}

export type { Product, ProductVariant }

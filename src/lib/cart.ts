// ============================================================
// Cart state — pure, storage-agnostic operations.
//
// There is no login, so the cart lives in the browser's localStorage rather
// than against an account. Everything here is a pure function over a plain
// array: no React, no `window`, no I/O. That keeps it directly testable and
// lets both the CartProvider and the server-side hydrator share one shape.
//
// ── THE ONE RULE ──────────────────────────────────────────────
// A cart line stores ONLY an identity and a quantity. It never stores a price,
// a title, or an image.
//
// localStorage is attacker-controlled: it is a text field the customer can
// edit in devtools. If a price lived here, "make the tee cost 1 taka" would be
// a two-second edit. Because the client can only ever say *which* variant and
// *how many*, every figure on the invoice is resolved server-side from the CMS
// at cart-hydration and again at order time. A tampered cart can at worst
// order the wrong thing at the right price.
//
// The happy side effect: a cart left open for a week cannot show a stale price,
// because it never held one.
// ============================================================

import { CART_MAX_LINES } from './shop'

export interface CartItem {
  /** The product's CMS id. */
  productId: string
  /** `_key` of the variant inside that product's `variants[]`. */
  variantKey: string
  /** Always a positive integer once it has been through `sanitizeCart()`. */
  quantity: number
}

/** Versioned envelope, so a future shape change can discard old carts cleanly. */
export interface StoredCart {
  v: 1
  items: CartItem[]
}

export const CART_VERSION = 1 as const

export const EMPTY_CART: readonly CartItem[] = []

/**
 * Stable identity for a cart line.
 *
 * A product with three sizes is three independent lines, so identity is the
 * pair, never the product alone.
 */
export function lineKey(productId: string, variantKey: string): string {
  return `${productId}::${variantKey}`
}

export function sameLine(a: CartItem, b: Pick<CartItem, 'productId' | 'variantKey'>): boolean {
  return a.productId === b.productId && a.variantKey === b.variantKey
}

/**
 * True when `id` is a usable published-document reference.
 *
 * A `drafts.`-prefixed id is the shape a cart saved before the CMS migration
 * would carry, and it can never name a live product. Those must never enter
 * a cart: the public site cannot read them, so hydration would silently drop
 * the line and the customer would watch their cart empty itself.
 */
function isUsableId(id: unknown): id is string {
  return (
    typeof id === 'string' &&
    id.length > 0 &&
    id.length <= 128 &&
    !id.startsWith('drafts.')
  )
}

/**
 * Variant keys are generated ids — letters, digits, dashes.
 *
 * Constrained deliberately rather than accepting any short string. The key is
 * later interpolated into a GROQ-style patch path
 * (`variants[_key=="…"].stock`) when stock is decremented, and a value
 * containing a quote would change the shape of that expression. The reservation
 * path uses a key read back from the CMS rather than this one, so this is the
 * second of two independent guards, not the only one.
 */
const VARIANT_KEY_RE = /^[A-Za-z0-9_-]{1,64}$/

export function isVariantKey(value: unknown): value is string {
  return typeof value === 'string' && VARIANT_KEY_RE.test(value)
}

/**
 * Coerce anything at all into a valid cart.
 *
 * The input is whatever `JSON.parse` returned for a localStorage key that the
 * customer, a browser extension, or a previous version of this code may have
 * written. It must never throw and never yield an invalid line — a crash here
 * would break every page that renders the cart badge.
 *
 * Invalid lines are dropped rather than repaired-to-default, because guessing
 * at a corrupted quantity is worse than losing the line.
 */
export function sanitizeCart(input: unknown, maxQtyPerItem: number): CartItem[] {
  const raw = Array.isArray(input)
    ? input
    : Array.isArray((input as StoredCart | null)?.items)
      ? (input as StoredCart).items
      : []

  const seen = new Map<string, CartItem>()

  for (const entry of raw) {
    if (!entry || typeof entry !== 'object') continue
    const { productId, variantKey, quantity } = entry as Partial<CartItem>

    if (!isUsableId(productId)) continue
    if (!isVariantKey(variantKey)) continue

    // Number.isSafeInteger rejects NaN, Infinity, floats and 1e999 in one go.
    if (!Number.isSafeInteger(quantity) || (quantity as number) < 1) continue

    const key = lineKey(productId, variantKey)
    const clamped = Math.min(quantity as number, maxQtyPerItem)

    // A hand-edited cart can list the same line twice. Collapse duplicates by
    // summing, then re-clamp, so a "split" line cannot smuggle past the cap.
    const existing = seen.get(key)
    seen.set(key, {
      productId,
      variantKey,
      quantity: existing ? Math.min(existing.quantity + clamped, maxQtyPerItem) : clamped,
    })

    if (seen.size >= CART_MAX_LINES) break
  }

  return [...seen.values()]
}

/** Parse a raw localStorage string. Never throws. */
export function parseCart(raw: string | null, maxQtyPerItem: number): CartItem[] {
  if (!raw) return []
  try {
    return sanitizeCart(JSON.parse(raw), maxQtyPerItem)
  } catch {
    // Malformed JSON — treat as an empty cart rather than surfacing an error
    // the customer can do nothing about.
    return []
  }
}

export function serializeCart(items: CartItem[]): string {
  return JSON.stringify({ v: CART_VERSION, items } satisfies StoredCart)
}

// ── Mutations — all return a new array ────────────────────────

/**
 * Add `quantity` of a variant, merging into an existing line.
 *
 * Adding is additive on purpose: a customer who adds one tee, keeps browsing,
 * then adds it again expects two, not one.
 */
export function addItem(
  items: CartItem[],
  productId: string,
  variantKey: string,
  quantity: number,
  maxQtyPerItem: number
): CartItem[] {
  if (!isUsableId(productId) || !isVariantKey(variantKey)) return items
  if (!Number.isSafeInteger(quantity) || quantity < 1) return items

  const index = items.findIndex((i) => sameLine(i, { productId, variantKey }))

  if (index === -1) {
    if (items.length >= CART_MAX_LINES) return items
    return [...items, { productId, variantKey, quantity: Math.min(quantity, maxQtyPerItem) }]
  }

  const next = [...items]
  next[index] = {
    ...next[index]!,
    quantity: Math.min(next[index]!.quantity + quantity, maxQtyPerItem),
  }
  return next
}

/** Set an absolute quantity. Zero or less removes the line. */
export function setQuantity(
  items: CartItem[],
  productId: string,
  variantKey: string,
  quantity: number,
  maxQtyPerItem: number
): CartItem[] {
  if (!Number.isSafeInteger(quantity) || quantity < 1) {
    return removeItem(items, productId, variantKey)
  }
  return items.map((item) =>
    sameLine(item, { productId, variantKey })
      ? { ...item, quantity: Math.min(quantity, maxQtyPerItem) }
      : item
  )
}

export function removeItem(items: CartItem[], productId: string, variantKey: string): CartItem[] {
  return items.filter((item) => !sameLine(item, { productId, variantKey }))
}

/**
 * Drop lines the server could not resolve.
 *
 * Used after hydration when a product has been deleted or unpublished, so the
 * cart stops carrying a line that can never be ordered.
 */
export function pruneCart(items: CartItem[], keepKeys: Set<string>): CartItem[] {
  return items.filter((item) => keepKeys.has(lineKey(item.productId, item.variantKey)))
}

// ── Derived values ────────────────────────────────────────────

/** Total number of units, which is what the navbar badge shows. */
export function cartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0)
}

export function isEmpty(items: CartItem[]): boolean {
  return items.length === 0
}

export function findLine(
  items: CartItem[],
  productId: string,
  variantKey: string
): CartItem | undefined {
  return items.find((item) => sameLine(item, { productId, variantKey }))
}

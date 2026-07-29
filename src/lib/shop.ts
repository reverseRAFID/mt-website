// ============================================================
// Merch shop domain constants.
//
// Single source of truth shared by the `products` / `shop` / `orders`
// collections, the /api/shop/* validators, and the /shop UI. The collections
// import this with a RELATIVE path (not the @/ alias) so the module resolves
// under both the Next bundler and the Payload CLI — same convention as
// src/lib/crowdfunding.ts.
//
// ISOMORPHIC — this file is bundled into the browser (the admin UI and the
// shop's client components both pull it in). It must therefore never import a
// Node built-in and never hold a secret. Anything needing `node:*`, a token, or
// database access belongs in src/lib/orders.ts or src/lib/cms/shop.ts.
//
// PRIVACY NOTE — nothing here may reference customer PII. Order documents carry
// names, phone numbers and home addresses; see docs/shop-runbook.md.
// ============================================================

// ── Currency ──────────────────────────────────────────────────
// Every monetary value in the shop is an INTEGER number of taka. Bangladesh
// prices merch in whole taka, and integers sidestep the classic float bug where
// 0.1 + 0.2 !== 0.3 quietly corrupts an invoice total. There is no minor unit
// anywhere in this system — not in the database, not in the API, not in email.

export const CURRENCY_CODE = 'BDT'
export const CURRENCY_SYMBOL = '৳'

/** True when `value` is a whole, finite, non-negative number of taka. */
export function isMoney(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
}

/** Format taka for display, e.g. 1450 → "৳1,450". */
export function formatMoney(taka: number): string {
  return `${CURRENCY_SYMBOL}${Math.round(taka).toLocaleString('en-BD')}`
}

// ── Shop gate ─────────────────────────────────────────────────
// Enforced server-side in /api/shop/order, mirroring how CROWDFUNDING_STATUS
// gates /api/donate. A closed shop rejects orders even when someone posts
// straight at the endpoint.

export const SHOP_STATUSES = ['open', 'paused', 'closed'] as const
export type ShopStatus = (typeof SHOP_STATUSES)[number]

export function isShopStatus(value: unknown): value is ShopStatus {
  return typeof value === 'string' && (SHOP_STATUSES as readonly string[]).includes(value)
}

// ── Order lifecycle ───────────────────────────────────────────
// `value` is what gets persisted, so renaming an entry is a data migration —
// add a new one instead.

export const ORDER_STATUSES = [
  'placed',
  'confirmed',
  'processing',
  'dispatched',
  'delivered',
  'cancelled',
] as const

export type OrderStatus = (typeof ORDER_STATUSES)[number]

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === 'string' && (ORDER_STATUSES as readonly string[]).includes(value)
}

/** Admin-facing labels. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  placed: '🆕 Placed',
  confirmed: '✅ Confirmed',
  processing: '📦 Packing',
  dispatched: '🚚 Dispatched',
  delivered: '🎉 Delivered',
  cancelled: '⛔ Cancelled',
}

/**
 * Legal status moves.
 *
 * Forward skips are allowed (a small team routinely goes straight from
 * `placed` to `dispatched`), and one-step corrections backward are allowed
 * because a misclick should not be permanent. Backward moves cannot spam the
 * customer: `notifiedStatuses[]` on the order means a given status is emailed
 * at most once, however many times the document is saved.
 *
 * `cancelled` is the one terminal state, because it is the only status with an
 * irreversible side effect — cancelling returns the reserved stock to
 * inventory. Re-opening a cancelled order would need that stock re-reserved,
 * which can fail if it has since sold out. Place a fresh order instead.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  placed: ['confirmed', 'processing', 'dispatched', 'cancelled'],
  confirmed: ['placed', 'processing', 'dispatched', 'cancelled'],
  processing: ['confirmed', 'dispatched', 'cancelled'],
  dispatched: ['processing', 'delivered', 'cancelled'],
  delivered: ['dispatched'],
  cancelled: [],
}

/** True when an order may move `from` → `to`. A no-op move is always legal. */
export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  if (from === to) return true
  return ORDER_STATUS_TRANSITIONS[from].includes(to)
}

/**
 * The customer-facing progress timeline.
 *
 * `cancelled` is deliberately absent — it is a branch off the track, not a step
 * along it, and the track page renders it as such.
 */
export const ORDER_TIMELINE: readonly OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'dispatched',
  'delivered',
]

/** Statuses that still hold reserved stock. */
export const STOCK_HELD_STATUSES: readonly OrderStatus[] = [
  'placed',
  'confirmed',
  'processing',
  'dispatched',
  'delivered',
]

// ── Payment ───────────────────────────────────────────────────
// Cash on Delivery only. Modelled as a list rather than a boolean so adding a
// prepaid channel later is an additive change, not a schema migration.

export const PAYMENT_METHODS = ['cod'] as const
export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cod: 'Cash on Delivery',
}

export const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded'] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  unpaid: '💵 Unpaid — collect on delivery',
  paid: '✅ Paid',
  refunded: '↩️ Refunded',
}

// ── Delivery ──────────────────────────────────────────────────

export const DELIVERY_METHODS = ['standard', 'campus'] as const
export type DeliveryMethod = (typeof DELIVERY_METHODS)[number]

export function isDeliveryMethod(value: unknown): value is DeliveryMethod {
  return typeof value === 'string' && (DELIVERY_METHODS as readonly string[]).includes(value)
}

export const DELIVERY_METHOD_LABELS: Record<DeliveryMethod, string> = {
  standard: 'Home delivery',
  campus: 'Pick up inside BRACU',
}

/**
 * Campus handover is structurally free — it is a team member walking a parcel
 * across campus, not a courier. This is a constant rather than a config field
 * so no amount of admin misconfiguration or request tampering can put a fee on
 * it, and /api/shop/order can assert it unconditionally.
 */
export const CAMPUS_DELIVERY_FEE = 0

/**
 * "Dispatched" means different things per method, and the wrong word is
 * actively confusing — a campus buyer told their order "shipped" will wait for
 * a courier that is never coming.
 */
export function dispatchLabel(method: DeliveryMethod): string {
  return method === 'campus' ? 'Ready for pickup' : 'Out for delivery'
}

/** Customer-facing timeline label for a status, given the delivery method. */
export function timelineLabel(status: OrderStatus, method: DeliveryMethod): string {
  switch (status) {
    case 'placed':
      return 'Order placed'
    case 'confirmed':
      return 'Confirmed'
    case 'processing':
      return 'Packing'
    case 'dispatched':
      return dispatchLabel(method)
    case 'delivered':
      return method === 'campus' ? 'Collected' : 'Delivered'
    case 'cancelled':
      return 'Cancelled'
  }
}

// ── Defaults ──────────────────────────────────────────────────
// Fallbacks used when the `shopConfig` singleton has not been filled in yet, so
// the shop is never a broken page. The delivery fee is the seed value the team
// asked for — it is admin-editable in the CMS → Settings → Shop Settings.

export const DEFAULT_STANDARD_DELIVERY_FEE = 120
export const DEFAULT_MIN_ORDER_VALUE = 0
export const DEFAULT_MAX_QTY_PER_ITEM = 5
export const DEFAULT_MAX_ITEMS_PER_ORDER = 20
export const DEFAULT_ESTIMATED_DELIVERY = '3–5 working days'
export const DEFAULT_ORDER_PREFIX = 'MT'
export const DEFAULT_VARIANT_AXIS_LABEL = 'Size'
export const DEFAULT_LOW_STOCK_THRESHOLD = 3

/**
 * Products with no real options still get exactly one variant, labelled this.
 *
 * Stock then lives in precisely one place — on a variant — instead of being
 * split between a product-level field and a variant-level field. That removes a
 * whole class of "which number is authoritative" bugs from the reservation
 * transaction, at the cost of one boilerplate row in the Studio.
 */
export const SINGLE_VARIANT_LABEL = 'Standard'

// ── Field limits ──────────────────────────────────────────────
// Mirrored by the /api/shop/order validator and the checkout form's maxLength
// attributes. Belt and braces: the browser hint keeps honest users inside the
// limit, the server check stops everyone else.

export const LIMITS = {
  name: 80,
  email: 120,
  phone: 30,
  addressLine: 120,
  area: 60,
  city: 60,
  postcode: 12,
  handoverPoint: 80,
  bracuId: 20,
  note: 400,
  trackId: 24,
  idempotencyKey: 64,
} as const

// ── Validation ────────────────────────────────────────────────

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Bangladeshi mobile numbers, post-normalisation: 11 digits, `01`, then an
 * operator digit of 3–9. Run `normalizePhone()` first — this pattern
 * deliberately does not accept the `+880` / `880` / spaced forms people
 * actually type, so that exactly one shape reaches storage.
 */
export const BD_PHONE_RE = /^01[3-9]\d{8}$/

/**
 * Collapse the many ways a BD mobile number gets written into the single
 * `01XXXXXXXXX` form, so two spellings of one number compare equal and the
 * team can paste it straight into a dialler.
 */
export function normalizePhone(raw: string): string {
  const digits = raw.replace(/[\s\-().]/g, '').replace(/^\+/, '')
  if (digits.startsWith('880')) return `0${digits.slice(3)}`
  if (digits.length === 10 && digits.startsWith('1')) return `0${digits}`
  return digits
}

/**
 * BRACU-issued addresses, both staff and student domains.
 *
 * Unused by default: `shopConfig.requireBracuEmailForCampus` ships **off**, so
 * free campus handover is open to anyone, as specified. The check exists so
 * that if free delivery is ever abused, the team flips one toggle in Studio
 * rather than waiting on a code change and a deploy.
 */
export const BRACU_EMAIL_RE = /@(g\.)?bracu\.ac\.bd$/i

export function isBracuEmail(email: string): boolean {
  return BRACU_EMAIL_RE.test(email.trim())
}

// ── Track IDs ─────────────────────────────────────────────────

/**
 * Crockford base32 — the standard digits and letters minus `I`, `L`, `O` and
 * `U`.
 *
 * Two reasons this alphabet and not hex or base64url. First, a track ID gets
 * read aloud down a phone line and copied off a printed slip, and the excluded
 * glyphs are exactly the ones people confuse with `1`, `0` and each other.
 * Second, dropping `U` means a random string cannot spell an obscenity at a
 * customer.
 */
const TRACK_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'

/** Characters of randomness after the prefix. 32^8 ≈ 1.1 × 10^12. */
export const TRACK_CODE_LENGTH = 8

/** Shape check run before any lookup, so junk never reaches the dataset. */
export const TRACK_ID_RE = /^[A-Z][A-Z0-9]{0,5}-[0-9A-Z]{6,12}$/

/**
 * A fresh, unguessable track ID, e.g. `MT-7K4QX2ZP`.
 *
 * The ID is the only credential protecting an order lookup — there is no
 * account to log into — so it has to be genuinely random, not a sequence.
 * A counter like `MT-000123` would let anyone walk the entire order book.
 *
 * Uses Web Crypto (`crypto.getRandomValues`), which is a global in both the
 * browser and Node ≥19, keeping this module free of Node built-ins.
 *
 * On modulo bias: the alphabet is 32 long and 256 % 32 === 0, so mapping a
 * uniform byte through `% 32` stays perfectly uniform. Changing the alphabet
 * length to something that does not divide 256 would silently skew this.
 *
 * Collisions are still possible in principle, so the caller must confirm
 * uniqueness against the dataset — see `reserveTrackId()` in src/lib/orders.ts.
 */
export function generateTrackId(prefix: string = DEFAULT_ORDER_PREFIX): string {
  const bytes = new Uint8Array(TRACK_CODE_LENGTH)
  crypto.getRandomValues(bytes)
  let code = ''
  for (const byte of bytes) code += TRACK_ALPHABET[byte % TRACK_ALPHABET.length]
  return `${sanitizePrefix(prefix)}-${code}`
}

/** Keep a config-supplied prefix inside the alphabet the ID shape allows. */
export function sanitizePrefix(prefix: string): string {
  const cleaned = prefix.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  return /^[A-Z]/.test(cleaned) ? cleaned : DEFAULT_ORDER_PREFIX
}

/**
 * Repair what a customer actually types into the tracking box.
 *
 * They arrive lowercase, wrapped in whitespace, sometimes with the letters that
 * Crockford excludes standing in for digits because that is what the glyph
 * looked like on their screen. Mapping `O → 0` and `I`/`L` → `1` is safe
 * precisely because those letters are not in the alphabet, so the substitution
 * can never corrupt a valid ID. Applied only after the separator, leaving the
 * prefix alone.
 *
 * Separators are canonicalised rather than stripped. People substitute a space
 * or an underscore for the hyphen, and mail clients and phone keyboards rewrite
 * it as an en/em dash — deleting those would fuse the prefix onto the code and
 * turn a recoverable typo into "order not found".
 */
export function normalizeTrackId(raw: string): string {
  // Any run of whitespace, underscores or dash-family punctuation is a
  // separator the customer meant to type.
  const segments = raw
    .trim()
    .toUpperCase()
    .split(/[^A-Z0-9]+/)
    .filter(Boolean)

  if (segments.length === 0) return ''

  // Decide whether the first segment is a prefix or the start of the code.
  // It is a prefix only if it looks like one *and* enough characters remain to
  // form a code — otherwise `7K4 QX2 ZP` (a prefix-less ID read aloud in
  // groups) would have "7K4" mistaken for its prefix.
  const looksLikePrefix =
    segments.length > 1 &&
    /^[A-Z][A-Z0-9]{0,5}$/.test(segments[0]!) &&
    segments.slice(1).join('').length >= 6

  const prefix = looksLikePrefix ? segments[0]! : ''
  const code = (looksLikePrefix ? segments.slice(1) : segments)
    .join('')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')

  return prefix ? `${prefix}-${code}` : code
}

export function isTrackIdShape(value: string): boolean {
  return value.length <= LIMITS.trackId && TRACK_ID_RE.test(value)
}

// ── PII masking ───────────────────────────────────────────────
// The track page is reachable by anyone holding the ID, so it shows enough for
// the buyer to recognise their own order and nothing more. See
// docs/shop-runbook.md for the full "never published" list.

// There is deliberately no maskPhone() here any more.
//
// Masking a phone number in TypeScript meant fetching the full number into the
// page first, and Next serialises fetch responses into the RSC flight payload —
// so the raw number sat in the page source even though nothing rendered it.
// The number is now reduced to `phoneLast3` when the order is written, and
// ORDER_TRACK_QUERY simply never selects `customerPhone`. Masking a value you
// already fetched is too late; the fix has to be upstream of the fetch.

/**
 * Reduce a delivery address to the coarsest recognisable form — area and city
 * only. The street line, house number and postcode never leave the dataset.
 */
export function maskAddress(area?: string | null, city?: string | null): string {
  const parts = [area, city].map((p) => p?.trim()).filter(Boolean)
  return parts.length ? parts.join(', ') : 'Address on file'
}

// ── Cart storage ──────────────────────────────────────────────
// The cart lives in localStorage because there is no account to hang it off.
// The version suffix lets a future shape change discard old carts cleanly
// rather than crashing on them.

export const CART_STORAGE_KEY = 'mt-cart-v1'

/** Hard ceiling on distinct lines, independent of the admin-set item cap. */
export const CART_MAX_LINES = 50

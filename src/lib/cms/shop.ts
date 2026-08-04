// ============================================================
// Shop catalogue and settings — SERVER ONLY.
//
// Replaces src/lib/shop-server.ts's Sanity half. Never import this from a
// client component; `npm run check:privacy` fails the build if a `'use client'`
// file reaches for it.
//
// Everything here is catalogue data — products, categories, settings. Order
// reads live in src/lib/orders.ts, because they touch customer PII and need a
// far narrower projection.
// ============================================================

import type { Product, ProductCategory } from '@/payload-types'

import {
  DEFAULT_ESTIMATED_DELIVERY,
  DEFAULT_MAX_ITEMS_PER_ORDER,
  DEFAULT_MAX_QTY_PER_ITEM,
  DEFAULT_MIN_ORDER_VALUE,
  DEFAULT_ORDER_PREFIX,
  DEFAULT_STANDARD_DELIVERY_FEE,
  type ShopStatus,
  isShopStatus,
  sanitizePrefix,
} from '@/lib/shop'

import { cachedRead } from './cache'
import { getCms } from './client'

// ── Config shapes ─────────────────────────────────────────────

/** Shop settings safe to hand to a component. */
export interface ShopConfig {
  status: ShopStatus
  closedMessage?: string
  announcement?: string
  standardDeliveryFee: number
  campusDeliveryEnabled?: boolean
  campusHandoverPoints?: string[]
  requireBracuEmailForCampus?: boolean
  estimatedDeliveryDays?: string
  minOrderValue: number
  maxQtyPerItem: number
  maxItemsPerOrder: number
  orderPrefix: string
  supportEmail?: string
  supportPhone?: string
  shippingPolicy?: string
  returnPolicy?: string
}

/** SERVER ONLY — adds the team inboxes. Never hand this to a component. */
export interface ShopConfigInternal extends ShopConfig {
  adminNotifyEmails?: string[]
}

function clampInt(value: unknown, fallback: number, min: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.round(value))
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

/**
 * Fill in every gap so callers never branch on a missing field.
 *
 * The global may be entirely unedited, or half-filled. A shop that renders a
 * blank delivery fee or an undefined quantity cap is worse than one running on
 * documented defaults — and `status` defaulting to `closed` means an
 * unconfigured shop cannot accidentally start taking orders it has no settings
 * for.
 */
function withDefaults(config: Record<string, unknown> | null): ShopConfigInternal {
  return {
    status: isShopStatus(config?.status) ? config.status : 'closed',
    closedMessage: str(config?.closedMessage),
    announcement: str(config?.announcement),
    standardDeliveryFee:
      typeof config?.standardDeliveryFee === 'number' && config.standardDeliveryFee >= 0
        ? Math.round(config.standardDeliveryFee)
        : DEFAULT_STANDARD_DELIVERY_FEE,
    campusDeliveryEnabled: config?.campusDeliveryEnabled !== false,
    campusHandoverPoints: ((config?.campusHandoverPoints ?? []) as unknown[]).filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0
    ),
    requireBracuEmailForCampus: config?.requireBracuEmailForCampus === true,
    estimatedDeliveryDays: str(config?.estimatedDeliveryDays) ?? DEFAULT_ESTIMATED_DELIVERY,
    minOrderValue: clampInt(config?.minOrderValue, DEFAULT_MIN_ORDER_VALUE, 0),
    maxQtyPerItem: clampInt(config?.maxQtyPerItem, DEFAULT_MAX_QTY_PER_ITEM, 1),
    maxItemsPerOrder: clampInt(config?.maxItemsPerOrder, DEFAULT_MAX_ITEMS_PER_ORDER, 1),
    orderPrefix: sanitizePrefix(str(config?.orderPrefix) ?? DEFAULT_ORDER_PREFIX),
    supportEmail: str(config?.supportEmail),
    supportPhone: str(config?.supportPhone),
    shippingPolicy: str(config?.shippingPolicy),
    returnPolicy: str(config?.returnPolicy),
    adminNotifyEmails: ((config?.adminNotifyEmails ?? []) as unknown[]).filter(
      (e): e is string => typeof e === 'string' && e.includes('@')
    ),
  }
}

/**
 * Strip the internal-only fields.
 *
 * Built by naming the fields to keep rather than by deleting the private ones,
 * so a field added to ShopConfigInternal in future is private until somebody
 * deliberately publishes it. Same reasoning as `toPublicOrder()`.
 */
function toPublic(config: ShopConfigInternal): ShopConfig {
  return {
    status: config.status,
    closedMessage: config.closedMessage,
    announcement: config.announcement,
    standardDeliveryFee: config.standardDeliveryFee,
    campusDeliveryEnabled: config.campusDeliveryEnabled,
    campusHandoverPoints: config.campusHandoverPoints,
    requireBracuEmailForCampus: config.requireBracuEmailForCampus,
    estimatedDeliveryDays: config.estimatedDeliveryDays,
    minOrderValue: config.minOrderValue,
    maxQtyPerItem: config.maxQtyPerItem,
    maxItemsPerOrder: config.maxItemsPerOrder,
    orderPrefix: config.orderPrefix,
    supportEmail: config.supportEmail,
    supportPhone: config.supportPhone,
    shippingPolicy: config.shippingPolicy,
    returnPolicy: config.returnPolicy,
  }
}

// ── Config ────────────────────────────────────────────────────

/**
 * Public shop settings. Safe to hand to a server component for rendering.
 *
 * `toPublic()` runs INSIDE the cached function, so `adminNotifyEmails` is
 * neither returned to a page nor written into Next's data cache.
 */
export const getShopConfig = cachedRead('global:shop', ['shop'], async (): Promise<ShopConfig> => {
  const cms = await getCms()
  const raw = await cms.findGlobal({ slug: 'shop', depth: 0 })
  return toPublic(withDefaults(raw as unknown as Record<string, unknown> | null))
})

/**
 * Shop settings including the team notification inboxes.
 *
 * Route handlers only, and deliberately UNCACHED: it carries the open/closed
 * gate, and a shop that was closed 59 seconds ago must not still be accepting
 * orders.
 */
export async function getShopConfigInternal(): Promise<ShopConfigInternal> {
  const cms = await getCms()
  const raw = await cms.findGlobal({ slug: 'shop', depth: 0 })
  return withDefaults(raw as unknown as Record<string, unknown> | null)
}

// ── Catalogue ─────────────────────────────────────────────────

/**
 * The shop grid. Featured products lead, then manual order, then title.
 *
 * Cached, because it is read on every shop request and changes rarely. Stock
 * counts are inside it and do move — but a stale count only costs a customer a
 * rejection at checkout, and checkout itself never trusts this cache: it reads
 * fresh, in a transaction. See src/lib/orders.ts.
 */
export const getProducts = cachedRead(
  'products:list',
  ['products', 'product-categories', 'media'],
  async (): Promise<Product[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'products',
      depth: 1,
      limit: 200,
      sort: ['-featured', 'order', 'title'],
      where: { isActive: { equals: true } },
    })
    return docs
  }
)

export const getFeaturedProducts = cachedRead(
  'products:featured',
  ['products', 'product-categories', 'media'],
  async (limit: number = 4): Promise<Product[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'products',
      depth: 1,
      limit,
      sort: ['order', 'title'],
      where: { and: [{ isActive: { equals: true } }, { featured: { equals: true } }] },
    })
    return docs
  }
)

export const getProduct = cachedRead(
  'products:bySlug',
  ['products', 'product-categories', 'media'],
  async (slug: string): Promise<Product | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'products',
      depth: 1,
      limit: 1,
      where: { and: [{ slug: { equals: slug } }, { isActive: { equals: true } }] },
    })
    return docs[0] ?? null
  }
)

export const getProductSlugs = cachedRead(
  'products:slugs',
  ['products'],
  async (): Promise<string[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'products',
      depth: 0,
      limit: 300,
      where: { isActive: { equals: true } },
      select: { slug: true },
    })
    return docs.map((d) => d.slug).filter(Boolean)
  }
)

export const getCategories = cachedRead(
  'product-categories:list',
  ['product-categories'],
  async (): Promise<ProductCategory[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'product-categories',
      depth: 0,
      limit: 100,
      sort: ['order', 'title'],
    })
    return docs
  }
)

/** Same category, excluding the product being viewed. */
export const getRelatedProducts = cachedRead(
  'products:related',
  ['products', 'product-categories', 'media'],
  async (id: string, categoryId: string | undefined, limit: number = 4): Promise<Product[]> => {
    if (!categoryId) return []
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'products',
      depth: 1,
      limit,
      sort: ['-featured', 'order'],
      where: {
        and: [
          { isActive: { equals: true } },
          { id: { not_equals: id } },
          { category: { equals: categoryId } },
        ],
      },
    })
    return docs
  }
)

/**
 * Everything the /shop grid renders, in one round of parallel reads.
 *
 * Categories that ended up with no live products are dropped: a filter chip
 * that always yields an empty grid is a dead end the customer has to discover
 * by clicking it.
 */
export async function getShopPageData(): Promise<{
  config: ShopConfig
  products: Product[]
  categories: ProductCategory[]
}> {
  const [config, products, allCategories] = await Promise.all([
    getShopConfig(),
    getProducts(),
    getCategories(),
  ])

  const usedCategoryIds = new Set(
    products.map((p) => (typeof p.category === 'string' ? p.category : p.category?.id)).filter(Boolean)
  )
  const categories = allCategories.filter((c) => usedCategoryIds.has(c.id))

  return { config, products, categories }
}

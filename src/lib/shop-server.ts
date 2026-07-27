// ============================================================
// Shop catalogue reads — SERVER ONLY.
//
// Never import this from a client component. It pulls in `sanityFetch`, which
// carries the read token; `npm run check:privacy` fails the build if a
// 'use client' file reaches for it.
//
// Everything here is catalogue data (products, categories, settings). Order
// reads live in src/lib/orders.ts, because they touch customer PII and need
// masking on the way out.
// ============================================================

import { sanityFetch } from '@/sanity/lib/client'
import {
  FEATURED_PRODUCTS_QUERY,
  PRODUCTS_QUERY,
  PRODUCT_BY_SLUG_QUERY,
  PRODUCT_CATEGORIES_QUERY,
  PRODUCT_SLUGS_QUERY,
  RELATED_PRODUCTS_QUERY,
  SHOP_CONFIG_INTERNAL_QUERY,
  SHOP_CONFIG_QUERY,
} from '@/sanity/lib/queries'
import type {
  Product,
  ProductCategory,
  ProductSummary,
  ShopConfig,
  ShopConfigInternal,
} from '@/sanity/lib/types'
import {
  DEFAULT_ESTIMATED_DELIVERY,
  DEFAULT_MAX_ITEMS_PER_ORDER,
  DEFAULT_MAX_QTY_PER_ITEM,
  DEFAULT_MIN_ORDER_VALUE,
  DEFAULT_ORDER_PREFIX,
  DEFAULT_STANDARD_DELIVERY_FEE,
  isShopStatus,
  sanitizePrefix,
} from '@/lib/shop'

/**
 * Catalogue revalidation, in seconds.
 *
 * Stock counts change with every order, and a stale "in stock" badge sends a
 * customer to a checkout that then rejects them. A minute is short enough that
 * the window is small and long enough that the shop is not re-querying Sanity
 * on every request. The checkout itself never trusts this cache — it reads
 * fresh with `revalidate: 0`.
 */
const CATALOGUE_TTL = 60

/** Config is read on nearly every shop request, and changes rarely. */
const CONFIG_TTL = 60

/**
 * Fill in every gap so callers never branch on a missing field.
 *
 * The singleton may be entirely absent — nobody has opened Studio yet — or
 * half-filled. A shop that renders a blank delivery fee or an undefined
 * quantity cap is worse than one running on documented defaults, and
 * `status` defaulting to `closed` means an unconfigured shop cannot
 * accidentally start taking orders it has no settings for.
 */
function withDefaults(config: Partial<ShopConfigInternal> | null): ShopConfigInternal {
  return {
    status: isShopStatus(config?.status) ? config.status : 'closed',
    closedMessage: config?.closedMessage,
    announcement: config?.announcement,
    standardDeliveryFee:
      typeof config?.standardDeliveryFee === 'number' && config.standardDeliveryFee >= 0
        ? Math.round(config.standardDeliveryFee)
        : DEFAULT_STANDARD_DELIVERY_FEE,
    campusDeliveryEnabled: config?.campusDeliveryEnabled !== false,
    campusHandoverPoints: (config?.campusHandoverPoints ?? []).filter(
      (p): p is string => typeof p === 'string' && p.trim().length > 0
    ),
    requireBracuEmailForCampus: config?.requireBracuEmailForCampus === true,
    estimatedDeliveryDays: config?.estimatedDeliveryDays || DEFAULT_ESTIMATED_DELIVERY,
    minOrderValue: clampInt(config?.minOrderValue, DEFAULT_MIN_ORDER_VALUE, 0),
    maxQtyPerItem: clampInt(config?.maxQtyPerItem, DEFAULT_MAX_QTY_PER_ITEM, 1),
    maxItemsPerOrder: clampInt(config?.maxItemsPerOrder, DEFAULT_MAX_ITEMS_PER_ORDER, 1),
    orderPrefix: sanitizePrefix(config?.orderPrefix || DEFAULT_ORDER_PREFIX),
    supportEmail: config?.supportEmail,
    supportPhone: config?.supportPhone,
    shippingPolicy: config?.shippingPolicy,
    returnPolicy: config?.returnPolicy,
    adminNotifyEmails: (config?.adminNotifyEmails ?? []).filter(
      (e): e is string => typeof e === 'string' && e.includes('@')
    ),
  }
}

function clampInt(value: unknown, fallback: number, min: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.max(min, Math.round(value))
}

/** Strip the internal-only fields. Use this anywhere a component sees the config. */
function toPublic(config: ShopConfigInternal): ShopConfig {
  const { adminNotifyEmails: _adminNotifyEmails, ...rest } = config
  return rest
}

// ── Config ────────────────────────────────────────────────────

/** Public shop settings. Safe to hand to a server component for rendering. */
export async function getShopConfig(): Promise<ShopConfig> {
  const raw = await sanityFetch<Partial<ShopConfig> | null>(SHOP_CONFIG_QUERY, {}, CONFIG_TTL)
  return toPublic(withDefaults(raw))
}

/**
 * Shop settings including the team notification inboxes.
 *
 * Route handlers only. Read uncached, because it also carries the open/closed
 * gate and a shop that was closed 59 seconds ago must not still accept orders.
 */
export async function getShopConfigInternal(): Promise<ShopConfigInternal> {
  const raw = await sanityFetch<Partial<ShopConfigInternal> | null>(
    SHOP_CONFIG_INTERNAL_QUERY,
    {},
    0
  )
  return withDefaults(raw)
}

// ── Catalogue ─────────────────────────────────────────────────

export async function getProducts(): Promise<ProductSummary[]> {
  return (await sanityFetch<ProductSummary[]>(PRODUCTS_QUERY, {}, CATALOGUE_TTL)) ?? []
}

export async function getFeaturedProducts(limit = 4): Promise<ProductSummary[]> {
  return (
    (await sanityFetch<ProductSummary[]>(FEATURED_PRODUCTS_QUERY, { limit }, CATALOGUE_TTL)) ?? []
  )
}

export async function getProduct(slug: string): Promise<Product | null> {
  return await sanityFetch<Product | null>(PRODUCT_BY_SLUG_QUERY, { slug }, CATALOGUE_TTL)
}

export async function getProductSlugs(): Promise<string[]> {
  return (await sanityFetch<string[]>(PRODUCT_SLUGS_QUERY, {}, CATALOGUE_TTL)) ?? []
}

export async function getCategories(): Promise<ProductCategory[]> {
  return (await sanityFetch<ProductCategory[]>(PRODUCT_CATEGORIES_QUERY, {}, CATALOGUE_TTL)) ?? []
}

export async function getRelatedProducts(
  id: string,
  categoryId: string | undefined,
  limit = 4
): Promise<ProductSummary[]> {
  if (!categoryId) return []
  return (
    (await sanityFetch<ProductSummary[]>(
      RELATED_PRODUCTS_QUERY,
      { id, categoryId, limit },
      CATALOGUE_TTL
    )) ?? []
  )
}

/**
 * Everything the /shop grid renders, in one round trip.
 *
 * Categories that ended up with no live products are dropped: a filter chip
 * that always yields an empty grid is a dead end the customer has to discover
 * by clicking it.
 */
export async function getShopPageData(): Promise<{
  config: ShopConfig
  products: ProductSummary[]
  categories: ProductCategory[]
}> {
  const [config, products, allCategories] = await Promise.all([
    getShopConfig(),
    getProducts(),
    getCategories(),
  ])

  const usedCategoryIds = new Set(products.map((p) => p.category?._id).filter(Boolean))
  const categories = allCategories.filter((c) => usedCategoryIds.has(c._id))

  return { config, products, categories }
}

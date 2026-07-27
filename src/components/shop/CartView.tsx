'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useCart } from '@/providers/CartProvider'
import type { CartIssue, PricedLine } from '@/lib/orders'
import { CAMPUS_DELIVERY_FEE, formatMoney } from '@/lib/shop'
import { CartIssues } from '@/components/shop/CartIssues'

export interface CartShopInfo {
  status: 'open' | 'paused' | 'closed'
  closedMessage?: string
  standardDeliveryFee: number
  campusDeliveryFee: number
  campusDeliveryEnabled?: boolean
  campusHandoverPoints?: string[]
  estimatedDeliveryDays?: string
  minOrderValue: number
  maxQtyPerItem: number
  maxItemsPerOrder: number
}

export interface CartResponse {
  lines: PricedLine[]
  issues: CartIssue[]
  subtotal: number
  itemCount: number
  items: { productId: string; variantKey: string; quantity: number }[]
  shop: CartShopInfo
}

/**
 * Fetch the live prices for whatever is in localStorage.
 *
 * Shared by the cart page and checkout so both work from one server-computed
 * truth. Returns the raw response rather than derived values, because checkout
 * needs the shop settings too.
 */
export function useHydratedCart() {
  const { items, hydrated, replace, applyLimits } = useCart()
  const [data, setData] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Tracks the newest request so a slow earlier response cannot overwrite a
  // faster later one — easy to trigger by clicking + twice in quick succession.
  const requestRef = useRef(0)

  const load = useCallback(async () => {
    if (!hydrated) return
    const request = ++requestRef.current
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/shop/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = (await res.json()) as CartResponse & { error?: string }
      if (request !== requestRef.current) return
      if (!res.ok) {
        setError(json.error || 'Could not load your cart.')
        return
      }
      setData(json)
      applyLimits(json.shop)
      // Write back the server's version of the cart, so lines it rejected stop
      // being re-sent on every subsequent request.
      if (json.issues.length > 0) replace(json.items)
    } catch {
      if (request !== requestRef.current) return
      setError('Could not reach the shop. Check your connection and try again.')
    } finally {
      if (request === requestRef.current) setLoading(false)
    }
    // `items` is the dependency that matters; replace/applyLimits are stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items])

  useEffect(() => {
    void load()
  }, [load])

  return { data, loading, error, reload: load }
}

/** The cart page body. */
export function CartView() {
  const { setQty, remove, hydrated } = useCart()
  const { data, loading, error } = useHydratedCart()

  if (!hydrated || (loading && !data)) {
    return <CartSkeleton />
  }

  if (error) {
    return (
      <div className="border border-divider bg-surface-raised px-6 py-12 text-center">
        <p className="text-text-muted">{error}</p>
      </div>
    )
  }

  const lines = data?.lines ?? []
  const issues = data?.issues ?? []
  const shop = data?.shop
  const subtotal = data?.subtotal ?? 0
  const belowMinimum = shop ? subtotal < shop.minOrderValue : false
  const canCheckout = lines.length > 0 && shop?.status === 'open' && !belowMinimum

  return (
    <div className="flex flex-col gap-6">
      {issues.length > 0 && <CartIssues issues={issues} />}

      {lines.length === 0 ? (
        <div className="border border-divider bg-surface-raised px-6 py-16 text-center">
          <p className="hud-label text-text-faint">Your cart is empty</p>
          <p className="mx-auto mt-3 max-w-md text-text-muted">
            Nothing in here yet. Everything in the store is made for the team and sold to fund the
            build.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
          >
            Browse the store
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          <ul className="flex flex-col border border-divider bg-surface-raised">
            {lines.map((line, index) => (
              <li
                key={`${line.productId}-${line.variantKey}`}
                className={`flex gap-4 p-4 ${index > 0 ? 'border-t border-divider' : ''}`}
              >
                <Link
                  href={`/shop/${line.productSlug}`}
                  className="relative h-20 w-20 shrink-0 overflow-hidden border border-divider bg-surface"
                >
                  {line.imageUrl ? (
                    <Image
                      src={line.imageUrl}
                      alt={line.productTitle}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-[10px] text-text-faint">
                      No image
                    </span>
                  )}
                </Link>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <Link
                    href={`/shop/${line.productSlug}`}
                    className="font-display text-sm font-bold uppercase leading-tight tracking-tight text-text transition-colors hover:text-primary"
                  >
                    {line.productTitle}
                  </Link>
                  <span className="text-xs text-text-faint">
                    {line.variantLabel}
                    {line.sku ? ` · ${line.sku}` : ''}
                  </span>
                  <span className="text-sm text-text-muted nums">
                    {formatMoney(line.unitPrice)} each
                  </span>

                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <div className="flex items-stretch border border-divider">
                      <button
                        type="button"
                        aria-label={`Decrease quantity of ${line.productTitle}`}
                        onClick={() =>
                          setQty(line.productId, line.variantKey, line.quantity - 1)
                        }
                        className="min-h-[40px] w-10 text-base font-bold text-text-muted transition-colors hover:text-primary"
                      >
                        −
                      </button>
                      <span className="flex min-h-[40px] w-10 items-center justify-center border-x border-divider text-sm font-semibold text-text nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.productTitle}`}
                        disabled={line.quantity >= line.maxQuantity}
                        onClick={() =>
                          setQty(line.productId, line.variantKey, line.quantity + 1)
                        }
                        className="min-h-[40px] w-10 text-base font-bold text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-text-faint"
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.productId, line.variantKey)}
                      className="text-xs font-semibold uppercase tracking-wider text-text-faint transition-colors hover:text-primary"
                    >
                      Remove
                    </button>

                    {line.quantity >= line.maxQuantity && (
                      <span className="text-xs text-text-faint">
                        {line.available !== null && line.available <= line.maxQuantity
                          ? 'All we have left'
                          : 'Maximum per order'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="font-display text-base font-bold text-text nums">
                    {formatMoney(line.lineTotal)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          <aside className="border border-divider bg-surface-raised p-5 lg:sticky lg:top-24">
            <h2 className="hud-label mb-4 text-text-muted">Summary</h2>

            <dl className="flex flex-col gap-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-text-muted">Subtotal</dt>
                <dd className="font-semibold text-text nums">{formatMoney(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-text-muted">Delivery</dt>
                <dd className="text-text-muted">Chosen at checkout</dd>
              </div>
            </dl>

            {shop && (
              <p className="mt-3 border-t border-divider pt-3 text-xs leading-relaxed text-text-faint">
                Home delivery {formatMoney(shop.standardDeliveryFee)}.
                {shop.campusDeliveryEnabled !== false &&
                  ` Handover on BRACU campus is ${CAMPUS_DELIVERY_FEE === 0 ? 'free' : formatMoney(CAMPUS_DELIVERY_FEE)}.`}
              </p>
            )}

            {belowMinimum && shop && (
              <p className="mt-4 border border-primary/40 bg-primary-highlight px-3 py-2 text-xs font-semibold text-primary">
                Orders start at {formatMoney(shop.minOrderValue)}. Add{' '}
                {formatMoney(shop.minOrderValue - subtotal)} more to check out.
              </p>
            )}

            {shop?.status !== 'open' && (
              <p className="mt-4 border border-divider bg-surface px-3 py-2 text-xs leading-relaxed text-text-muted">
                {shop?.closedMessage || 'The shop is not taking orders right now.'}
              </p>
            )}

            {canCheckout ? (
              <Link
                href="/shop/checkout"
                className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
              >
                Checkout
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ) : (
              <span className="mt-5 inline-flex min-h-[48px] w-full cursor-not-allowed items-center justify-center rounded-none bg-surface-offset px-6 py-3 text-sm font-semibold text-text-faint">
                Checkout unavailable
              </span>
            )}

            <Link
              href="/shop"
              className="mt-3 inline-flex w-full items-center justify-center text-xs font-semibold uppercase tracking-wider text-text-faint transition-colors hover:text-primary"
            >
              Continue shopping
            </Link>
          </aside>
        </div>
      )}
    </div>
  )
}

function CartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="flex flex-col border border-divider bg-surface-raised">
        {[0, 1].map((i) => (
          <div key={i} className={`flex gap-4 p-4 ${i > 0 ? 'border-t border-divider' : ''}`}>
            <div className="h-20 w-20 shrink-0 animate-pulse bg-surface-2" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-3 w-2/3 animate-pulse bg-surface-2" />
              <div className="h-3 w-1/4 animate-pulse bg-surface-2" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-56 animate-pulse border border-divider bg-surface-raised" />
      <span className="sr-only" aria-live="polite">
        Loading your cart
      </span>
    </div>
  )
}

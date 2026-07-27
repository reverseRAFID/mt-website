'use client'

import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import type { Product, ProductVariant } from '@/sanity/lib/types'
import { useCart } from '@/providers/CartProvider'
import { formatMoney, DEFAULT_VARIANT_AXIS_LABEL } from '@/lib/shop'
import {
  activeVariants,
  availableStock,
  defaultVariant,
  isVariantPurchasable,
  maxPurchasable,
  variantPrice,
} from '@/lib/product'

/** Below this, the picker warns how few are left. */
const LOW_STOCK_AT = 5

/**
 * Variant picker, quantity stepper, and the add-to-cart button.
 *
 * The only place on a product page that touches the cart. Everything it
 * enforces — stock, per-product caps, the shop-wide cap — is re-enforced by the
 * server at checkout; the point of doing it here is to stop the customer
 * choosing something that will be rejected later, not to be the authority.
 */
export function AddToCart({ product, shopOpen }: { product: Product; shopOpen: boolean }) {
  const { add, maxQtyPerItem, items, hydrated } = useCart()
  const variants = activeVariants(product)
  const axisLabel = product.variantAxisLabel || DEFAULT_VARIANT_AXIS_LABEL
  const pickerId = useId()

  const [variantKey, setVariantKey] = useState<string | undefined>(
    () => defaultVariant(product)?._key
  )
  const [quantity, setQuantity] = useState(1)
  const [justAdded, setJustAdded] = useState(false)

  const selected: ProductVariant | undefined =
    variants.find((v) => v._key === variantKey) ?? variants[0]

  const stock = selected ? availableStock(product, selected) : 0
  const purchasable = selected ? isVariantPurchasable(product, selected) : false
  const ceiling = selected ? maxPurchasable(product, selected, maxQtyPerItem) : 0

  // How many of this exact variant are already sitting in the cart. Without
  // this the customer could add 3, then 3 again, and only discover the cap at
  // checkout.
  const inCart =
    items.find((i) => i.productId === product._id && i.variantKey === selected?._key)?.quantity ?? 0
  const remaining = Math.max(0, ceiling - inCart)

  // Changing size re-anchors the quantity: the new variant may allow fewer.
  useEffect(() => {
    setQuantity(1)
    setJustAdded(false)
  }, [variantKey])

  // The confirmation is transient — it should not still be sitting there when
  // the customer scrolls back up two minutes later.
  useEffect(() => {
    if (!justAdded) return
    const timer = setTimeout(() => setJustAdded(false), 6000)
    return () => clearTimeout(timer)
  }, [justAdded])

  if (variants.length === 0) {
    return (
      <p className="border border-divider bg-surface px-4 py-3 text-sm text-text-muted">
        This product has no options available right now.
      </p>
    )
  }

  const unitPrice = selected ? variantPrice(product, selected) : product.basePrice
  const canAdd = shopOpen && purchasable && remaining > 0

  function handleAdd() {
    if (!selected || !canAdd) return
    add(product._id, selected._key, Math.min(quantity, remaining))
    setJustAdded(true)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ── Variant picker ── */}
      {variants.length > 1 && (
        <div>
          <div className="mb-2.5 flex items-baseline justify-between gap-3">
            <span id={pickerId} className="hud-label text-text-muted">
              {axisLabel}
            </span>
            {selected && !purchasable && (
              <span className="text-xs font-semibold text-text-faint">Sold out in this option</span>
            )}
          </div>
          <div role="radiogroup" aria-labelledby={pickerId} className="flex flex-wrap gap-2">
            {variants.map((variant) => {
              const ok = isVariantPurchasable(product, variant)
              const isSelected = variant._key === selected?._key
              return (
                <button
                  key={variant._key}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  onClick={() => setVariantKey(variant._key)}
                  // Sold-out options stay selectable, not disabled. A disabled
                  // control is skipped by screen readers and gives no reason;
                  // this way the customer can select it and be told why.
                  className={`relative min-h-[44px] min-w-[52px] rounded-none border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isSelected
                      ? 'border-primary bg-primary text-on-accent'
                      : ok
                        ? 'border-divider bg-surface-raised text-text hover:border-primary hover:text-primary'
                        : 'border-divider bg-surface text-text-faint line-through'
                  }`}
                >
                  {variant.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Price + stock ── */}
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-display text-3xl font-bold text-text nums">
          {formatMoney(unitPrice)}
        </span>
        {typeof product.compareAtPrice === 'number' && product.compareAtPrice > unitPrice && (
          <span className="text-base text-text-faint line-through nums">
            {formatMoney(product.compareAtPrice)}
          </span>
        )}
        {product.trackInventory === false ? (
          <span className="hud-label text-text-faint">Made to order</span>
        ) : purchasable && stock <= LOW_STOCK_AT ? (
          <span className="hud-label text-primary">Only {stock} left</span>
        ) : null}
      </div>

      {/* ── Quantity + add ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
        <QuantityStepper
          value={quantity}
          max={Math.max(1, remaining)}
          disabled={!canAdd}
          onChange={setQuantity}
        />

        <button
          type="button"
          onClick={handleAdd}
          disabled={!canAdd}
          className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-surface-offset disabled:text-text-faint"
        >
          {!shopOpen
            ? 'Shop closed'
            : !purchasable
              ? 'Sold out'
              : remaining === 0
                ? 'Max in cart'
                : 'Add to cart'}
        </button>
      </div>

      {/* Only rendered after hydration — before that the cart is unknown, and
          claiming "0 in your cart" would be a lie the server never told. */}
      {hydrated && inCart > 0 && (
        <p className="text-sm text-text-muted">
          <span className="nums font-semibold text-text">{inCart}</span> already in your cart.
          {remaining === 0 && ' That is the maximum for this item.'}
        </p>
      )}

      {/* aria-live so the confirmation is announced, not just shown. */}
      <div aria-live="polite" className="min-h-0">
        {justAdded && (
          <div className="flex flex-wrap items-center gap-3 border border-primary/40 bg-primary-highlight px-4 py-3">
            <span className="text-sm font-semibold text-primary">Added to your cart.</span>
            <Link
              href="/shop/cart"
              className="text-sm font-semibold text-text underline underline-offset-4 transition-colors hover:text-primary"
            >
              View cart
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

function QuantityStepper({
  value,
  max,
  disabled,
  onChange,
}: {
  value: number
  max: number
  disabled: boolean
  onChange: (next: number) => void
}) {
  const id = useId()
  return (
    <div className="flex items-stretch border border-divider bg-surface-raised">
      <label htmlFor={id} className="sr-only">
        Quantity
      </label>
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(Math.max(1, value - 1))}
        className="min-h-[48px] w-12 text-lg font-bold text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-text-faint"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={max}
        value={value}
        disabled={disabled}
        // Typed input is clamped on change, so the field cannot hold a value
        // the button would then silently ignore.
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10)
          if (!Number.isFinite(next)) return
          onChange(Math.min(Math.max(1, next), max))
        }}
        className="w-14 min-h-[48px] border-x border-divider bg-transparent text-center text-sm font-semibold text-text nums [appearance:textfield] focus:outline-none focus:ring-1 focus:ring-primary/30 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="min-h-[48px] w-12 text-lg font-bold text-text-muted transition-colors hover:text-primary disabled:cursor-not-allowed disabled:text-text-faint"
      >
        +
      </button>
    </div>
  )
}

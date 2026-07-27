'use client'

import { useMemo, useState } from 'react'
import type { ProductCategory, ProductSummary } from '@/sanity/lib/types'
import { ProductCard } from '@/components/shop/ProductCard'
import { Reveal } from '@/components/motion/Reveal'
import { isSoldOut } from '@/lib/product'

const ALL = '__all__'

/**
 * The shop grid with its category filter.
 *
 * Filtering is client-side over an already-loaded list. The catalogue is a
 * couple of dozen items at most, so shipping it once and filtering in place
 * beats a round trip per chip — the filter feels instant and works offline
 * after first load.
 *
 * Sold-out products sort to the end rather than being hidden. Someone who came
 * looking for a specific item deserves to see that it exists and has gone,
 * instead of concluding the shop never had it.
 */
export function ShopGrid({
  products,
  categories,
}: {
  products: ProductSummary[]
  categories: ProductCategory[]
}) {
  const [active, setActive] = useState<string>(ALL)

  const visible = useMemo(() => {
    const filtered =
      active === ALL ? products : products.filter((p) => p.category?._id === active)
    return [...filtered].sort((a, b) => Number(isSoldOut(a)) - Number(isSoldOut(b)))
  }, [products, active])

  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const product of products) {
      const id = product.category?._id
      if (id) map.set(id, (map.get(id) ?? 0) + 1)
    }
    return map
  }, [products])

  if (products.length === 0) {
    return (
      <div className="border border-divider bg-surface-raised px-6 py-16 text-center">
        <p className="hud-label text-text-faint">Nothing here yet</p>
        <p className="mt-3 text-text-muted">
          There is no merchandise listed at the moment. Check back before the next competition —
          that is usually when a new drop lands.
        </p>
      </div>
    )
  }

  return (
    <div>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filter products by category"
          className="mb-8 flex flex-wrap gap-2"
        >
          <FilterChip
            active={active === ALL}
            onClick={() => setActive(ALL)}
            label="Everything"
            count={products.length}
          />
          {categories.map((category) => (
            <FilterChip
              key={category._id}
              active={active === category._id}
              onClick={() => setActive(category._id)}
              label={category.title}
              count={counts.get(category._id) ?? 0}
            />
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="border border-divider bg-surface-raised px-6 py-12 text-center text-text-muted">
          Nothing in this category right now.
        </p>
      ) : (
        <Reveal
          stagger
          // Re-runs the entrance when the filter changes, so newly shown cards
          // animate in rather than appearing already-faded from a previous run.
          dependencies={[active]}
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {visible.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </Reveal>
      )}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-none border px-4 py-2 text-sm font-semibold transition-colors ${
        active
          ? 'border-primary bg-primary text-on-accent'
          : 'border-divider bg-surface-raised text-text-muted hover:border-primary hover:text-primary'
      }`}
    >
      {label}
      <span className={`nums text-xs ${active ? 'text-on-accent/70' : 'text-text-faint'}`}>
        {count}
      </span>
    </button>
  )
}

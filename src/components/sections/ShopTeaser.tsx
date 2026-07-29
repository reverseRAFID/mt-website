import Link from 'next/link'
import type { Product } from '@/lib/cms/types'
import { ProductCard } from '@/components/shop/ProductCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Reveal } from '@/components/motion/Reveal'
import { GhostText } from '@/components/motion/GhostText'

/**
 * Homepage merch strip.
 *
 * Renders nothing when there is nothing to show — the caller decides, but this
 * guards anyway, because a "Store" heading over an empty row reads as broken
 * rather than as "coming soon".
 */
export function ShopTeaser({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section className="relative overflow-hidden border-t border-divider py-20 lg:py-28">
      <GhostText text="STORE" />

      <div className="section-container relative">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader
            kicker="Merch Store"
            title="Wear the Mission"
            description="Every order goes straight into parts, fabrication and getting the rover onto the field."
          />
          <Link
            href="/shop"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
          >
            Everything in the store
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform group-hover:translate-x-0.5"
              aria-hidden
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <Reveal stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Reveal>
      </div>
    </section>
  )
}

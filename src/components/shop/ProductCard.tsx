import Image from 'next/image'
import Link from 'next/link'
import { media } from '@/lib/cms/media'
import { rel } from '@/lib/cms/relations'
import type { Product, ProductCategory } from '@/lib/cms/types'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { formatMoney } from '@/lib/shop'
import { hasPriceRange, isSoldOut, priceRange, totalStock } from '@/lib/product'

/** Below this many units left, the card says so. Scarcity, honestly stated. */
const LOW_STOCK_AT = 5

/**
 * A product tile for the shop grid.
 *
 * Server component — it renders no interactivity of its own, so the whole grid
 * can stream as HTML. Adding to the cart happens on the product page, where the
 * customer has actually chosen a size.
 */
export function ProductCard({ product }: { product: Product }) {
  const category = rel<ProductCategory>(product.category)
  const soldOut = isSoldOut(product)
  const { min } = priceRange(product)
  const showFrom = hasPriceRange(product)
  const stock = totalStock(product)
  const lowStock = Number.isFinite(stock) && stock > 0 && stock <= LOW_STOCK_AT
  const onSale =
    typeof product.compareAtPrice === 'number' && product.compareAtPrice > product.basePrice

  return (
    <Link
      href={`/shop/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-none border border-divider bg-surface-raised transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <CornerTicks className="z-10 text-primary/0 transition-colors group-hover:text-primary/40" />

      <div className="relative aspect-square overflow-hidden bg-surface">
        {media(product.images?.[0]) ? (
          <Image
            src={media(product.images?.[0])?.url ?? ''}
            alt={product.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className={`object-cover transition-transform duration-500 group-hover:scale-105 ${
              soldOut ? 'opacity-45 grayscale' : ''
            }`}
          />
        ) : (
          // The schema requires an image, so this only shows for a document
          // saved before that rule or fetched mid-upload. Better a labelled
          // placeholder than a broken image icon.
          <div className="flex h-full w-full items-center justify-center bg-surface-2">
            <span className="hud-label text-text-faint">No image</span>
          </div>
        )}

        <div className="absolute left-0 top-0 flex flex-col items-start gap-1 p-3">
          {soldOut && (
            <span className="bg-text px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-bg">
              Sold out
            </span>
          )}
          {!soldOut && onSale && (
            <span className="bg-primary px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-on-accent">
              Sale
            </span>
          )}
          {!soldOut && !onSale && lowStock && (
            <span className="bg-primary-highlight px-2 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Only {stock} left
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-divider p-4">
        {category?.title && (
          <span className="hud-label text-text-faint">{category.title}</span>
        )}
        <h3 className="font-display text-base font-bold uppercase leading-tight tracking-tight text-text transition-colors group-hover:text-primary">
          {product.title}
        </h3>
        {product.tagline && (
          <p className="line-clamp-2 text-sm leading-relaxed text-text-muted">{product.tagline}</p>
        )}

        <div className="mt-auto flex items-baseline gap-2 pt-3">
          {showFrom && <span className="hud-label text-text-faint">From</span>}
          <span className="font-display text-lg font-bold text-text nums">{formatMoney(min)}</span>
          {onSale && (
            <span className="text-sm text-text-faint line-through nums">
              {formatMoney(product.compareAtPrice!)}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { ShopGrid } from '@/components/shop/ShopGrid'
import { getShopPageData } from '@/lib/cms/shop'
import { CAMPUS_DELIVERY_FEE, formatMoney } from '@/lib/shop'

export const metadata: Metadata = {
  title: 'Merch Store',
  description:
    'Official BRACU Mongol-Tori merchandise — tees, hoodies, caps and workshop kit. Every order funds the rover build. Cash on delivery across Bangladesh, free handover on BRAC University campus.',
}

/**
 * Stock counts drive what this page says is available, and they change with
 * every order. A minute keeps the grid honest without re-querying Sanity on
 * each request; the cart and checkout never trust it and read live.
 */
export const revalidate = 60

export default async function ShopPage() {
  const { config, products, categories } = await getShopPageData()

  const closed = config.status !== 'open'

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker="Merch Store"
        title="Wear the Mission"
        description="Everything here is made for the team and sold to fund the build — parts, fabrication, and getting a Bangladeshi rover onto the field. Cash on delivery, anywhere in Bangladesh."
        watermark="STORE"
        stat={products.length > 0 ? { value: products.length, label: 'Products' } : undefined}
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-text-muted">
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
            Home delivery {formatMoney(config.standardDeliveryFee)}
          </span>
          {config.campusDeliveryEnabled !== false && (
            <span className="inline-flex items-center gap-2">
              <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
              Free on BRACU campus
              {CAMPUS_DELIVERY_FEE !== 0 && ` (${formatMoney(CAMPUS_DELIVERY_FEE)})`}
            </span>
          )}
          <Link
            href="/shop/track"
            className="font-semibold text-text underline underline-offset-4 transition-colors hover:text-primary"
          >
            Track an order
          </Link>
        </div>
      </PageHero>

      <section className="relative py-14 lg:py-20">
        <div className="section-container">
          {/* The announcement runs above the grid so it is read before anything
              is added to a cart, not after. */}
          {config.announcement && (
            <p className="mb-6 border border-primary/40 bg-primary-highlight px-4 py-3 text-sm font-semibold text-primary">
              {config.announcement}
            </p>
          )}

          {closed && (
            <div className="mb-8 border border-divider bg-surface-raised px-5 py-4">
              <p className="hud-label text-text-faint">
                {config.status === 'paused' ? 'Checkout paused' : 'Store closed'}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-muted">
                {config.closedMessage ||
                  'The store is not taking orders right now. Everything below is still here — check back soon.'}
              </p>
            </div>
          )}

          <ShopGrid products={products} categories={categories} />
        </div>
      </section>

      {(config.shippingPolicy || config.returnPolicy) && (
        <section className="relative border-t border-divider bg-surface py-14 lg:py-20">
          <div className="section-container grid gap-8 md:grid-cols-2">
            {config.shippingPolicy && (
              <div>
                <h2 className="hud-label mb-3 text-primary">Shipping</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                  {config.shippingPolicy}
                </p>
              </div>
            )}
            {config.returnPolicy && (
              <div>
                <h2 className="hud-label mb-3 text-primary">Returns</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-text-muted">
                  {config.returnPolicy}
                </p>
              </div>
            )}
          </div>
        </section>
      )}
    </PageLayout>
  )
}

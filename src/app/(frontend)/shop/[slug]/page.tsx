import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { RichTextBody } from '@/lib/cms/richtext'
import { PageLayout } from '@/components/layout/PageLayout'
import { Accordion } from '@/components/ui/Accordion'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Reveal } from '@/components/motion/Reveal'
import { ProductCard } from '@/components/shop/ProductCard'
import { ProductGallery } from '@/components/shop/ProductGallery'
import { AddToCart } from '@/components/shop/AddToCart'
import { ogImageUrl } from '@/lib/cms/media'
import { rel } from '@/lib/cms/relations'
import type { ProductCategory } from '@/lib/cms/types'
import { getProduct, getProductSlugs, getRelatedProducts, getShopConfig } from '@/lib/cms/shop'
import { formatMoney } from '@/lib/shop'
import { isSoldOut, priceRange } from '@/lib/product'

interface Props {
  params: Promise<{ slug: string }>
}

export const revalidate = 60

export async function generateStaticParams() {
  const slugs = await getProductSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProduct(slug)
  if (!product) return { title: 'Product' }

  const og = ogImageUrl(product.images?.[0])
  const { min } = priceRange(product)

  return {
    title: product.title,
    description:
      product.tagline ?? `${product.title} — official BRACU Mongol-Tori merchandise.`,
    openGraph: {
      title: `${product.title} · BRACU Mongol-Tori`,
      description: product.tagline ?? undefined,
      images: og ? [og] : undefined,
    },
    other: {
      // Read by nothing in particular, but it keeps the price visible to any
      // scraper that renders metadata rather than the DOM.
      'product:price:amount': String(min),
      'product:price:currency': 'BDT',
    },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params

  // Config comes along because the Add-to-cart button has to know whether the
  // shop is even taking orders.
  const [product, config] = await Promise.all([getProduct(slug), getShopConfig()])

  // getProduct filters on isActive, so a withdrawn product 404s rather than
  // sitting on a page that cannot be ordered from.
  if (!product) notFound()

  const category = rel<ProductCategory>(product.category)
  const related = await getRelatedProducts(product.id, category?.id, 4)
  const soldOut = isSoldOut(product)

  // The Accordion's item shape is {question, answer} — it was built for the
  // FAQ. The labels here are headings rather than questions, which reads fine.
  const accordionItems = [
    product.sizeGuide && { question: 'Size guide', answer: product.sizeGuide },
    product.careInfo && { question: 'Care', answer: product.careInfo },
    config.shippingPolicy && { question: 'Shipping & delivery', answer: config.shippingPolicy },
    config.returnPolicy && { question: 'Returns', answer: config.returnPolicy },
  ].filter(Boolean) as { question: string; answer: string }[]

  return (
    <PageLayout>
      <section className="relative border-b border-divider py-8 lg:py-12">
        <div className="section-container">
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-xs">
              <li>
                <Link href="/shop" className="hud-label text-text-faint transition-colors hover:text-primary">
                  Store
                </Link>
              </li>
              {product.category && (
                <>
                  <li aria-hidden className="text-text-faint">
                    /
                  </li>
                  <li className="hud-label text-text-faint">{category!.title}</li>
                </>
              )}
            </ol>
          </nav>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            <ProductGallery images={product.images ?? []} title={product.title} />

            <div className="flex flex-col gap-6">
              <div>
                {product.category && (
                  <span className="hud-label text-primary">{category!.title}</span>
                )}
                <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
                  {product.title}
                </h1>
                {product.tagline && (
                  <p className="mt-3 text-base leading-relaxed text-text-muted">
                    {product.tagline}
                  </p>
                )}
              </div>

              {soldOut ? (
                <div className="border border-divider bg-surface px-4 py-4">
                  <p className="hud-label text-text-faint">Sold out</p>
                  <p className="mt-2 text-sm leading-relaxed text-text-muted">
                    Every option has gone. We restock between competitions — the store announcement
                    is where a new drop gets called.
                  </p>
                  <p className="mt-3 font-display text-2xl font-bold text-text nums">
                    {formatMoney(priceRange(product).min)}
                  </p>
                </div>
              ) : (
                <AddToCart product={product} shopOpen={config.status === 'open'} />
              )}

              {config.status !== 'open' && !soldOut && (
                <p className="border border-divider bg-surface px-4 py-3 text-sm leading-relaxed text-text-muted">
                  {config.closedMessage || 'The store is not taking orders right now.'}
                </p>
              )}

              {product.description && (
                <div className="prose-shop border-t border-divider pt-6 text-sm leading-relaxed text-text-muted [&_a]:text-primary [&_a]:underline [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:font-display [&_h3]:text-base [&_h3]:font-bold [&_h3]:uppercase [&_h3]:text-text [&_p]:mb-3 [&_strong]:font-semibold [&_strong]:text-text">
                  <RichTextBody value={product.description} />
                </div>
              )}

              {accordionItems.length > 0 && (
                <div className="border-t border-divider pt-6">
                  <Accordion items={accordionItems} />
                </div>
              )}

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-divider pt-5 text-xs text-text-faint">
                <span>Home delivery {formatMoney(config.standardDeliveryFee)}</span>
                {config.campusDeliveryEnabled !== false && <span>Free on BRACU campus</span>}
                {config.estimatedDeliveryDays && <span>{config.estimatedDeliveryDays}</span>}
                <span>Cash on delivery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="relative py-14 lg:py-20">
          <div className="section-container">
            <div className="mb-8 flex items-center gap-2.5">
              <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
              <h2 className="hud-label text-text-muted">More from {category?.title}</h2>
            </div>
            <Reveal stagger className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </Reveal>
          </div>
        </section>
      )}

      <section className="relative border-t border-divider bg-surface py-12">
        <div className="section-container">
          <div className="relative flex flex-col items-start gap-3 border border-divider bg-surface-raised p-6 sm:flex-row sm:items-center sm:justify-between">
            <CornerTicks className="text-primary/20" />
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-tight text-text">
                Already ordered?
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Follow your parcel with the reference from your confirmation email.
              </p>
            </div>
            <Link
              href="/shop/track"
              className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              Track an order
            </Link>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

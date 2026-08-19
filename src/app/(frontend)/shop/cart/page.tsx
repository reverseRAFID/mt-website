import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { CartView } from '@/components/shop/CartView'
import { isShopPublic } from '@/lib/cms/shop'

export const metadata: Metadata = {
  title: 'Your Cart',
  // The cart is personal to the browser holding it. There is nothing here for a
  // search engine to index, and indexing it would only surface an empty page.
  robots: { index: false, follow: true },
}

export default async function CartPage() {
  // No storefront, no cart. The badge that links here is already gone from the
  // navbar; this catches a bookmark or a back button.
  if (!(await isShopPublic())) notFound()

  return (
    <PageLayout>
      <PageHero
        index="01"
        kicker="Merch Store"
        title="Your Cart"
        description="Prices and stock are checked live, so what you see here is what is actually available right now."
        watermark="CART"
      />

      <section className="relative py-12 lg:py-16">
        <div className="section-container">
          <CartView />
        </div>
      </section>
    </PageLayout>
  )
}

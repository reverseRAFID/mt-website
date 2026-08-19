import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { CheckoutForm } from '@/components/shop/CheckoutForm'
import { isShopPublic } from '@/lib/cms/shop'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  // Belt and braces with /api/shop/order, which refuses the submission anyway.
  // This is the half that stops the form being rendered at all.
  if (!(await isShopPublic())) notFound()

  return (
    <PageLayout>
      <PageHero
        index="02"
        kicker="Merch Store"
        title="Checkout"
        description="No account needed. Tell us where it goes and pay in cash when it arrives."
        watermark="CHECKOUT"
      />

      <section className="relative py-12 lg:py-16">
        <div className="section-container">
          <CheckoutForm />
        </div>
      </section>
    </PageLayout>
  )
}

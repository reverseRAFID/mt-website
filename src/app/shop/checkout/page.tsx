import type { Metadata } from 'next'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { CheckoutForm } from '@/components/shop/CheckoutForm'

export const metadata: Metadata = {
  title: 'Checkout',
  robots: { index: false, follow: false },
}

export default function CheckoutPage() {
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

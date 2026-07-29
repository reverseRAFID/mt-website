import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { TrackForm } from '@/components/shop/TrackForm'
import { getShopConfig } from '@/lib/cms/shop'

export const metadata: Metadata = {
  title: 'Track Your Order',
  description:
    'Follow a BRACU Mongol-Tori merch order with the tracking reference from your confirmation email.',
}

export default async function TrackPage() {
  const config = await getShopConfig()

  return (
    <PageLayout>
      <PageHero
        index="03"
        kicker="Merch Store"
        title="Track Your Order"
        description="Enter the reference from your confirmation email and we will show you exactly where your order has got to."
        watermark="TRACK"
      />

      <section className="relative py-12 lg:py-16">
        <div className="section-container">
          <div className="mx-auto max-w-xl">
            <div className="relative border border-divider bg-surface-raised p-6 sm:p-8">
              <CornerTicks className="text-primary/25" size="md" />
              <TrackForm autoFocus />
            </div>

            <div className="mt-8 flex flex-col gap-4 text-sm leading-relaxed text-text-muted">
              <p>
                <span className="font-semibold text-text">Cannot find the email?</span> Check your
                spam folder — it comes from our store address and arrives within a minute of
                ordering.
              </p>
              <p>
                <span className="font-semibold text-text">Still stuck?</span>{' '}
                {config.supportEmail || config.supportPhone ? (
                  <>
                    Get in touch
                    {config.supportEmail && (
                      <>
                        {' '}
                        at{' '}
                        <a
                          href={`mailto:${config.supportEmail}`}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {config.supportEmail}
                        </a>
                      </>
                    )}
                    {config.supportPhone && (
                      <>
                        {config.supportEmail ? ' or call ' : ' on '}
                        <a
                          href={`tel:${config.supportPhone.replace(/\s/g, '')}`}
                          className="font-semibold text-primary underline underline-offset-4"
                        >
                          {config.supportPhone}
                        </a>
                      </>
                    )}
                    {' '}with the name and phone number you ordered with.
                  </>
                ) : (
                  <>
                    <Link
                      href="/contact"
                      className="font-semibold text-primary underline underline-offset-4"
                    >
                      Contact us
                    </Link>{' '}
                    with the name and phone number you ordered with.
                  </>
                )}
              </p>
              <p className="text-xs text-text-faint">
                For your privacy, the tracking page hides most of your address and phone number.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

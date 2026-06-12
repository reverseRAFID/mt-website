import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { ACTIVE_SPONSORS_QUERY } from '@/sanity/lib/queries'
import type { Sponsor } from '@/sanity/lib/types'
import { ThemeLogo } from '@/components/ui/ThemeLogo'

export const metadata: Metadata = { title: 'Sponsors' }

const TIER_ORDER = ['title', 'gold', 'silver', 'bronze', 'in-kind']

const TIER_CONFIG: Record<string, { label: string; size: string; cols: string }> = {
  title: { label: 'Title Sponsor', size: 'h-16', cols: 'grid-cols-1 sm:grid-cols-2' },
  gold: { label: 'Gold', size: 'h-12', cols: 'grid-cols-2 sm:grid-cols-3' },
  silver: { label: 'Silver', size: 'h-10', cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' },
  bronze: { label: 'Bronze', size: 'h-8', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' },
  'in-kind': { label: 'In-Kind', size: 'h-7', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' },
}

export default async function SponsorsPage() {
  const sponsors = await sanityFetch<Sponsor[]>(ACTIVE_SPONSORS_QUERY)

  const grouped = TIER_ORDER.reduce<Record<string, Sponsor[]>>((acc, tier) => {
    acc[tier] = sponsors?.filter((s) => s.tier === tier) ?? []
    return acc
  }, {})

  const getSponsorLogoSources = (sponsor: Sponsor) => {
    const fallback = sponsor.logo ? urlFor(sponsor.logo).height(64).url() : undefined
    const lightSrc = sponsor.logoLight ? urlFor(sponsor.logoLight).height(64).url() : fallback
    const darkSrc = sponsor.logoDark ? urlFor(sponsor.logoDark).height(64).url() : fallback

    return { lightSrc, darkSrc }
  }

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Partners</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Sponsors</h1>
          <p className="text-text-muted text-lg max-w-xl">
            The organizations that make our mission possible — from competition entry fees to rover components.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!sponsors?.length ? (
          <div className="py-20 text-center text-text-muted">
            No sponsors yet — add them in Sanity CMS → Sponsors.
          </div>
        ) : (
          <div className="flex flex-col gap-14">
            {TIER_ORDER.filter((tier) => grouped[tier]?.length > 0).map((tier) => {
              const cfg = TIER_CONFIG[tier]
              return (
                <div key={tier}>
                  <h2 className="font-display font-bold text-sm text-text-faint uppercase tracking-widest mb-6 accent-line">{cfg.label}</h2>
                  <div className={`grid ${cfg.cols} gap-6 items-center`}>
                    {grouped[tier].map((sponsor) => (
                      <a
                        key={sponsor._id}
                        href={sponsor.website ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-surface rounded-xl border border-divider p-6 flex items-center justify-center hover:border-primary/40 hover:shadow-md transition-all duration-200 group"
                        aria-label={sponsor.name}
                      >
                        {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
                          <ThemeLogo
                            {...getSponsorLogoSources(sponsor)}
                            alt={sponsor.name}
                            width={160}
                            height={64}
                            className={`object-contain ${cfg.size} group-hover:opacity-100 transition-all duration-200`}
                          />
                        ) : (
                          <span className="font-display font-bold text-lg text-text-muted group-hover:text-primary transition-colors">{sponsor.name}</span>
                        )}
                      </a>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Become a sponsor CTA */}
        <div className="mt-16 bg-primary-highlight border border-primary/20 rounded-2xl p-8 text-center">
          <h2 className="font-display font-bold text-2xl text-text mb-3">Become a Sponsor</h2>
          <p className="text-text-muted max-w-lg mx-auto mb-6">
            Help Bangladesh&apos;s top Mars rover team compete on the world stage. We offer branding, demo days, and direct access to top engineering talent.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold transition-colors"
          >
            Get in Touch
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}

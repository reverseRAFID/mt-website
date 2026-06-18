import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { ACTIVE_SPONSORS_QUERY } from '@/sanity/lib/queries'
import type { Sponsor } from '@/sanity/lib/types'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

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
      {/* Page hero band */}
      <PageHero
        kicker="Partners"
        title="Sponsors"
        description="The organizations that make our mission possible — from competition entry fees to rover components."
        watermark="PARTNERS"
      />

      <section className="relative py-20 lg:py-28">
        <div className="section-container">
          {!sponsors?.length ? (
            <div className="rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No sponsors yet — add them in Sanity CMS → Sponsors.
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {TIER_ORDER.filter((tier) => grouped[tier]?.length > 0).map((tier) => {
                const cfg = TIER_CONFIG[tier]
                return (
                  <div key={tier}>
                    <div className="mb-7 flex items-center gap-3">
                      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                      <h2 className="hud-label text-text">{cfg.label}</h2>
                      <span className="h-px flex-1 bg-divider" aria-hidden />
                    </div>
                    <Reveal stagger className={`grid ${cfg.cols} items-stretch gap-4 sm:gap-6`}>
                      {grouped[tier].map((sponsor) => (
                        <a
                          key={sponsor._id}
                          href={sponsor.website ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative flex min-h-[88px] items-center justify-center rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                          aria-label={sponsor.name}
                        >
                          <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                          {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
                            <ThemeLogo
                              {...getSponsorLogoSources(sponsor)}
                              alt={sponsor.name}
                              width={160}
                              height={64}
                              className={`object-contain ${cfg.size} opacity-80 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0`}
                            />
                          ) : (
                            <span className="font-display text-lg font-bold text-text-muted transition-colors group-hover:text-primary">
                              {sponsor.name}
                            </span>
                          )}
                        </a>
                      ))}
                    </Reveal>
                  </div>
                )
              })}
            </div>
          )}

          {/* Become a sponsor CTA */}
          <Reveal className="mt-16">
            <div className="relative overflow-hidden rounded-card border border-primary/30 bg-primary-highlight p-8 text-center lg:p-12">
              <CornerTicks className="text-primary/40" />
              <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40" />
              <div className="relative mx-auto max-w-lg">
                <div className="mb-4 flex items-center justify-center gap-2.5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <span className="hud-label text-primary">Join the mission</span>
                </div>
                <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  Become a Sponsor
                </h2>
                <p className="mb-7 text-text-muted leading-relaxed">
                  Help Bangladesh&apos;s top Mars rover team compete on the world stage. We offer branding, demo days, and direct access to top engineering talent.
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 rounded-none bg-primary px-6 py-3 font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  Get in Touch
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageLayout>
  )
}

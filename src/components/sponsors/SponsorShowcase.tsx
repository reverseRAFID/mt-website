import { urlFor } from '@/sanity/lib/client'
import type { Sponsor } from '@/sanity/lib/types'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { sponsorMailto } from '@/lib/sponsorship'

const TIER_ORDER: Sponsor['tier'][] = ['title', 'gold', 'silver', 'bronze', 'in-kind']

const TIER_CONFIG: Record<Sponsor['tier'], { label: string; logo: string; cols: string }> = {
  title: { label: 'Title Partner', logo: 'h-16', cols: 'grid-cols-1 sm:grid-cols-2' },
  gold: { label: 'Gold', logo: 'h-12', cols: 'grid-cols-2 sm:grid-cols-3' },
  silver: { label: 'Silver', logo: 'h-10', cols: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' },
  bronze: { label: 'Bronze', logo: 'h-8', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-5' },
  'in-kind': { label: 'In-Kind', logo: 'h-7', cols: 'grid-cols-3 sm:grid-cols-4 lg:grid-cols-6' },
}

function logoSources(sponsor: Sponsor) {
  const fallback = sponsor.logo ? urlFor(sponsor.logo).height(64).url() : undefined
  return {
    lightSrc: sponsor.logoLight ? urlFor(sponsor.logoLight).height(64).url() : fallback,
    darkSrc: sponsor.logoDark ? urlFor(sponsor.logoDark).height(64).url() : fallback,
  }
}

/**
 * The retention centerpiece: current partners, grouped and sized by tier so
 * every sponsor feels prominently and proudly displayed. Falls back to a
 * "founding sponsor" invitation when there are no sponsors yet.
 */
export function SponsorShowcase({ sponsors }: { sponsors: Sponsor[] }) {
  const grouped = TIER_ORDER.reduce<Record<string, Sponsor[]>>((acc, tier) => {
    acc[tier] = sponsors.filter((s) => s.tier === tier)
    return acc
  }, {})

  const hasSponsors = sponsors.length > 0

  return (
    <section className="relative border-y border-divider bg-surface py-20 lg:py-28">
      <GhostText text="ALLIES" drift="right" />
      <div className="section-container relative">
        <SectionHeader
          index="03"
          kicker="Our partners"
          title="The organizations powering the mission"
          description={
            hasSponsors
              ? 'We’re proud to build alongside these partners. Their support puts our rovers on the world stage.'
              : undefined
          }
          className="mb-12 lg:mb-16"
        />

        {hasSponsors ? (
          <div className="flex flex-col gap-14">
            {TIER_ORDER.filter((t) => grouped[t]?.length > 0).map((tier) => {
              const cfg = TIER_CONFIG[tier]
              return (
                <div key={tier}>
                  <div className="mb-7 flex items-center gap-3">
                    <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                    <h3 className="hud-label text-text">{cfg.label}</h3>
                    <span className="h-px flex-1 bg-divider" aria-hidden />
                    <span className="hud-label nums text-text-faint">{String(grouped[tier].length).padStart(2, '0')}</span>
                  </div>

                  <Reveal stagger className={`grid ${cfg.cols} items-stretch gap-4 sm:gap-5`}>
                    {grouped[tier].map((sponsor) => (
                      <TiltCard key={sponsor._id} max={5} className="h-full">
                        <a
                          href={sponsor.website ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={sponsor.name}
                          className="group relative flex h-full min-h-[96px] items-center justify-center rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                        >
                          <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                          {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
                            <ThemeLogo
                              {...logoSources(sponsor)}
                              alt={sponsor.name}
                              width={160}
                              height={64}
                              className={`${cfg.logo} object-contain`}
                            />
                          ) : (
                            <span className="text-center font-display text-lg font-bold text-text-muted transition-colors group-hover:text-primary">
                              {sponsor.name}
                            </span>
                          )}
                        </a>
                      </TiltCard>
                    ))}
                  </Reveal>
                </div>
              )
            })}
          </div>
        ) : (
          <Reveal>
            <div className="relative overflow-hidden rounded-card border border-primary/30 bg-primary-highlight p-8 text-center lg:p-14">
              <CornerTicks className="text-primary/40" size="md" />
              <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40" />
              <div className="relative mx-auto max-w-xl">
                <span className="hud-label text-primary">Founding partner spot open</span>
                <h3 className="mt-4 font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                  Be the first name on the rover
                </h3>
                <p className="mt-3 leading-relaxed text-text-muted">
                  We’re assembling our founding group of partners. Get in early and your brand leads the mission from day one.
                </p>
                <a
                  href={sponsorMailto()}
                  className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  Become a founding sponsor
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

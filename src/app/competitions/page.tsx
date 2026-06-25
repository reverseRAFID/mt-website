import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { COMPETITIONS_QUERY } from '@/sanity/lib/queries'
import type { CompetitionCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'Competitions' }

const SERIES_BADGE =
  'inline-flex items-center rounded-none border border-divider bg-surface-2 px-2.5 py-1 font-mono text-[0.6875rem] font-medium uppercase tracking-[0.18em] text-text-muted'

export default async function CompetitionsPage() {
  const competitions = await sanityFetch<CompetitionCard[]>(COMPETITIONS_QUERY)

  return (
    <PageLayout>
      <PageHero
        kicker="Track Record"
        title="Competitions"
        description="Our history at URC, IRC, and ERC — rosters, results, and SAR videos from every year."
        watermark="ARENA"
      />

      <section className="relative py-20 lg:py-28">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 right-0 h-72 w-72 rounded-full glow-orange opacity-50 blur-[120px]"
        />
        <div className="section-container relative">
          {!competitions?.length ? (
            <Reveal className="relative overflow-hidden rounded-card border border-divider bg-surface-raised">
              <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm opacity-40" />
              <CornerTicks className="text-primary/30" size="md" />
              <div className="relative px-6 py-20 text-center">
                <span className="hud-label text-primary">No Results Logged</span>
                <h2 className="mt-4 text-balance font-display text-2xl font-bold tracking-tight text-text">
                  The competition archive is empty
                </h2>
                <p className="mx-auto mt-3 max-w-md text-pretty text-sm leading-relaxed text-text-muted">
                  Rosters, results, and SAR videos will surface here once competitions are published.
                </p>
                <Link
                  href="/"
                  className="link-underline mt-6 inline-flex items-center gap-2 text-sm font-semibold text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  Return to base
                  <svg
                    width="14"
                    height="14"
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
            </Reveal>
          ) : (
            <>
              <Reveal className="mb-8 flex items-end justify-between gap-4 border-b border-divider pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <span className="hud-label text-primary">Results Board</span>
                </div>
                <span className="hud-label nums text-text-faint">
                  {competitions.length} {competitions.length === 1 ? 'Entry' : 'Entries'}
                </span>
              </Reveal>
              <Reveal stagger className="flex flex-col gap-4">
              {competitions.map((comp) => (
                <Link
                  key={comp._id}
                  href={`/competitions/${comp.slug.current}`}
                  className="group relative flex flex-col gap-4 rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg sm:flex-row sm:items-center sm:justify-between"
                >
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

                  <div className="flex items-center gap-4">
                    {/* Rank badge with corner ticks */}
                    {comp.rank ? (
                      <div className="relative shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-none border border-primary/20 bg-primary-highlight">
                        <CornerTicks className="text-primary/30" />
                        <span className="display-figure nums text-3xl leading-none text-primary">
                          #{comp.rank}
                        </span>
                        <span className="hud-label mt-1 text-text-faint">Rank</span>
                      </div>
                    ) : (
                      <div className="relative shrink-0 flex h-16 w-16 items-center justify-center rounded-none border border-divider bg-surface">
                        <CornerTicks className="text-text-faint/30" />
                        <span className="hud-label text-text-faint">TBD</span>
                      </div>
                    )}

                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span className={SERIES_BADGE}>{comp.shortName}</span>
                        <span className="hud-label text-text-faint nums">{comp.year}</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-text tracking-tight transition-colors group-hover:text-primary">
                        {comp.name} {comp.year}
                      </h2>
                      <p className="mt-1 text-sm text-text-muted">
                        {comp.location}
                        {comp.rank && comp.totalTeams && (
                          <span className="font-mono text-text-faint">
                            {' · '}Top {Math.round((comp.rank / comp.totalTeams) * 100)}% of {comp.totalTeams} teams
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 text-sm font-semibold text-text-muted transition-colors group-hover:text-primary">
                    View Details
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </Link>
              ))}
              </Reveal>
            </>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

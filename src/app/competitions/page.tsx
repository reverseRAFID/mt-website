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

const COMPETITION_COLORS: Record<string, string> = {
  URC: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  IRC: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  ERC: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

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

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          {!competitions?.length ? (
            <div className="relative rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No competitions yet — add them in Sanity CMS → Competitions.
            </div>
          ) : (
            <Reveal stagger className="flex flex-col gap-4">
              {competitions.map((comp) => (
                <Link
                  key={comp._id}
                  href={`/competitions/${comp.slug.current}`}
                  className="group relative flex flex-col gap-4 rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)] sm:flex-row sm:items-center sm:justify-between"
                >
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

                  <div className="flex items-center gap-4">
                    {/* Rank badge with corner ticks */}
                    {comp.rank ? (
                      <div className="relative shrink-0 flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-primary/20 bg-primary-highlight">
                        <CornerTicks className="text-primary/30" />
                        <span className="font-display font-bold text-2xl text-primary leading-none nums">
                          #{comp.rank}
                        </span>
                        <span className="hud-label mt-1 text-text-faint">Rank</span>
                      </div>
                    ) : (
                      <div className="relative shrink-0 flex h-16 w-16 items-center justify-center rounded-lg border border-divider bg-surface">
                        <CornerTicks className="text-text-faint/30" />
                        <span className="hud-label text-text-faint">TBD</span>
                      </div>
                    )}

                    <div>
                      <div className="mb-1.5 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-faint'}`}
                        >
                          {comp.shortName}
                        </span>
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
          )}
        </div>
      </section>
    </PageLayout>
  )
}

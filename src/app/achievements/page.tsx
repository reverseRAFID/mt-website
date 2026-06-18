import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { COMPETITIONS_QUERY } from '@/sanity/lib/queries'
import type { CompetitionCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'Achievements' }

const COMPETITION_COLORS: Record<string, string> = {
  URC: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  IRC: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  ERC: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

export default async function AchievementsPage() {
  const competitions = await sanityFetch<CompetitionCard[]>(COMPETITIONS_QUERY)

  const ranked = competitions?.filter((c) => c.rank) ?? []
  const bestRank = ranked.length > 0 ? Math.min(...ranked.map((c) => c.rank!)) : null
  const totalCompetitions = competitions?.length ?? 0
  const distinctCompetitions = new Set(competitions?.map((c) => c.shortName)).size

  return (
    <PageLayout>
      <PageHero
        kicker="Milestones"
        title="Achievements"
        description="Our track record on the international stage — rankings, milestones, and moments that define who we are."
        watermark="PODIUM"
      />

      <section className="relative py-20 lg:py-28">
        <div className="section-container">
          {/* Headline stats */}
          {totalCompetitions > 0 && (
            <Reveal stagger className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-16 lg:mb-20">
              <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                <CornerTicks className="text-primary/30" />
                <p className="font-display font-bold text-4xl sm:text-5xl text-primary mb-1 nums">
                  <Counter to={totalCompetitions} />
                </p>
                <p className="hud-label text-text-faint">Competitions Entered</p>
              </div>
              {bestRank && (
                <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                  <CornerTicks className="text-primary/30" />
                  <p className="font-display font-bold text-4xl sm:text-5xl text-primary mb-1 nums">
                    <Counter to={bestRank} prefix="#" />
                  </p>
                  <p className="hud-label text-text-faint">Best Global Rank</p>
                </div>
              )}
              <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                <CornerTicks className="text-primary/30" />
                <p className="font-display font-bold text-4xl sm:text-5xl text-primary mb-1 nums">
                  <Counter to={distinctCompetitions} />
                </p>
                <p className="hud-label text-text-faint">Competitions</p>
              </div>
            </Reveal>
          )}

          {!competitions?.length ? (
            <div className="py-20 text-center text-text-muted">
              No competitions yet — add them in Sanity CMS → Competitions.
            </div>
          ) : (
            <>
              <Reveal>
                <div className="flex items-center gap-2.5 mb-8">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">Competition History</h2>
                </div>
              </Reveal>
              <Reveal stagger className="flex flex-col gap-4">
                {competitions.map((comp) => (
                  <Link
                    key={comp._id}
                    href={`/competitions/${comp.slug.current}`}
                    className="group relative rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        {comp.rank ? (
                          <div className="shrink-0 w-14 h-14 rounded-none bg-primary-highlight border border-primary/20 flex flex-col items-center justify-center">
                            <span className="font-display font-bold text-xl text-primary leading-none nums">#{comp.rank}</span>
                            <span className="hud-label text-[9px] text-text-faint">Rank</span>
                          </div>
                        ) : (
                          <div className="shrink-0 w-14 h-14 rounded-none bg-surface-2 border border-divider flex items-center justify-center">
                            <span className="hud-label text-text-faint">TBD</span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-semibold ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-faint'}`}>
                              {comp.shortName}
                            </span>
                            <span className="hud-label text-text-faint nums">{comp.year}</span>
                          </div>
                          <h3 className="font-display font-bold text-lg text-text tracking-tight group-hover:text-primary transition-colors">
                            {comp.name} {comp.year}
                          </h3>
                          {comp.location && (
                            <p className="text-sm text-text-muted">
                              {comp.location}
                              {comp.rank && comp.totalTeams && ` · Top ${Math.round((comp.rank / comp.totalTeams) * 100)}% of ${comp.totalTeams} teams`}
                            </p>
                          )}
                        </div>
                      </div>
                      {comp.result && (
                        <span className="text-sm font-semibold text-primary shrink-0">{comp.result}</span>
                      )}
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

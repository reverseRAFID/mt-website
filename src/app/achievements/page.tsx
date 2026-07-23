import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { COMPETITIONS_QUERY } from '@/sanity/lib/queries'
import type { CompetitionCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { GhostText } from '@/components/motion/GhostText'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Milestones } from '@/components/achievements/Milestones'
import { RankTrend, type RankPoint } from '@/components/achievements/RankTrend'
import { SupportCTA } from '@/components/support/SupportCTA'

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

  // Trend data — ranked competitions oldest → newest.
  const trendPoints: RankPoint[] = ranked
    .slice()
    .sort((a, b) => a.year - b.year)
    .map((c) => ({ year: c.year, rank: c.rank!, shortName: c.shortName, totalTeams: c.totalTeams }))

  return (
    <PageLayout>
      <PageHero
        kicker="Milestones"
        title="Achievements"
        description="Our track record on the international stage — rankings, milestones, and moments that define who we are."
        watermark="PODIUM"
        stat={bestRank ? { value: bestRank, label: 'Best world rank' } : undefined}
      />

      {/* Headline stats */}
      {totalCompetitions > 0 && (
        <section className="relative py-20 lg:py-28">
          <div className="section-container">
            <Reveal stagger className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                <CornerTicks className="text-primary/30" />
                <p className="mb-1 font-display text-4xl font-bold text-primary nums sm:text-5xl">
                  <Counter to={totalCompetitions} />
                </p>
                <p className="hud-label text-text-muted">Competitions Entered</p>
              </div>
              {bestRank && (
                <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                  <CornerTicks className="text-primary/30" />
                  <p className="mb-1 font-display text-4xl font-bold text-primary nums sm:text-5xl">
                    <Counter to={bestRank} prefix="#" />
                  </p>
                  <p className="hud-label text-text-muted">Best Global Rank</p>
                </div>
              )}
              <div className="relative rounded-card border border-divider bg-surface-raised p-6 text-center transition-colors hover:border-primary/40">
                <CornerTicks className="text-primary/30" />
                <p className="mb-1 font-display text-4xl font-bold text-primary nums sm:text-5xl">
                  <Counter to={distinctCompetitions} />
                </p>
                <p className="hud-label text-text-muted">Competition Series</p>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <Milestones />

      {trendPoints.length >= 2 && <RankTrend points={trendPoints} />}

      {/* Competition history */}
      <section className="relative border-t border-divider py-20 lg:py-28">
        <GhostText text="RECORD" drift="right" />
        <div className="section-container relative">
          {!competitions?.length ? (
            <div className="py-12 text-center text-text-muted">
              No competitions yet — add them in Sanity CMS → Competitions.
            </div>
          ) : (
            <>
              <Reveal>
                <div className="mb-8 flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">
                    <span className="text-text-muted">03 / </span>Competition History
                  </h2>
                </div>
              </Reveal>
              <Reveal stagger className="flex flex-col gap-4">
                {competitions.map((comp) => (
                  <Link
                    key={comp._id}
                    href={`/competitions/${comp.slug.current}`}
                    className="group relative rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                      <div className="flex items-center gap-4">
                        {comp.rank ? (
                          <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-none border border-primary/20 bg-primary-highlight">
                            <span className="font-display text-xl font-bold leading-none text-primary nums">#{comp.rank}</span>
                            <span className="hud-label text-[9px] text-text-muted">Rank</span>
                          </div>
                        ) : (
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-none border border-divider bg-surface-2">
                            <span className="hud-label text-text-muted">TBD</span>
                          </div>
                        )}
                        <div>
                          <div className="mb-1 flex items-center gap-2">
                            <span className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-semibold ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-muted'}`}>
                              {comp.shortName}
                            </span>
                            <span className="hud-label nums text-text-muted">{comp.year}</span>
                          </div>
                          <h3 className="font-display text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary">
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
                        <span className="shrink-0 text-sm font-semibold text-primary">{comp.result}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </Reveal>
            </>
          )}
        </div>
      </section>
      <SupportCTA copy="achievements" />
    </PageLayout>
  )
}

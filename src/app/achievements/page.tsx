import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { COMPETITIONS_QUERY } from '@/sanity/lib/queries'
import type { CompetitionCard } from '@/sanity/lib/types'

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

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Milestones</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Achievements</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Our track record on the international stage — rankings, milestones, and moments that define who we are.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {/* Headline stats */}
        {totalCompetitions > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-14">
            <div className="bg-surface rounded-xl border border-divider p-6 text-center">
              <p className="font-display font-bold text-5xl text-primary mb-1">{totalCompetitions}</p>
              <p className="text-sm text-text-muted">Competitions Entered</p>
            </div>
            {bestRank && (
              <div className="bg-surface rounded-xl border border-divider p-6 text-center">
                <p className="font-display font-bold text-5xl text-primary mb-1">#{bestRank}</p>
                <p className="text-sm text-text-muted">Best Global Rank</p>
              </div>
            )}
            <div className="bg-surface rounded-xl border border-divider p-6 text-center">
              <p className="font-display font-bold text-5xl text-primary mb-1">
                {new Set(competitions?.map((c) => c.shortName)).size}
              </p>
              <p className="text-sm text-text-muted">Competitions</p>
            </div>
          </div>
        )}

        {!competitions?.length ? (
          <div className="py-20 text-center text-text-muted">
            No competitions yet — add them in Sanity CMS → Competitions.
          </div>
        ) : (
          <>
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Competition History</h2>
            <div className="flex flex-col gap-4">
              {competitions.map((comp) => (
                <Link
                  key={comp._id}
                  href={`/competitions/${comp.slug.current}`}
                  className="group bg-surface rounded-xl border border-divider p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {comp.rank ? (
                        <div className="shrink-0 w-14 h-14 rounded-lg bg-primary-highlight border border-primary/20 flex flex-col items-center justify-center">
                          <span className="font-display font-bold text-xl text-primary leading-none">#{comp.rank}</span>
                          <span className="text-[9px] text-text-faint uppercase tracking-wide">Rank</span>
                        </div>
                      ) : (
                        <div className="shrink-0 w-14 h-14 rounded-lg bg-surface-2 border border-divider flex items-center justify-center">
                          <span className="text-xs text-text-faint">TBD</span>
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-faint'}`}>
                            {comp.shortName}
                          </span>
                          <span className="font-mono text-xs text-text-faint">{comp.year}</span>
                        </div>
                        <h3 className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors">
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
            </div>
          </>
        )}
      </div>
    </PageLayout>
  )
}

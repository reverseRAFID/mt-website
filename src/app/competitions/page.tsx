import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { COMPETITIONS_QUERY } from '@/sanity/lib/queries'
import type { CompetitionCard } from '@/sanity/lib/types'

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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Track Record</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Competitions</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Our history at URC, IRC, and ERC — rosters, results, and SAR videos from every year.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!competitions?.length ? (
          <div className="py-20 text-center text-text-muted">
            No competitions yet — add them in Sanity CMS → Competitions.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {competitions.map((comp) => (
              <Link
                key={comp._id}
                href={`/competitions/${comp.slug.current}`}
                className="group bg-surface rounded-xl border border-divider p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
                      <h2 className="font-display font-bold text-xl text-text group-hover:text-primary transition-colors">
                        {comp.name} {comp.year}
                      </h2>
                      <p className="text-sm text-text-muted">
                        {comp.location}
                        {comp.rank && comp.totalTeams && ` · Top ${Math.round((comp.rank / comp.totalTeams) * 100)}% of ${comp.totalTeams} teams`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-medium text-text-muted group-hover:text-primary transition-colors shrink-0">
                    View Details
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

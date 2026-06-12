import Link from 'next/link'
import type { CompetitionCard } from '@/sanity/lib/types'

interface AchievementCalloutProps {
  competition: CompetitionCard | null
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export function AchievementCallout({ competition }: AchievementCalloutProps) {
  if (!competition || !competition.rank) return null

  return (
    <section className="bg-surface border-y border-divider py-10">
      <div className="section-container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="shrink-0 w-16 h-16 rounded-lg bg-primary-highlight border border-primary/20 flex flex-col items-center justify-center">
              <span className="font-display font-bold text-2xl text-primary leading-none">
                #{competition.rank}
              </span>
              <span className="text-[10px] text-text-faint uppercase tracking-wide mt-0.5">Rank</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                  Latest Achievement
                </span>
              </div>
              <h2 className="font-display font-bold text-lg text-text">
                {getOrdinalSuffix(competition.rank)} Place — {competition.shortName} {competition.year}
              </h2>
              <p className="text-sm text-text-muted mt-0.5">
                {competition.name} · {competition.location}
                {competition.totalTeams && ` · Top ${Math.round((competition.rank / competition.totalTeams) * 100)}% of ${competition.totalTeams} teams`}
              </p>
            </div>
          </div>

          <Link
            href={`/competitions/${competition.slug.current}`}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-md border border-border text-sm font-medium text-text-muted hover:text-primary hover:border-primary transition-colors duration-150"
          >
            View Details
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}

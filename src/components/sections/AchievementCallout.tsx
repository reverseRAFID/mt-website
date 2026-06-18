import Link from 'next/link'
import type { CompetitionCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'

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
    <section className="relative overflow-hidden border-y border-divider bg-surface py-10 lg:py-12">
      <div
        className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-50"
        aria-hidden
      />
      <div className="section-container relative">
        <Reveal className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-center sm:text-left">
            {/* Rank badge with corner crosshairs */}
            <div className="relative flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-card border border-primary/30 bg-primary-highlight">
              <CornerTicks className="text-primary/50" size="md" />
              <span className="font-display text-3xl font-bold leading-none text-primary nums">
                #{competition.rank}
              </span>
              <span className="hud-label mt-1 text-[10px] text-text-faint">Rank</span>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-center gap-2.5 sm:justify-start">
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                <span className="hud-label text-primary">Latest Achievement</span>
              </div>
              <h2 className="font-display text-xl font-bold tracking-tight text-text text-balance">
                {getOrdinalSuffix(competition.rank)} Place — {competition.shortName} {competition.year}
              </h2>
              <p className="mt-1 text-sm text-text-muted leading-relaxed">
                {competition.name} · {competition.location}
                {competition.totalTeams && ` · Top ${Math.round((competition.rank / competition.totalTeams) * 100)}% of ${competition.totalTeams} teams`}
              </p>
            </div>
          </div>

          <Link
            href={`/competitions/${competition.slug.current}`}
            className="group inline-flex shrink-0 items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            View Details
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
              className="transition-transform group-hover:translate-x-0.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </Reveal>
      </div>
    </section>
  )
}

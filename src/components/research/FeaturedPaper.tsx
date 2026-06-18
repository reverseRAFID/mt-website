import Link from 'next/link'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'

const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  preprint: 'Pre-print',
  'under-review': 'Under Review',
}

/**
 * Spotlight for the team's most significant paper (most recent published, or
 * the newest paper overall). Uses only ResearchCard fields, so it works
 * without touching the existing query.
 */
export function FeaturedPaper({ paper }: { paper: ResearchCard }) {
  const slug = `/research/${paper.slug.current}`

  return (
    <Reveal y={32}>
      <article className="relative overflow-hidden rounded-card border border-primary/30 bg-primary-highlight p-7 lg:p-10">
        <CornerTicks className="text-primary/40" size="md" />
        <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-30" />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full glow-orange blur-[100px] opacity-60"
        />

        <div className="relative">
          <div className="mb-5 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">Featured publication</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <span className="inline-flex items-center rounded-none bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-accent">
              {STATUS_LABEL[paper.status] ?? paper.status}
            </span>
            {paper.conference && (
              <span className="hud-label nums text-text-muted">{paper.conference} · {paper.year}</span>
            )}
          </div>

          <h2 className="max-w-3xl font-display text-2xl font-bold leading-tight tracking-tight text-text text-balance sm:text-3xl lg:text-4xl">
            {paper.title}
          </h2>

          {paper.authorNames && paper.authorNames.length > 0 && (
            <p className="mt-4 text-text-muted">{paper.authorNames.join(', ')}</p>
          )}

          {paper.topics && paper.topics.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-1.5">
              {paper.topics.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center whitespace-nowrap rounded-none border border-primary/30 bg-bg/40 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={slug}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
            >
              Read paper
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            {paper.doi && (
              <a
                href={paper.doi}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border bg-bg/40 px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                View DOI
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14 21 3" />
                </svg>
              </a>
            )}
          </div>
        </div>
      </article>
    </Reveal>
  )
}

import Link from 'next/link'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'

interface ResearchHighlightsProps {
  papers: ResearchCard[]
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  preprint: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'under-review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  preprint: 'Pre-print',
  'under-review': 'Under Review',
}

export function ResearchHighlights({ papers }: ResearchHighlightsProps) {
  if (papers.length === 0) return null

  return (
    <section className="relative py-20 lg:py-28 bg-surface">
      <div className="section-container">
        <SectionHeader
          kicker="Publications"
          title="Research Highlights"
          action={
            <Link
              href="/research"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors duration-150"
            >
              All papers
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
            </Link>
          }
        />

        <Reveal
          stagger
          className="mt-12 flex flex-col border-t border-divider"
        >
          {papers.map((paper, i) => (
            <Link
              key={paper._id}
              href={`/research/${paper.slug.current}`}
              className="group relative flex flex-col gap-4 border-b border-divider py-6 transition-colors duration-200 hover:bg-bg sm:flex-row sm:items-start sm:gap-6"
            >
              {/* hover accent rail */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-0 top-0 h-full w-px origin-top scale-y-0 bg-primary transition-transform duration-300 group-hover:scale-y-100"
              />

              <div className="hud-label nums shrink-0 pt-0.5 text-text-faint transition-colors duration-200 group-hover:text-primary sm:w-12">
                {String(i + 1).padStart(2, '0')}
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-2.5">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[paper.status] ?? ''}`}
                  >
                    {STATUS_LABEL[paper.status] ?? paper.status}
                  </span>
                  <span className="hud-label nums text-text-faint">
                    {paper.conference ? `${paper.conference} · ` : ''}
                    {paper.year}
                  </span>
                </div>
                <h3 className="font-display text-lg font-bold text-text transition-colors duration-150 group-hover:text-primary text-balance">
                  {paper.title}
                </h3>
                {paper.authorNames && (
                  <p className="mt-1.5 text-sm text-text-muted">
                    {paper.authorNames.join(', ')}
                  </p>
                )}
              </div>

              {paper.topics && paper.topics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 sm:max-w-[40%] sm:justify-end sm:pt-0.5">
                  {paper.topics.slice(0, 3).map((topic) => (
                    <span
                      key={topic}
                      className="inline-flex items-center whitespace-nowrap rounded-full border border-divider bg-bg px-2.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors duration-200 group-hover:border-primary/40 group-hover:text-primary"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              )}
            </Link>
          ))}
        </Reveal>

        <div className="mt-8 text-center sm:hidden">
          <Link
            href="/research"
            className="text-sm font-semibold text-primary hover:text-primary-hover"
          >
            View all research →
          </Link>
        </div>
      </div>
    </section>
  )
}

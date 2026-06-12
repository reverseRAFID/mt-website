import Link from 'next/link'
import type { ResearchCard } from '@/sanity/lib/types'

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
    <section className="py-20 bg-surface">
      <div className="section-container">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="accent-line mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Publications</p>
            </div>
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-text">Research Highlights</h2>
          </div>
          <Link
            href="/research"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors duration-150"
          >
            All papers
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          {papers.map((paper) => (
            <Link
              key={paper._id}
              href={`/research/${paper.slug.current}`}
              className="group bg-bg rounded-xl border border-divider p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[paper.status] ?? ''}`}>
                      {STATUS_LABEL[paper.status] ?? paper.status}
                    </span>
                    <span className="text-xs text-text-faint">
                      {paper.conference ? `${paper.conference} · ` : ''}{paper.year}
                    </span>
                  </div>
                  <h3 className="font-display font-bold text-base text-text group-hover:text-primary transition-colors duration-150 mb-1.5">
                    {paper.title}
                  </h3>
                  {paper.authorNames && (
                    <p className="text-sm text-text-muted">{paper.authorNames.join(', ')}</p>
                  )}
                </div>
                {paper.topics && paper.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end sm:gap-1">
                    {paper.topics.slice(0, 3).map((topic) => (
                      <span
                        key={topic}
                        className="text-xs bg-primary-highlight text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6 sm:hidden text-center">
          <Link href="/research" className="text-sm font-medium text-primary hover:text-primary-hover">
            View all research →
          </Link>
        </div>
      </div>
    </section>
  )
}

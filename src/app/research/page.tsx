import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RESEARCH_QUERY } from '@/sanity/lib/queries'
import type { ResearchCard } from '@/sanity/lib/types'

export const metadata: Metadata = { title: 'Research & Publications' }

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  preprint: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'under-review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Published', preprint: 'Pre-print', 'under-review': 'Under Review',
}

export default async function ResearchPage() {
  const papers = await sanityFetch<ResearchCard[]>(RESEARCH_QUERY)

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Publications</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Research & Publications</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Peer-reviewed papers, conference proceedings, and technical white papers by our team.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!papers?.length ? (
          <div className="py-20 text-center text-text-muted">
            No papers yet — add them in Sanity CMS → Research.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {papers.map((paper) => (
              <Link
                key={paper._id}
                href={`/research/${paper.slug.current}`}
                className="group bg-surface rounded-xl border border-divider p-6 hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[paper.status] ?? ''}`}>
                        {STATUS_LABEL[paper.status] ?? paper.status}
                      </span>
                      {paper.conference && (
                        <span className="text-xs text-text-faint">{paper.conference} · {paper.year}</span>
                      )}
                    </div>
                    <h2 className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors mb-1.5">
                      {paper.title}
                    </h2>
                    {paper.authorNames && paper.authorNames.length > 0 && (
                      <p className="text-sm text-text-muted">{paper.authorNames.join(', ')}</p>
                    )}
                  </div>
                  {paper.topics && paper.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:flex-col sm:items-end sm:gap-1 shrink-0">
                      {paper.topics.map((topic) => (
                        <span key={topic} className="text-xs bg-primary-highlight text-primary px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

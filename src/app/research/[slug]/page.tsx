import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { RESEARCH_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { ResearchFull } from '@/sanity/lib/types'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const paper = await sanityFetch<ResearchFull | null>(RESEARCH_BY_SLUG_QUERY, { slug })
  return {
    title: paper?.title ?? 'Research',
    description: paper?.abstract?.slice(0, 160),
  }
}

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  preprint: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'under-review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Published', preprint: 'Pre-print', 'under-review': 'Under Review',
}

export default async function ResearchPage({ params }: Props) {
  const { slug } = await params
  const paper = await sanityFetch<ResearchFull | null>(RESEARCH_BY_SLUG_QUERY, { slug })
  if (!paper) notFound()

  return (
    <PageLayout>
      <div className="section-container py-14 max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 text-sm text-text-faint mb-8">
          <Link href="/research" className="hover:text-primary transition-colors">Research</Link>
          <span>/</span>
          <span className="text-text line-clamp-1">{paper.title}</span>
        </nav>

        <header className="mb-10">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[paper.status] ?? ''}`}>
              {STATUS_LABEL[paper.status] ?? paper.status}
            </span>
            {paper.conference && (
              <span className="text-xs text-text-faint">{paper.conference} · {paper.year}</span>
            )}
          </div>
          <h1 className="font-display font-bold text-3xl lg:text-4xl text-text mb-6 leading-tight">{paper.title}</h1>

          {paper.topics && paper.topics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {paper.topics.map((topic) => (
                <span key={topic} className="text-xs bg-primary-highlight text-primary px-2.5 py-0.5 rounded-full font-medium">{topic}</span>
              ))}
            </div>
          )}

          {/* Authors */}
          {paper.authors && paper.authors.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-6">
              {paper.authors.map((author) => (
                <Link
                  key={author._id}
                  href={`/team/${author.slug.current}`}
                  className="flex items-center gap-2 hover:text-primary transition-colors"
                >
                  <div className="w-7 h-7 rounded-full overflow-hidden relative border border-divider bg-surface-2 shrink-0">
                    {author.photo ? (
                      <Image
                        src={urlFor(author.photo).width(28).height(28).url()}
                        alt={author.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-text-muted">{author.name}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            {paper.doi && (
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
              >
                View on DOI
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
            )}
            {paper.pdfFile && (
              <a
                href={getFileUrl(paper.pdfFile.asset._ref)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 border border-divider text-text-muted hover:text-primary hover:border-primary px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                </svg>
                Download PDF
              </a>
            )}
          </div>
        </header>

        {paper.abstract && (
          <div className="bg-surface rounded-xl border border-divider p-6 mb-8">
            <h2 className="font-display font-bold text-lg text-text mb-3">Abstract</h2>
            <p className="text-text-muted leading-relaxed text-sm">{paper.abstract}</p>
          </div>
        )}

        {paper.citation && (
          <div className="bg-surface-2 rounded-xl border border-divider p-6">
            <h2 className="font-display font-bold text-base text-text mb-3">Citation</h2>
            <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap break-words">{paper.citation}</pre>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

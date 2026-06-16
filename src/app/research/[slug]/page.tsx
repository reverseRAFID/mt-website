import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { RESEARCH_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { ResearchFull } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'

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
      <div className="section-container py-14 lg:py-20 max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 hud-label text-text-faint mb-8">
          <Link href="/research" className="hover:text-primary transition-colors">Research</Link>
          <span aria-hidden className="text-text-faint/60">/</span>
          <span className="text-text-muted line-clamp-1 normal-case tracking-normal">{paper.title}</span>
        </nav>

        <Reveal>
          <header className="mb-12">
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[paper.status] ?? 'text-text-faint bg-surface-2'}`}>
                {STATUS_LABEL[paper.status] ?? paper.status}
              </span>
              {paper.conference && (
                <span className="hud-label text-text-faint nums">{paper.conference} · {paper.year}</span>
              )}
            </div>

            <h1 className="font-display font-bold text-3xl lg:text-4xl text-text tracking-tight text-balance leading-[1.1] mb-6">{paper.title}</h1>

            {paper.topics && paper.topics.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-7">
                {paper.topics.map((topic) => (
                  <span key={topic} className="inline-flex items-center rounded-full bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary">{topic}</span>
                ))}
              </div>
            )}

            {/* Authors */}
            {paper.authors && paper.authors.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {paper.authors.map((author) => (
                  <Link
                    key={author._id}
                    href={`/team/${author.slug.current}`}
                    className="group inline-flex items-center gap-2 rounded-full border border-divider bg-surface-raised py-1 pl-1 pr-3 transition-colors hover:border-primary/40"
                  >
                    <span className="w-7 h-7 rounded-full overflow-hidden relative border border-divider bg-surface-2 shrink-0">
                      {author.photo ? (
                        <Image
                          src={urlFor(author.photo).width(28).height(28).url()}
                          alt={author.name}
                          fill
                          sizes="28px"
                          className="object-cover"
                        />
                      ) : (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span className="text-sm text-text-muted transition-colors group-hover:text-primary">{author.name}</span>
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
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  View on DOI
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </a>
              )}
              {paper.pdfFile && (
                <a
                  href={getFileUrl(paper.pdfFile.asset._ref)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                  </svg>
                  Download PDF
                </a>
              )}
            </div>
          </header>
        </Reveal>

        {paper.abstract && (
          <Reveal>
            <div className="relative rounded-card border border-divider bg-surface-raised p-6 lg:p-7 mb-8">
              <div className="hud-label text-primary mb-3">Abstract</div>
              <p className="text-text-muted leading-relaxed text-pretty">{paper.abstract}</p>
            </div>
          </Reveal>
        )}

        {paper.citation && (
          <Reveal>
            <div className="relative rounded-card border border-divider bg-surface p-6 lg:p-7">
              <CornerTicks className="text-primary/30" size="md" />
              <div className="hud-label text-text-faint mb-3">Citation</div>
              <pre className="text-xs text-text-muted font-mono leading-relaxed whitespace-pre-wrap break-words">{paper.citation}</pre>
            </div>
          </Reveal>
        )}
      </div>
    </PageLayout>
  )
}

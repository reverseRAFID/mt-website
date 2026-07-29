import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getResearchBySlug, getResearchSlugs } from '@/lib/cms/content'
import { file, media } from '@/lib/cms/media'
import { rels } from '@/lib/cms/relations'
import type { Member } from '@/lib/cms/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SupportCTA } from '@/components/support/SupportCTA'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return (await getResearchSlugs()).map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const paper = await getResearchBySlug(slug)
  return {
    title: paper?.title ?? 'Research',
    description: paper?.abstract?.slice(0, 160),
  }
}

const STATUS_DOT: Record<string, string> = {
  published: 'bg-primary',
  preprint: 'bg-text-muted',
  'under-review': 'bg-primary animate-blink',
}

const STATUS_LABEL: Record<string, string> = {
  published: 'Published', preprint: 'Pre-print', 'under-review': 'Under Review',
}

export default async function ResearchPage({ params }: Props) {
  const { slug } = await params
  const paper = await getResearchBySlug(slug)
  if (!paper) notFound()

  const authors = rels<Member>(paper.authors)
  const pdfUrl = file(paper.pdfFile)?.url

  return (
    <PageLayout>
      <div className="section-container py-14 lg:py-20 max-w-3xl mx-auto">
        <nav className="flex items-center gap-2 hud-label text-text-faint mb-8">
          <Link href="/research" className="link-underline transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg">Research</Link>
          <span aria-hidden className="text-text-faint/60">/</span>
          <span className="text-text-muted line-clamp-1 normal-case tracking-normal">{paper.title}</span>
        </nav>

        <Reveal>
          <header className="relative isolate mb-12">
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -z-10 tech-grid-sm mask-radial-fade opacity-50"
            />
            <div className="flex flex-wrap items-center gap-3 mb-5">
              <span className="inline-flex items-center gap-1.5 rounded-none border border-divider bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] text-text-muted">
                <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[paper.status] ?? 'bg-text-faint'}`} aria-hidden />
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
                  <span key={topic} className="inline-flex items-center rounded-none border border-divider bg-surface-2 px-2.5 py-1 font-mono text-[10px] font-medium uppercase leading-none tracking-[0.12em] text-text-muted">{topic}</span>
                ))}
              </div>
            )}

            {/* Authors */}
            {authors.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-8">
                {authors.map((author) => (
                  <Link
                    key={author.id}
                    href={`/team/${author.slug}`}
                    className="group inline-flex items-center gap-2 rounded-none border border-divider bg-surface-raised py-1 pl-1 pr-3 transition-colors hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    <span className="w-7 h-7 rounded-none overflow-hidden relative border border-divider bg-surface-2 shrink-0">
                      {author.photo ? (
                        <Image
                          src={media(author.photo)?.url ?? ''}
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
            {paper.doi || pdfUrl ? (
              <div className="flex flex-wrap gap-3">
                {paper.doi && (
                  <a
                    href={`https://doi.org/${paper.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    View on DOI
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                )}
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="transition-transform duration-200 group-hover:translate-y-0.5">
                      <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                    </svg>
                    Download PDF
                  </a>
                )}
              </div>
            ) : (
              <p className="inline-flex items-center gap-2 hud-label text-text-faint">
                <span className="h-1.5 w-1.5 rounded-full bg-text-faint" aria-hidden />
                Full text not yet available
              </p>
            )}
          </header>
        </Reveal>

        {paper.abstract && (
          <Reveal>
            <div className="relative rounded-card border border-divider bg-surface-raised inset-glow p-6 lg:p-7 mb-8">
              <CornerTicks className="text-primary/20" size="md" />
              <div className="hud-label accent-line text-primary mb-4">Abstract</div>
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
      <SupportCTA copy="research" />
    </PageLayout>
  )
}

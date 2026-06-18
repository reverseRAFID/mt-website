import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RESEARCH_QUERY } from '@/sanity/lib/queries'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PageHero } from '@/components/ui/PageHero'

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
      <PageHero
        kicker="Publications"
        title="Research"
        description="Peer-reviewed papers, conference proceedings, and technical white papers by our team."
        watermark="RESEARCH"
      />

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          {!papers?.length ? (
            <div className="rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No papers yet — add them in Sanity CMS → Research.
            </div>
          ) : (
            <Reveal stagger className="flex flex-col gap-3">
              {papers.map((paper, i) => (
                <Link
                  key={paper._id}
                  href={`/research/${paper.slug.current}`}
                  className="group relative flex flex-col gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)] sm:flex-row sm:items-center sm:gap-6 sm:p-6"
                >
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

                  {/* Index */}
                  <span className="hud-label nums shrink-0 text-text-faint group-hover:text-primary transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>

                  {/* Main */}
                  <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[paper.status] ?? 'bg-surface-2 text-text-faint'}`}
                      >
                        {STATUS_LABEL[paper.status] ?? paper.status}
                      </span>
                      {paper.conference && (
                        <span className="hud-label nums text-text-faint">
                          {paper.conference} · {paper.year}
                        </span>
                      )}
                    </div>

                    <h2 className="font-display font-bold text-lg lg:text-xl text-text tracking-tight group-hover:text-primary transition-colors">
                      {paper.title}
                    </h2>

                    {paper.authorNames && paper.authorNames.length > 0 && (
                      <p className="mt-1.5 text-sm text-text-muted">{paper.authorNames.join(', ')}</p>
                    )}

                    {paper.topics && paper.topics.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {paper.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex items-center rounded-full bg-primary-highlight px-2 py-0.5 text-xs font-medium text-primary whitespace-nowrap"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Arrow */}
                  <span
                    aria-hidden
                    className="hidden shrink-0 self-center text-text-faint transition-all group-hover:translate-x-0.5 group-hover:text-primary sm:block"
                  >
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </span>
                </Link>
              ))}
            </Reveal>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

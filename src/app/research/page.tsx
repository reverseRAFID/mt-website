import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RESEARCH_QUERY } from '@/sanity/lib/queries'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { GhostText } from '@/components/motion/GhostText'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PageHero } from '@/components/ui/PageHero'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { FeaturedPaper } from '@/components/research/FeaturedPaper'
import { ResearchExplorer } from '@/components/research/ResearchExplorer'

export const metadata: Metadata = { title: 'Research & Publications' }

export default async function ResearchPage() {
  const papers = (await sanityFetch<ResearchCard[]>(RESEARCH_QUERY)) ?? []

  const featured = papers.find((p) => p.status === 'published') ?? papers[0]
  const publishedCount = papers.filter((p) => p.status === 'published').length
  const focusAreas = new Set(papers.flatMap((p) => p.topics ?? [])).size

  const stats = [
    { value: papers.length, label: 'Publications' },
    { value: publishedCount, label: 'Peer-reviewed' },
    { value: focusAreas, label: 'Focus areas' },
  ]

  return (
    <PageLayout>
      <PageHero
        kicker="Publications"
        title="Research"
        description="Peer-reviewed papers, conference proceedings, and technical white papers by our team."
        watermark="RESEARCH"
        stat={papers.length ? { value: papers.length, label: 'Publications' } : undefined}
      />

      {papers.length === 0 ? (
        <section className="relative py-20 lg:py-28">
          <div className="section-container">
            <Reveal>
              <div className="relative overflow-hidden rounded-card border border-divider bg-surface-raised px-6 py-20 text-center">
                <CornerTicks className="text-primary/30" size="md" />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40"
                />
                <div className="relative mx-auto max-w-md">
                  <div className="mb-4 flex items-center justify-center gap-2.5">
                    <span className="h-1.5 w-1.5 animate-blink rounded-full bg-primary" aria-hidden />
                    <span className="hud-label text-primary">Standby</span>
                  </div>
                  <h2 className="text-balance font-display text-2xl font-bold tracking-tight text-text">
                    Publications archive is being populated
                  </h2>
                  <p className="mt-3 text-pretty leading-relaxed text-text-muted">
                    Peer-reviewed papers, conference proceedings, and technical white papers will
                    appear here as the team publishes them.
                  </p>
                  <Link
                    href="/"
                    className="link-underline mt-6 inline-flex items-center gap-2 font-mono text-sm text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                  >
                    Return to mission control
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      ) : (
        <>
          <section className="relative py-20 lg:py-28">
            <GhostText text="PAPERS" drift="left" />
            <div className="section-container relative">
              <Reveal stagger className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:mb-16">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="group relative rounded-card border border-divider bg-surface-raised p-5 text-center transition-colors hover:border-primary/40 sm:p-6"
                  >
                    <CornerTicks className="text-primary/20 transition-colors group-hover:text-primary/50" />
                    <p className="mb-1 font-display text-3xl font-bold text-primary nums sm:text-5xl">
                      <Counter to={s.value} />
                    </p>
                    <p className="hud-label text-text-muted">{s.label}</p>
                  </div>
                ))}
              </Reveal>

              {featured && <FeaturedPaper paper={featured} />}
            </div>
          </section>

          <section className="relative overflow-hidden border-t border-divider bg-surface py-20 lg:py-28">
            <GhostText text="ARCHIVE" drift="right" outline />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 tech-grid mask-radial-fade opacity-50"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute -top-24 left-1/2 h-72 w-[36rem] -translate-x-1/2 rounded-full glow-orange opacity-40 blur-[120px]"
            />
            <div className="section-container relative">
              <Reveal>
                <SectionHeader
                  index="01"
                  kicker="The archive"
                  title="All publications"
                  description="Filter by status or focus area to explore the team’s full body of work."
                  className="mb-10 lg:mb-12"
                />
              </Reveal>
              <ResearchExplorer papers={papers} />
            </div>
          </section>
        </>
      )}
    </PageLayout>
  )
}

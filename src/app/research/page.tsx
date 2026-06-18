import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RESEARCH_QUERY } from '@/sanity/lib/queries'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
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
            <div className="rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No papers yet — add them in Sanity CMS → Research.
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="relative py-20 lg:py-28">
            <div className="section-container">
              <Reveal stagger className="mb-12 grid grid-cols-3 gap-4 lg:mb-16">
                {stats.map((s) => (
                  <div
                    key={s.label}
                    className="relative rounded-card border border-divider bg-surface-raised p-5 text-center transition-colors hover:border-primary/40 sm:p-6"
                  >
                    <CornerTicks className="text-primary/30" />
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

          <section className="relative border-t border-divider bg-surface py-20 lg:py-28">
            <div className="section-container">
              <SectionHeader
                kicker="The archive"
                title="All publications"
                description="Filter by status or focus area to explore the team’s full body of work."
                className="mb-10 lg:mb-12"
              />
              <ResearchExplorer papers={papers} />
            </div>
          </section>
        </>
      )}
    </PageLayout>
  )
}

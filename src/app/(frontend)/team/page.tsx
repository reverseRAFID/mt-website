import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { GhostText } from '@/components/motion/GhostText'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SupportCTA } from '@/components/support/SupportCTA'

export const metadata: Metadata = { title: 'The Team' }

// Team roster is being fixed. Swap this section back to
// <TeamDirectory members={await getMembers()} /> once the CMS data is corrected.
export default function TeamPage() {
  return (
    <PageLayout>
      <PageHero
        index="03"
        kicker="Crew Manifest"
        title="The Team"
        description="Meet the engineers, scientists, and leaders who built Mongol-Tori."
        watermark="CREW"
      />

      <section className="relative py-20 lg:py-28">
        <GhostText text="ROSTER" drift="left" />
        <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 tech-grid-sm mask-radial-fade opacity-[0.4]" />
          <div className="absolute -left-32 top-16 h-[420px] w-[420px] rounded-full glow-orange blur-[130px] opacity-30" />
        </div>
        <div className="section-container relative z-10">
          <div className="relative mx-auto max-w-xl rounded-card border border-divider bg-surface-raised px-8 py-16 text-center">
            <CornerTicks className="text-primary/30" size="md" />

            <div className="mb-6 inline-flex items-center gap-2 rounded-none border border-divider bg-surface px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" aria-hidden />
              <span className="hud-label text-text-muted">Under Construction</span>
            </div>

            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto mb-5 text-primary/70"
              aria-hidden
            >
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>

            <h2 className="font-display text-xl font-bold text-text">Sorry, we&apos;re fixing this page</h2>

            <a
              href="mailto:mongol-tori@bracu.ac.bd"
              className="mt-6 inline-flex items-center gap-2 rounded-none border border-divider px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-10 5L2 7" />
              </svg>
              mongol-tori@bracu.ac.bd
            </a>
          </div>
        </div>
      </section>
      <SupportCTA copy="team" />
    </PageLayout>
  )
}

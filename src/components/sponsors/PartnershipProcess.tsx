import { HorizontalScroll } from '@/components/motion/HorizontalScroll'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PROCESS_STEPS } from '@/lib/sponsorship'

/**
 * "How it works" — a pinned horizontal-scroll sequence on desktop, a native
 * snap-swipe row on mobile. Server-rendered step cards passed into the
 * client `HorizontalScroll` track.
 */
export function PartnershipProcess() {
  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          index="07"
          kicker="How it works"
          title="From hello to lift-off"
          description="Becoming a sponsor is simple. Four steps and your brand is part of the mission."
        />
        <p className="mt-4 flex items-center gap-2 text-sm text-text-muted lg:hidden">
          <span className="hud-label">Swipe to explore</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </p>
      </div>

      <HorizontalScroll
        ariaLabel="Partnership process steps"
        className="mt-10 lg:mt-14"
        trackClassName="gap-5 px-4 py-2 sm:px-6 lg:px-8"
      >
        {PROCESS_STEPS.map((step, i) => (
          <article
            key={step.title}
            className="w-[82vw] shrink-0 snap-start sm:w-[58vw] lg:w-[42vw] xl:w-[34vw]"
          >
            <div className="relative flex h-full min-h-[15rem] flex-col overflow-hidden rounded-card border border-divider bg-surface-raised p-7 lg:p-9">
              <CornerTicks className="text-primary/20" />
              <div className="mb-5 flex items-start justify-between gap-4">
                <span className="hud-label text-primary">Step {String(i + 1).padStart(2, '0')}</span>
                <span aria-hidden className="font-display text-6xl font-bold leading-none text-text/[0.07] nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <h3 className="mb-3 font-display text-2xl font-bold text-text">{step.title}</h3>
              <p className="leading-relaxed text-text-muted text-pretty">{step.description}</p>
            </div>
          </article>
        ))}
      </HorizontalScroll>
    </section>
  )
}

import { HorizontalScroll } from '@/components/motion/HorizontalScroll'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { MILESTONES } from '@/lib/achievements'

/**
 * The team's journey as a pinned horizontal-scroll timeline on desktop, and a
 * native swipe row on mobile. Content mirrors the real About-page history.
 */
export function Milestones() {
  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          index="01"
          kicker="Our journey"
          title="From a campus club to the world stage"
          description="Seven years of building, breaking, and winning — here’s how we got here."
        />
        <p className="mt-4 flex items-center gap-2 text-sm text-text-muted lg:hidden">
          <span className="hud-label">Swipe through the years</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </p>
      </div>

      <HorizontalScroll
        ariaLabel="Team milestones by year"
        className="mt-10 lg:mt-14"
        trackClassName="gap-5 px-4 py-2 sm:px-6 lg:px-8"
      >
        {MILESTONES.map((m, i) => (
          <article
            key={m.year}
            className="w-[78vw] shrink-0 snap-start sm:w-[52vw] lg:w-[34vw] xl:w-[26vw]"
          >
            <div className="relative flex h-full min-h-[14rem] flex-col overflow-hidden rounded-card border border-divider bg-surface-raised p-7">
              <CornerTicks className="text-primary/20" />
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="font-display text-4xl font-bold text-primary nums">{m.year}</span>
                <span className="hud-label rounded-none border border-divider px-2 py-1 text-text-muted">{m.tag}</span>
              </div>
              <h3 className="mb-2 font-display text-xl font-bold text-text">{m.title}</h3>
              <p className="leading-relaxed text-text-muted text-pretty">{m.detail}</p>
              <span aria-hidden className="mt-auto pt-5 hud-label nums text-text-faint">
                {String(i + 1).padStart(2, '0')} / {String(MILESTONES.length).padStart(2, '0')}
              </span>
            </div>
          </article>
        ))}
      </HorizontalScroll>
    </section>
  )
}

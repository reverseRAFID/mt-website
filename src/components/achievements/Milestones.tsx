import { Reveal } from '@/components/motion/Reveal'
import { ScrollSpine } from '@/components/motion/ScrollSpine'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { MILESTONES } from '@/lib/achievements'

/**
 * The team's journey as a vertical scroll timeline. A telemetry spine draws
 * down the section as you scroll; each milestone reveals in turn with a node
 * on the rail. On desktop the cards alternate sides of a centred spine with a
 * giant ghost year filling the opposite column; on mobile it collapses to a
 * single left-rail list. Replaces the former pinned horizontal-scroll reel.
 */
export function Milestones() {
  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          index="01"
          kicker="Our journey"
          title="From a campus club to the world stage"
          description="Seven years of building, breaking, and winning — here's how we got here."
        />

        <ol className="relative mt-14 lg:mt-20">
          {/* Telemetry spine — left rail on mobile, centred on desktop. */}
          <ScrollSpine className="absolute left-[15px] top-2 bottom-2 lg:left-1/2 lg:-translate-x-1/2" />

          {MILESTONES.map((m, i) => {
            const flip = i % 2 === 1
            return (
              <li
                key={m.year}
                className="relative pb-10 pl-12 last:pb-0 lg:grid lg:grid-cols-2 lg:items-center lg:gap-x-16 lg:pb-16 lg:pl-0"
              >
                {/* Node on the rail */}
                <span
                  aria-hidden
                  className="absolute left-[15px] top-1.5 z-10 -translate-x-1/2 lg:left-1/2 lg:top-1/2 lg:-translate-y-1/2"
                >
                  <span className="block h-3.5 w-3.5 rotate-45 border border-primary bg-bg" />
                  <span className="absolute inset-0 m-auto h-1.5 w-1.5 rotate-45 bg-primary" />
                </span>

                {/* Ghost year — fills the opposite column on desktop only */}
                <div
                  aria-hidden
                  className={`hidden lg:block ${flip ? 'lg:order-2 lg:pl-10 lg:text-left' : 'lg:order-1 lg:pr-10 lg:text-right'}`}
                >
                  <span className="block font-display text-[7rem] font-bold leading-[0.82] tracking-[-0.04em] text-primary/[0.13] nums xl:text-[8.5rem]">
                    {m.year}
                  </span>
                </div>

                {/* Card */}
                <Reveal
                  y={28}
                  className={`${flip ? 'lg:order-1 lg:pr-10' : 'lg:order-2 lg:pl-10'}`}
                >
                  <div className="surface-lift group relative overflow-hidden rounded-card border border-divider bg-surface-raised p-6 hover:border-primary/40 sm:p-7">
                    <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" />
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <span className="font-display text-3xl font-bold text-primary nums lg:hidden">{m.year}</span>
                      <span className="hud-label text-primary">{m.tag}</span>
                      <span aria-hidden className="hud-label nums text-text-faint">
                        {String(i + 1).padStart(2, '0')} / {String(MILESTONES.length).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className="mb-2 font-display text-xl font-bold text-text">{m.title}</h3>
                    <p className="leading-relaxed text-text-muted text-pretty">{m.detail}</p>
                  </div>
                </Reveal>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

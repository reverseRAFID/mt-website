import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { ScrollSpine } from '@/components/motion/ScrollSpine'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PROCESS_STEPS } from '@/lib/sponsorship'

/**
 * "How it works" — a vertical numbered stepper. A telemetry spine fills as you
 * scroll, threading through big numbered nodes; each step card reveals in
 * sequence. Replaces the former pinned horizontal-scroll sequence so the whole
 * flow reads top-to-bottom with no scroll-jacking.
 */
export function PartnershipProcess() {
  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <GhostText text="PROCESS" drift="left" />
      <div className="section-container relative">
        <SectionHeader
          index="07"
          kicker="How it works"
          title="From hello to lift-off"
          description="Becoming a sponsor is simple. Four steps and your brand is part of the mission."
        />

        <ol className="relative mx-auto mt-14 max-w-3xl lg:mt-20">
          <ScrollSpine className="absolute left-7 top-6 bottom-6 -translate-x-1/2" />

          {PROCESS_STEPS.map((step, i) => (
            <li key={step.title} className="relative pb-8 pl-20 last:pb-0">
              {/* Numbered node on the rail */}
              <span
                aria-hidden
                className="absolute left-7 top-0 z-10 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-none border border-divider bg-bg"
              >
                <span className="absolute inset-1 border border-primary/30" />
                <span className="font-display text-xl font-bold text-primary nums">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </span>

              <Reveal y={26}>
                <div className="surface-lift group relative overflow-hidden rounded-card border border-divider bg-surface-raised p-6 hover:border-primary/40 sm:p-7 lg:p-8">
                  <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" size="md" />
                  <div className="mb-3 flex items-center gap-3">
                    <span className="hud-label text-primary">Step {String(i + 1).padStart(2, '0')}</span>
                    <span className="h-px flex-1 bg-divider" aria-hidden />
                  </div>
                  <h3 className="mb-3 font-display text-2xl font-bold text-text">{step.title}</h3>
                  <p className="leading-relaxed text-text-muted text-pretty">{step.description}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

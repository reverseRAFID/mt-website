import type { CrowdfundingStep } from '@/lib/cms/types'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

/**
 * The four-step explanation of a manual, off-site payment flow.
 *
 * This section carries more weight than a usual "how it works": donors are
 * being asked to send money in another app and trust that it lands. Spelling
 * out that a human verifies each transfer is what makes the ask credible.
 */
export function HowItWorks({
  steps,
  verificationHours,
  index = '01',
}: {
  steps: CrowdfundingStep[]
  verificationHours: number
  index?: string
}) {
  if (steps.length === 0) return null

  return (
    <section className="relative border-t border-divider py-20 lg:py-28">
      <GhostText text="PROCESS" drift="right" outline />
      <div className="section-container relative">
        <SectionHeader
          index={index}
          kicker="How it works"
          title="Four steps, verified by a human"
          description={`You send the money yourself, then tell us about it. A team member matches every declaration against our statement by hand — usually within ${verificationHours} hours — before anyone appears on the roll.`}
          className="mb-12 lg:mb-16"
        />

        <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div
              key={step.title}
              className="group relative flex h-full flex-col rounded-card border border-divider bg-surface-raised p-6 surface-lift hover:border-primary/40"
            >
              <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/30" />

              <div className="mb-4 flex items-center gap-3">
                <span className="font-display nums text-3xl font-bold leading-none text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span aria-hidden className="h-px flex-1 bg-divider" />
              </div>

              <h3 className="mb-2 font-display text-base font-bold leading-tight tracking-tight text-text">
                {step.title}
              </h3>
              <p className="text-sm leading-relaxed text-text-muted">{step.body}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

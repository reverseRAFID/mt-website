import type { Supporter } from '@/sanity/lib/types'
import { GhostText } from '@/components/motion/GhostText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Counter } from '@/components/motion/Counter'
import { SupportersTable } from '@/components/support/SupportersTable'
import { HIGHLIGHT_RANKS } from '@/lib/crowdfunding'

interface SupportersHonourRollProps {
  supporters: Supporter[]
  supporterCount: number
  showSupporterCount: boolean
}

/**
 * The dedicated public roll of verified supporters.
 *
 * The "amounts are never published" line is load-bearing copy, not a
 * disclaimer: the ranking visibly implies a ladder, and donors need to see
 * that the rungs are not labelled.
 */
export function SupportersHonourRoll({
  supporters,
  supporterCount,
  showSupporterCount,
}: SupportersHonourRollProps) {
  return (
    <section id="supporters" className="relative scroll-mt-20 border-t border-divider py-20 lg:py-28">
      <GhostText text="BACKERS" drift="left" />
      <div className="section-container relative">
        <SectionHeader
          index="03"
          kicker="Honour roll"
          title="The people behind the rover"
          description={
            <>
              Every supporter below sent money and had it verified by hand. They&apos;re ordered by
              how much they contributed —{' '}
              <strong className="font-semibold text-text">
                but the amounts themselves are never published
              </strong>
              , here or anywhere else on this site. Only the team treasurer sees them.
            </>
          }
          action={
            showSupporterCount && supporterCount > 0 ? (
              <div className="relative rounded-card border border-divider bg-surface-raised px-6 py-4 text-center">
                <CornerTicks className="text-primary/30" />
                <div className="font-display nums text-4xl font-bold text-primary">
                  <Counter to={supporterCount} />
                </div>
                <div className="hud-label mt-1.5 text-text-faint">
                  {supporterCount === 1 ? 'Supporter' : 'Supporters'}
                </div>
              </div>
            ) : undefined
          }
          className="mb-12 lg:mb-16"
        />

        {supporters.length > 0 ? (
          <SupportersTable supporters={supporters} />
        ) : (
          <div className="relative rounded-card border border-dashed border-divider bg-surface-raised px-6 py-14 text-center">
            <CornerTicks className="text-primary/20" size="md" />
            <p className="hud-label mb-3 text-primary">Awaiting first supporter</p>
            <h3 className="mb-3 font-display text-2xl font-bold tracking-tight text-text">
              This roll is empty — for now
            </h3>
            <p className="mx-auto max-w-md text-sm leading-relaxed text-text-muted">
              Nobody has been verified yet. Be the first, and you&apos;ll sit at the top of the
              board with the {HIGHLIGHT_RANKS === 5 ? 'gold' : 'first'} patron badge.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}

import Link from 'next/link'
import type { Supporter } from '@/lib/cms/donations'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Counter } from '@/components/motion/Counter'
import { RankBadge, ROW_STYLES, RANK_TEXT } from '@/components/support/RankBadge'
import { formatRank, rankTier, HIGHLIGHT_RANKS } from '@/lib/crowdfunding'
import { DONATE_HREF } from '@/lib/support-cta'
import { cn } from '@/lib/utils'

interface CrowdfundingSectionProps {
  /** Already capped to the badged band by the caller. */
  supporters: Supporter[]
  supporterCount: number
  showSupporterCount: boolean
  /** Hides the contribute CTA when the campaign is not open. */
  isOpen: boolean
}

const Arrow = (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform group-hover:translate-x-0.5"
    aria-hidden
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

/**
 * Homepage crowdfunding strip — the top-{HIGHLIGHT_RANKS} supporters plus the
 * route through to /support.
 *
 * Uses its own compact table rather than SupportersTable: at five rows the
 * search box and pagination are noise, and this variant drops to two columns
 * on mobile so it never competes with the surrounding sections for width.
 */
export function CrowdfundingSection({
  supporters,
  supporterCount,
  showSupporterCount,
  isOpen,
}: CrowdfundingSectionProps) {
  const hasSupporters = supporters.length > 0

  return (
    <section className="relative border-t border-divider bg-bg py-20 lg:py-28">
      <GhostText text="BACKERS" drift="right" />
      <div className="section-container relative">
        <SectionHeader
          index="08"
          kicker="Crowdfunding"
          title="Backed by people, not just brands"
          description="Individuals who chipped in to keep the rover moving. Ranked by contribution — the amounts themselves stay private."
          action={
            <Link
              href="/support"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
            >
              All supporters
              {Arrow}
            </Link>
          }
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8 lg:items-start">
          {/* Top supporters */}
          {hasSupporters ? (
            <Reveal className="overflow-x-auto border border-divider bg-surface-raised">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Top {HIGHLIGHT_RANKS} verified supporters. Contribution amounts are not published.
                </caption>
                <thead>
                  <tr className="border-b border-divider bg-surface">
                    <th scope="col" className="hud-label px-4 py-3 text-text-faint sm:px-5">
                      Rank
                    </th>
                    <th scope="col" className="hud-label px-4 py-3 text-text-faint sm:px-5">
                      Supporter
                    </th>
                    <th scope="col" className="hud-label px-4 py-3 text-text-faint sm:px-5">
                      Standing
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {supporters.map((s) => {
                    const tier = rankTier(s.rank)
                    return (
                      <tr
                        key={s.id}
                        className={cn(
                          'border-b border-l-2 border-divider transition-colors last:border-b-0',
                          tier ? ROW_STYLES[tier.key] : 'border-l-transparent'
                        )}
                      >
                        <td className="px-4 py-3.5 align-middle sm:px-5">
                          <span
                            className={cn(
                              'font-display nums text-lg font-bold leading-none',
                              tier ? RANK_TEXT[tier.key] : 'text-text-faint'
                            )}
                          >
                            {tier && <span aria-hidden>#</span>}
                            {formatRank(s.rank)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 align-middle sm:px-5">
                          <span className="block font-display text-sm font-bold uppercase leading-tight tracking-tight text-text">
                            {s.displayName}
                          </span>
                          {s.affiliation && (
                            <span className="mt-0.5 block text-xs text-text-muted">
                              {s.affiliation}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 align-middle sm:px-5">
                          <RankBadge rank={s.rank} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </Reveal>
          ) : (
            <Reveal className="relative flex flex-col justify-center rounded-card border border-dashed border-divider bg-surface-raised px-6 py-12 text-center">
              <CornerTicks className="text-primary/20" size="md" />
              <p className="hud-label mb-3 text-primary">Roll is open</p>
              <h3 className="mb-2 font-display text-xl font-bold tracking-tight text-text">
                No supporters yet
              </h3>
              <p className="mx-auto max-w-sm text-sm leading-relaxed text-text-muted">
                Be the first to back the team and take the top of the board.
              </p>
            </Reveal>
          )}

          {/* CTA panel */}
          <Reveal
            className="relative flex flex-col rounded-card border border-divider bg-surface-raised p-6 inset-glow"
            delay={0.1}
          >
            <CornerTicks className="text-primary/30" size="md" />

            {showSupporterCount && supporterCount > 0 && (
              <div className="mb-5 border-b border-divider pb-5">
                <div className="font-display nums text-5xl font-bold leading-none text-primary">
                  <Counter to={supporterCount} />
                </div>
                <div className="hud-label mt-2 text-text-faint">
                  {supporterCount === 1 ? 'Verified supporter' : 'Verified supporters'}
                </div>
              </div>
            )}

            <h3 className="mb-2 font-display text-xl font-bold leading-tight tracking-tight text-text">
              {isOpen ? 'Put your name on the board' : 'The roll stays open'}
            </h3>
            <p className="mb-6 flex-1 text-sm leading-relaxed text-text-muted">
              {isOpen
                ? 'Send through bKash, Nagad, Rocket or bank transfer, then declare it in one short form. We verify every transfer by hand — and never publish what anyone gave.'
                : 'We are not collecting right now, but every verified supporter keeps their place on the roll.'}
            </p>

            <div className="flex flex-col gap-2.5">
              {isOpen && (
                <Link
                  href={DONATE_HREF}
                  className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-5 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  Support the mission
                  {Arrow}
                </Link>
              )}
              <Link
                href="/support#supporters"
                className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                See all supporters
                {Arrow}
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

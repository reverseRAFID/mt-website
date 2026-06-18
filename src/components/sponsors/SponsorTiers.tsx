import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { TIERS, sponsorMailto } from '@/lib/sponsorship'
import { cn } from '@/lib/utils'

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

/**
 * Sponsorship tiers — benefits only. Pricing is handled one-to-one, so each
 * card routes to a pre-filled enquiry email rather than showing an amount. The
 * "Most popular" tier is visually elevated.
 */
export function SponsorTiers() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          index="04"
          kicker="Ways to partner"
          title="Choose how you ride with us"
          description="Every partnership is tailored to your goals and budget — these tiers are a starting point. Tell us what you have in mind and we’ll shape a package around it."
          className="mb-12 lg:mb-16"
        />

        <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'group relative flex h-full flex-col overflow-hidden rounded-card p-7 transition-all duration-300',
                tier.highlight
                  ? 'border border-primary/40 bg-surface-raised shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.6)] lg:-translate-y-2'
                  : 'border border-divider bg-surface-raised hover:border-primary/40'
              )}
            >
              {tier.highlight ? (
                <span aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-primary" />
              ) : (
                <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/30" />
              )}

              <div className="mb-1 flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl font-bold text-text">{tier.label}</h3>
                {tier.badge && (
                  <span
                    className={cn(
                      'hud-label rounded-none px-2 py-1',
                      tier.highlight ? 'bg-primary text-on-accent' : 'border border-divider text-text-muted'
                    )}
                  >
                    {tier.badge}
                  </span>
                )}
              </div>

              <p className="mb-5 text-sm leading-relaxed text-text-muted text-pretty">{tier.tagline}</p>

              <ul className="mb-7 flex flex-1 flex-col gap-2.5">
                {tier.benefits.map((b) => (
                  <li key={b} className="flex gap-2.5 text-sm leading-relaxed text-text">
                    <Check />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <a
                href={sponsorMailto(tier.label)}
                className={cn(
                  'inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none px-5 py-3 text-sm font-semibold transition-colors',
                  tier.highlight
                    ? 'bg-primary text-on-accent hover:bg-primary-hover'
                    : 'border border-border text-text-muted hover:border-primary hover:text-primary'
                )}
              >
                Discuss {tier.label}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
              <p className="mt-3 text-center text-xs text-text-muted">Pricing tailored to you</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

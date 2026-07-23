import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { Accordion } from '@/components/ui/Accordion'
import { SPONSOR_FAQ, SPONSOR_EMAIL, sponsorMailto } from '@/lib/sponsorship'

/**
 * Sponsorship FAQ — addresses the common objections before they become a
 * reason not to reach out.
 */
export function SponsorFaq() {
  return (
    <section className="relative border-t border-divider bg-surface py-20 lg:py-28">
      <GhostText text="FAQ" drift="right" outline />
      <div className="section-container relative">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <SectionHeader
              index="08"
              kicker="Questions"
              title="Frequently asked"
              description="Still unsure about something? We’re happy to talk it through."
            />
            <a
              href={sponsorMailto()}
              className="mt-6 inline-flex min-h-[44px] items-center gap-2 break-all rounded-none border border-border px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
              {SPONSOR_EMAIL}
            </a>
          </div>

          <Reveal>
            <Accordion items={SPONSOR_FAQ} />
          </Reveal>
        </div>
      </div>
    </section>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { HowItWorks } from '@/components/support/HowItWorks'
import { SupportFaq } from '@/components/support/SupportFaq'
import { SupportersHonourRoll } from '@/components/support/SupportersHonourRoll'
import { SupportTrustPanel } from '@/components/support/SupportTrustPanel'
import { getSupportPageData } from '@/lib/donations'
import { DEFAULT_VERIFICATION_HOURS } from '@/lib/crowdfunding'
import { DONATE_HREF, urgencyLabel, socialProofLabel } from '@/lib/support-cta'

export const metadata: Metadata = {
  title: 'Support the Mission',
  description:
    'Back BRACU Mongol-Tori with a personal contribution. Send through bKash, Nagad, Rocket or bank transfer and join the supporters roll. Contribution amounts are never published.',
}

const Arrow = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
)

/** What the money actually buys — concrete beats abstract when asking. */
const USES = [
  {
    title: 'Parts and fabrication',
    body: 'Actuators, machined aluminium, PCBs, connectors, and the replacements for everything that breaks in testing.',
  },
  {
    title: 'Getting to the competition',
    body: 'Freight for a crated rover, visas, and airfare for the crew that has to operate it on the field.',
  },
  {
    title: 'Testing and outreach',
    body: 'Field trial logistics, and the demo hardware we take into schools and give away.',
  },
]

/**
 * The crowdfunding landing page — the "why".
 *
 * Deliberately does not carry the form: the transaction lives on
 * /support/donate so it is not competing with the story and the honour roll
 * for the visitor's attention. Every CTA here routes there in one click.
 */
export default async function SupportPage() {
  const { config, supporters, supporterCount } = await getSupportPageData()
  const isOpen = config.status === 'open'
  const verificationHours = config.verificationHours ?? DEFAULT_VERIFICATION_HOURS
  const urgency = urgencyLabel(config.deadline)
  const proof = (config.showSupporterCount ?? true) ? socialProofLabel(supporterCount) : null

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker={urgency ?? 'Crowdfunding'}
        title={config.headline || 'Support the Mission'}
        description={
          config.pitch ||
          'Mongol-Tori runs on parts, travel and late nights — funded by people who want to see a Bangladeshi rover on the world stage. Chip in what you can and take your place on the supporters roll.'
        }
        watermark="SUPPORT"
        stat={
          (config.showSupporterCount ?? true) && supporterCount > 0
            ? { value: supporterCount, label: supporterCount === 1 ? 'Supporter' : 'Supporters' }
            : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {isOpen ? (
            <Link
              href={DONATE_HREF}
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
            >
              Contribute now
              {Arrow}
            </Link>
          ) : (
            <span className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-divider bg-surface px-6 py-3 text-sm font-semibold text-text-muted">
              Not collecting right now
            </span>
          )}
          <a
            href="#supporters"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            View the honour roll
          </a>
        </div>
        {proof && <p className="hud-label nums mt-4 text-text-faint">{proof}</p>}
      </PageHero>

      {/* ── Where the money goes ─────────────────────────────── */}
      <section className="relative border-t border-divider py-20 lg:py-28">
        <GhostText text="WHY" drift="left" outline />
        <div className="section-container relative">
          <SectionHeader
            index="01"
            kicker="Where it goes"
            title="What your contribution pays for"
            description="We are a student team, not a company. Contributions go into hardware and logistics — the things that decide whether a rover makes it to the start line."
            className="mb-12 lg:mb-16"
          />
          <Reveal stagger className="grid gap-5 sm:grid-cols-3">
            {USES.map((u, i) => (
              <div
                key={u.title}
                className="group relative flex h-full flex-col rounded-card border border-divider bg-surface-raised p-6 surface-lift hover:border-primary/40"
              >
                <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/30" />
                <span className="font-display nums mb-4 text-3xl font-bold leading-none text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mb-2 font-display text-base font-bold leading-tight tracking-tight text-text">
                  {u.title}
                </h3>
                <p className="text-sm leading-relaxed text-text-muted">{u.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <HowItWorks steps={config.steps ?? []} verificationHours={verificationHours} index="02" />

      {/* ── Contribute CTA + trust ───────────────────────────── */}
      <section id="contribute" className="relative scroll-mt-20 border-t border-divider bg-bg py-20 lg:py-28">
        <GhostText text="CONTRIBUTE" drift="right" />
        <div className="section-container relative">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12">
            <div>
              <SectionHeader
                index="03"
                kicker={isOpen ? 'Ready when you are' : 'Currently closed'}
                title={isOpen ? 'Two minutes, from your own app' : 'Not collecting right now'}
                description={
                  isOpen
                    ? 'You send the money yourself through bKash, Nagad, Rocket or a bank transfer — then tell us about it in one short form so we can match it to our statement. There is no amount field: we read that off our own record.'
                    : config.closedMessage ||
                      'Thank you to everyone who has backed the team. Every verified contributor keeps their place on the roll below.'
                }
                className="mb-8"
              />
              {isOpen && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link
                    href={DONATE_HREF}
                    className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                  >
                    Go to the contribution page
                    {Arrow}
                  </Link>
                  {urgency && (
                    <span className="hud-label inline-flex items-center gap-1.5 text-primary">
                      <span aria-hidden className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" />
                      {urgency}
                    </span>
                  )}
                </div>
              )}
            </div>

            <SupportTrustPanel
              verificationHours={verificationHours}
              supporterCount={supporterCount}
              showSupporterCount={config.showSupporterCount ?? true}
            />
          </div>
        </div>
      </section>

      <SupportersHonourRoll
        supporters={supporters}
        supporterCount={supporterCount}
        showSupporterCount={config.showSupporterCount ?? true}
        index="04"
      />

      <SupportFaq items={config.faqItems ?? []} index="05" />
    </PageLayout>
  )
}

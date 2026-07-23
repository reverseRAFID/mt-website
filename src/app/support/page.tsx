import type { Metadata } from 'next'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { GhostText } from '@/components/motion/GhostText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PaymentChannels } from '@/components/support/PaymentChannels'
import { SupportForm } from '@/components/support/SupportForm'
import { HowItWorks } from '@/components/support/HowItWorks'
import { SupportFaq } from '@/components/support/SupportFaq'
import { SupportersHonourRoll } from '@/components/support/SupportersHonourRoll'
import { getSupportPageData } from '@/lib/donations'
import { DEFAULT_VERIFICATION_HOURS } from '@/lib/crowdfunding'

export const metadata: Metadata = {
  title: 'Support the Mission',
  description:
    'Back BRACU Mongol-Tori with a personal contribution. Send through bKash, Nagad, Rocket or bank transfer, and join the supporters roll. Contribution amounts are never published.',
}

export default async function SupportPage() {
  const { config, supporters, supporterCount } = await getSupportPageData()
  const isOpen = config.status === 'open'
  const verificationHours = config.verificationHours ?? DEFAULT_VERIFICATION_HOURS

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker="Crowdfunding"
        title={config.headline || 'Support the Mission'}
        description={
          config.pitch ||
          'Mongol-Tori runs on parts, travel and late nights — funded by people who want to see a Bangladeshi rover on the world stage. Chip in what you can and take your place on the supporters roll.'
        }
        watermark="SUPPORT"
        stat={
          config.showSupporterCount && supporterCount > 0
            ? { value: supporterCount, label: supporterCount === 1 ? 'Supporter' : 'Supporters' }
            : undefined
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <a
            href={isOpen ? '#contribute' : '#supporters'}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
          >
            {isOpen ? 'Contribute now' : 'See the supporters'}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a
            href="#supporters"
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            View the honour roll
          </a>
        </div>
      </PageHero>

      <HowItWorks steps={config.steps ?? []} verificationHours={verificationHours} />

      {/* ── Contribute ──────────────────────────────────────── */}
      <section
        id="contribute"
        className="relative scroll-mt-20 border-t border-divider bg-bg py-20 lg:py-28"
      >
        <GhostText text="CONTRIBUTE" drift="left" />
        <div className="section-container relative">
          <SectionHeader
            index="02"
            kicker={isOpen ? 'Send & declare' : 'Currently closed'}
            title={isOpen ? 'Send, then tell us' : 'Not collecting right now'}
            description={
              isOpen
                ? 'Copy a number, send the money from your own app, then fill in the declaration so we can match it. We never ask for an amount — we read that off our own statement.'
                : undefined
            }
            className="mb-12 lg:mb-16"
          />

          {isOpen ? (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-10">
              <div className="lg:sticky lg:top-24 lg:self-start">
                <PaymentChannels channels={config.channels ?? []} />
              </div>
              <SupportForm verificationHours={verificationHours} />
            </div>
          ) : (
            <div className="relative mx-auto max-w-2xl rounded-card border border-divider bg-surface-raised px-6 py-12 text-center">
              <CornerTicks className="text-primary/25" size="md" />
              <p className="hud-label mb-3 text-primary">
                Campaign {config.status === 'paused' ? 'paused' : 'closed'}
              </p>
              <p className="leading-relaxed text-text-muted">
                {config.closedMessage ||
                  'We are not collecting contributions at the moment. Thank you to everyone who has backed the team — the supporters roll below is theirs.'}
              </p>
            </div>
          )}
        </div>
      </section>

      <SupportersHonourRoll
        supporters={supporters}
        supporterCount={supporterCount}
        showSupporterCount={config.showSupporterCount ?? true}
      />

      <SupportFaq items={config.faqItems ?? []} />
    </PageLayout>
  )
}

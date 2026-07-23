import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PaymentChannels } from '@/components/support/PaymentChannels'
import { SupportForm } from '@/components/support/SupportForm'
import { SupportTrustPanel } from '@/components/support/SupportTrustPanel'
import { getCrowdfundingConfig, getSupporterCount } from '@/lib/donations'
import { DEFAULT_VERIFICATION_HOURS } from '@/lib/crowdfunding'
import { SUPPORT_HREF, SUPPORTERS_HREF, urgencyLabel } from '@/lib/support-cta'

export const metadata: Metadata = {
  title: 'Contribute',
  description:
    'Send your contribution to BRACU Mongol-Tori through bKash, Nagad, Rocket or bank transfer, then declare it here so we can verify it. Your amount is never published.',
}

/** The three things a donor does, kept in front of them the whole way down. */
const STEPS = [
  { n: '01', title: 'Copy a number', body: 'Pick the channel you want to pay from.' },
  { n: '02', title: 'Send the money', body: 'In your own bKash, Nagad or banking app.' },
  { n: '03', title: 'Tell us here', body: 'One short form so we can match it.' },
]

/**
 * The conversion page — the only thing to do here is copy a number, pay, and
 * declare it.
 *
 * Split out from /support on purpose: that page carries the story, the honour
 * roll and the FAQ, all of which compete for attention with the actual
 * transaction. Everything a hesitant donor needs is here, and nothing else is.
 */
export default async function DonatePage() {
  const [config, supporterCount] = await Promise.all([
    getCrowdfundingConfig(),
    getSupporterCount(),
  ])

  const isOpen = config.status === 'open'
  const channels = config.channels ?? []
  const verificationHours = config.verificationHours ?? DEFAULT_VERIFICATION_HOURS
  const urgency = urgencyLabel(config.deadline)
  // Without a receiving account there is nothing for a donor to pay into, so
  // the form would collect declarations for money nobody could have sent.
  const canReceive = isOpen && channels.length > 0

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker={urgency ?? 'Contribute'}
        title="Send Your Contribution"
        description="Copy one of our account numbers, send the amount you want from your own app, then fill in the short form so we can match it to our statement. It takes about two minutes."
        watermark="GIVE"
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href={SUPPORT_HREF}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Why we&apos;re raising
          </Link>
          <Link
            href={SUPPORTERS_HREF}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            See the supporters roll
          </Link>
        </div>
      </PageHero>

      {/* Step rail — three states, no scrolling required to understand the flow */}
      {canReceive && (
        <section className="relative border-b border-divider bg-surface py-6">
          <div className="section-container">
            <ol className="grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="flex items-start gap-3">
                  <span className="font-display nums text-xl font-bold leading-none text-primary">
                    {s.n}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-tight text-text">
                      {s.title}
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
                      {s.body}
                    </span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="relative py-14 lg:py-20">
        <div className="section-container relative">
          {!isOpen ? (
            <ClosedNotice
              status={config.status}
              message={config.closedMessage}
            />
          ) : channels.length === 0 ? (
            <NoChannelsNotice />
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
              {/* Channels + trust rail. Sticky on desktop so the account number
                  stays visible while the form is being filled in. */}
              <div className="flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start">
                <PaymentChannels channels={channels} />
                <SupportTrustPanel
                  verificationHours={verificationHours}
                  supporterCount={supporterCount}
                  showSupporterCount={config.showSupporterCount ?? true}
                />
              </div>

              <div id="declare" className="scroll-mt-24">
                <SupportForm verificationHours={verificationHours} />
              </div>
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

function ClosedNotice({ status, message }: { status: string; message?: string }) {
  return (
    <div className="relative mx-auto max-w-2xl rounded-card border border-divider bg-surface-raised px-6 py-12 text-center sm:px-10">
      <CornerTicks className="text-primary/25" size="md" />
      <p className="hud-label mb-3 text-primary">
        Campaign {status === 'paused' ? 'paused' : 'closed'}
      </p>
      <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-text">
        We&apos;re not collecting right now
      </h2>
      <p className="mx-auto mb-8 max-w-md leading-relaxed text-text-muted">
        {message ||
          'Thank you to everyone who has backed the team. The supporters roll stays up — every verified contributor keeps their place on it.'}
      </p>
      <Link
        href={SUPPORTERS_HREF}
        className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
      >
        See the supporters roll
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

/**
 * Campaign open but no receiving account configured. Rather than show a form
 * that would collect declarations for money nobody could have sent, route the
 * donor to a human.
 */
function NoChannelsNotice() {
  return (
    <div className="relative mx-auto max-w-2xl rounded-card border border-dashed border-divider bg-surface-raised px-6 py-12 text-center sm:px-10">
      <CornerTicks className="text-primary/25" size="md" />
      <p className="hud-label mb-3 text-primary">Payment details unavailable</p>
      <h2 className="mb-3 font-display text-2xl font-bold tracking-tight text-text">
        We&apos;re setting up our payment channels
      </h2>
      <p className="mx-auto mb-8 max-w-md leading-relaxed text-text-muted">
        The campaign is open but our receiving accounts are not published yet. Please check back
        shortly, or get in touch and we&apos;ll arrange it with you directly.
      </p>
      <Link
        href="/contact"
        className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
      >
        Contact the team
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
  )
}

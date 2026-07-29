import Link from 'next/link'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { getSupportCtaData } from '@/lib/cms/donations'
import {
  SUPPORT_CTA_COPY,
  DONATE_HREF,
  SUPPORTERS_HREF,
  urgencyLabel,
  socialProofLabel,
  type SupportCtaKey,
} from '@/lib/support-cta'
import { cn } from '@/lib/utils'

interface SupportCTAProps {
  /** Which contextual copy to use — see SUPPORT_CTA_COPY. */
  copy: SupportCtaKey
  /**
   * `band` — full-width section, the default for the end of a page.
   * `inline` — bordered card that sits inside existing page content.
   */
  variant?: 'band' | 'inline'
  className?: string
}

const Arrow = (
  <svg
    width="15"
    height="15"
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
 * Contextual crowdfunding call-to-action.
 *
 * Server component: it resolves campaign state itself so a page can drop it in
 * without threading props down, and the shared `getSupportCtaData` cache means
 * the extra call costs nothing per placement.
 *
 * RENDERS NOTHING when the campaign is not open. Every CTA across the site
 * disappears the moment the team pauses or closes the campaign — asking for
 * money that cannot be received is the fastest way to lose a donor's trust.
 */
export async function SupportCTA({ copy, variant = 'band', className }: SupportCTAProps) {
  const { isOpen, supporterCount, deadline, showSupporterCount } = await getSupportCtaData()
  if (!isOpen) return null

  const text = SUPPORT_CTA_COPY[copy]
  const urgency = urgencyLabel(deadline)
  const proof = showSupporterCount ? socialProofLabel(supporterCount) : null

  const meta = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      {urgency && (
        <span className="hud-label inline-flex items-center gap-1.5 text-primary">
          <span aria-hidden className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" />
          {urgency}
        </span>
      )}
      {proof && <span className="hud-label nums text-text-faint">{proof}</span>}
      <span className="hud-label text-text-faint">Amount never published</span>
    </div>
  )

  const buttons = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <Link
        href={DONATE_HREF}
        className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        {text.action}
        {Arrow}
      </Link>
      <Link
        href={SUPPORTERS_HREF}
        className="group inline-flex min-h-[44px] items-center justify-center gap-2 rounded-none border border-border px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        See who&apos;s backing us
      </Link>
    </div>
  )

  if (variant === 'inline') {
    return (
      <div
        className={cn(
          'group relative flex flex-col gap-5 rounded-card border border-primary/30 bg-surface-raised p-6 inset-glow sm:p-7',
          className
        )}
      >
        <CornerTicks className="text-primary/30" size="md" />
        <div>
          <span className="hud-label text-primary">{text.kicker}</span>
          <h2 className="mt-3 font-display text-xl font-bold leading-tight tracking-tight text-text sm:text-2xl">
            {text.headline}
          </h2>
          <p className="mt-2.5 text-sm leading-relaxed text-text-muted text-pretty">{text.body}</p>
        </div>
        {buttons}
        {meta}
      </div>
    )
  }

  return (
    <section
      className={cn('relative overflow-hidden border-t border-divider py-16 lg:py-24', className)}
    >
      <GhostText text="SUPPORT" drift="right" outline />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 h-[360px] w-[360px] -translate-y-1/2 rounded-full glow-orange blur-[130px] opacity-50"
      />

      <div className="section-container relative">
        <Reveal className="relative rounded-card border border-primary/30 bg-surface-raised p-7 inset-glow sm:p-10">
          <CornerTicks className="text-primary/30" size="md" />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40"
          />

          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-2.5">
                <span aria-hidden className="h-1.5 w-1.5 rotate-45 bg-primary" />
                <span className="hud-label text-primary">{text.kicker}</span>
              </div>
              <h2 className="font-display text-2xl font-bold leading-[1.1] tracking-tight text-text text-balance sm:text-3xl lg:text-4xl">
                {text.headline}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-text-muted text-pretty">
                {text.body}
              </p>
              <div className="mt-6">{meta}</div>
            </div>

            <div className="shrink-0">{buttons}</div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

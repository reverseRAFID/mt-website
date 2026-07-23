'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DONATE_HREF } from '@/lib/support-cta'

const DISMISS_KEY = 'mt-support-cta-dismissed'

/**
 * Routes where a floating ask would be redundant or in the way:
 *  • /support*     — the ask is already the entire page
 *  • /join/apply   — would sit on top of a form being filled in
 *  • /sponsors     — already carries its own bottom-anchored sticky, and on
 *                    mobile both banners occupy the same slot
 */
const SUPPRESSED = ['/support', '/join/apply', '/sponsors']

interface SupportStickyCTAProps {
  /** Short urgency line, e.g. "6 days left". Omitted when not urgent. */
  urgency?: string | null
}

/**
 * Persistent floating crowdfunding prompt.
 *
 * Appears once the visitor has scrolled past the hero — someone who bounces in
 * the first screen was never going to give, and asking them immediately is what
 * makes a site feel like an ad. Tucks away near the footer so it never covers a
 * page's own closing CTA, and is dismissible for the session.
 *
 * Suppressed anywhere the ask is already the point (the support pages) or where
 * it would sit on top of a form the user is trying to complete.
 *
 * The parent only renders this when the campaign is open, so there is no
 * campaign-state logic here.
 */
export function SupportStickyCTA({ urgency }: SupportStickyCTAProps) {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  // Read dismissal after mount — sessionStorage is unavailable during SSR, and
  // starting dismissed avoids a flash of the banner before we know.
  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  const suppressed = SUPPRESSED.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  useEffect(() => {
    if (dismissed || suppressed) {
      setVisible(false)
      return
    }
    let raf = 0
    const update = () => {
      const h = document.documentElement
      const y = h.scrollTop
      const nearBottom = y + h.clientHeight > h.scrollHeight - 320
      setVisible(y > 700 && !nearBottom)
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [dismissed, suppressed, pathname])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (dismissed || suppressed) return null

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-3 bottom-3 z-30 transition-[transform,opacity] duration-300 ease-out sm:inset-x-auto sm:bottom-5 sm:left-5 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex items-center gap-3 rounded-card border border-primary/40 bg-surface-raised/95 p-2.5 pl-4 shadow-[0_18px_50px_-20px_rgba(var(--primary-rgb),0.7)] backdrop-blur-xl">
        <span className="hidden flex-col sm:flex">
          <span className="text-sm font-semibold leading-tight text-text">Back the rover</span>
          {urgency && <span className="hud-label mt-0.5 text-primary">{urgency}</span>}
        </span>
        <Link
          href={DONATE_HREF}
          className="group inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover sm:flex-none"
        >
          Support us
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
        </Link>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss support banner"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-none border border-divider text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

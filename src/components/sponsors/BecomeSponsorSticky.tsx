'use client'

import { useEffect, useState } from 'react'
import { sponsorMailto } from '@/lib/sponsorship'

const DISMISS_KEY = 'mt-sponsor-cta-dismissed'

/**
 * A persistent "Become a Sponsor" bar that fades in once the user scrolls past
 * the hero, and tucks away near the footer so it never covers the closing CTA.
 * Dismissible (remembered for the session). Transform/opacity only — the global
 * reduced-motion rule turns the transition off automatically.
 */
export function BecomeSponsorSticky() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === '1')
  }, [])

  useEffect(() => {
    if (dismissed) return
    let raf = 0
    const update = () => {
      const h = document.documentElement
      const y = h.scrollTop
      const nearBottom = y + h.clientHeight > h.scrollHeight - 260
      setVisible(y > 640 && !nearBottom)
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
  }, [dismissed])

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setDismissed(true)
  }

  if (dismissed) return null

  return (
    <div
      inert={!visible}
      className={`fixed inset-x-3 bottom-3 z-30 transition-[transform,opacity] duration-300 ease-out sm:inset-x-auto sm:right-5 sm:bottom-5 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-6 opacity-0'
      }`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative flex items-center gap-3 rounded-card border border-primary/40 bg-surface-raised/95 p-2.5 pl-4 shadow-[0_18px_50px_-20px_rgba(var(--primary-rgb),0.7)] backdrop-blur-xl">
        <span className="hidden text-sm font-medium text-text sm:inline">
          Like what you see?
        </span>
        <a
          href={sponsorMailto()}
          className="inline-flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover sm:flex-none"
        >
          Become a Sponsor
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </a>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Dismiss sponsorship banner"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-none border border-divider text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  )
}

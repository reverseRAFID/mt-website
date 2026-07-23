'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  /** Text placed on the clipboard. */
  value: string
  /** Accessible label, e.g. "Copy bKash number". */
  label: string
  className?: string
}

type State = 'idle' | 'copied' | 'failed'

/**
 * Copy-to-clipboard control.
 *
 * `navigator.clipboard` needs a secure context, and the page is reachable over
 * plain HTTP on a LAN during development — so a `document.execCommand` path
 * backs it up rather than leaving the button silently dead. If both fail the
 * button says so instead of lying, which matters here: a donor who believes a
 * number is on their clipboard may paste a stale one into a payment app.
 *
 * The result is announced through a polite live region so it is not a
 * colour-only signal.
 */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [state, setState] = useState<State>('idle')
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [])

  const flash = useCallback((next: State) => {
    setState(next)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setState('idle'), 2000)
  }, [])

  const copy = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
        flash('copied')
        return
      }
      throw new Error('clipboard API unavailable')
    } catch {
      // Legacy fallback for non-secure contexts.
      try {
        const ta = document.createElement('textarea')
        ta.value = value
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        const ok = document.execCommand('copy')
        document.body.removeChild(ta)
        flash(ok ? 'copied' : 'failed')
      } catch {
        flash('failed')
      }
    }
  }, [value, flash])

  return (
    <>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className={cn(
          'group/copy inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-none border px-3 py-2 text-xs font-semibold transition-colors',
          state === 'copied'
            ? 'border-primary bg-primary text-on-accent'
            : state === 'failed'
              ? 'border-red-300 text-red-600 dark:border-red-800 dark:text-red-400'
              : 'border-border text-text-muted hover:border-primary hover:text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised',
          className
        )}
      >
        {state === 'copied' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6 9 17l-5-5" />
          </svg>
        ) : state === 'failed' ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="9" y="9" width="13" height="13" rx="1" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        <span>{state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : 'Copy'}</span>
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === 'copied'
          ? `${label} copied to clipboard`
          : state === 'failed'
            ? `Could not copy ${label}. Please select and copy it manually.`
            : ''}
      </span>
    </>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useId, useState } from 'react'
import { normalizeTrackId } from '@/lib/shop'

/**
 * Track-ID lookup box.
 *
 * Navigates to /shop/track/<id> rather than fetching, so the result is a real,
 * shareable, refreshable URL — the customer can bookmark it and come back
 * tomorrow, which is exactly what someone waiting on a parcel does.
 *
 * The ID is normalised before navigating: people type it lowercase, with spaces,
 * or with the letters Crockford base32 excludes standing in for digits.
 */
export function TrackForm({ autoFocus = false }: { autoFocus?: boolean }) {
  const router = useRouter()
  const id = useId()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    const normalized = normalizeTrackId(value)
    if (!normalized) {
      setError('Enter the tracking reference from your confirmation email.')
      return
    }
    setError(null)
    router.push(`/shop/track/${encodeURIComponent(normalized)}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label htmlFor={id} className="hud-label text-text-muted">
        Tracking reference
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          id={id}
          value={value}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus={autoFocus}
          onChange={(event) => {
            setValue(event.target.value)
            if (error) setError(null)
          }}
          placeholder="MT-7K4QX2ZP"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          className="w-full min-h-[48px] flex-1 rounded-none border border-divider bg-surface px-4 py-3 font-mono text-base uppercase tracking-[0.15em] text-text placeholder-text-faint transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
        >
          Track
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      {error && (
        <span id={`${id}-error`} role="alert" className="text-xs font-semibold text-primary">
          {error}
        </span>
      )}
      <p className="text-xs leading-relaxed text-text-faint">
        It looks like <span className="font-mono">MT-7K4QX2ZP</span> and is in the confirmation
        email we sent when you ordered.
      </p>
    </form>
  )
}

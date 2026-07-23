'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { PAYMENT_METHODS, LIMITS } from '@/lib/crowdfunding'
import { CornerTicks } from '@/components/ui/CornerTicks'

type Status = 'idle' | 'loading' | 'success' | 'error'

const initialForm = {
  paymentMethod: '',
  senderAccount: '',
  transactionId: '',
  donorName: '',
  affiliation: '',
  message: '',
  contactEmail: '',
  contactPhone: '',
}

// Styling lifted verbatim from ApplyForm so the two forms are indistinguishable.
const inputCls =
  'w-full min-h-[44px] rounded-none border border-divider bg-surface px-3.5 py-2.5 text-sm text-text placeholder-text-faint transition-colors hover:border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-none leading-relaxed`
const selectCls = `${inputCls} appearance-none cursor-pointer pr-10`

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="hud-label text-text-muted">
        {label}
        {required && (
          <span className="text-primary ml-1" aria-hidden>
            *
          </span>
        )}
        {hint && (
          <span className="ml-2 font-normal normal-case tracking-normal text-text-faint">{hint}</span>
        )}
      </label>
      {children}
    </div>
  )
}

function SectionTitle({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 border-b border-divider/60 pb-3">
      <span className="hud-label nums text-text-faint" aria-hidden>
        {index}
      </span>
      <span className="h-1 w-1 rotate-45 bg-primary" aria-hidden />
      <span className="hud-label text-text-muted">{children}</span>
    </div>
  )
}

const SelectChevron = (
  <svg
    aria-hidden
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-faint"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
)

/**
 * Payment declaration form.
 *
 * Deliberately has no amount field. A donor cannot claim a figure — the
 * treasurer reads it off the statement during verification — which removes
 * both the incentive and the mechanism to inflate a rank.
 */
export function SupportForm({ verificationHours }: { verificationHours: number }) {
  const uid = useId()
  const f = (k: string) => `${uid}-${k}`
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)
  // Feeds the server's minimum-fill-time spam trap.
  const mountedAt = useRef<number>(0)
  const honeypot = useRef<HTMLInputElement>(null)

  useEffect(() => {
    mountedAt.current = Date.now()
  }, [])

  // Move focus to the relevant region on state change so screen-reader and
  // keyboard users are told the outcome.
  useEffect(() => {
    if (status === 'error') errorRef.current?.focus()
    if (status === 'success') successRef.current?.focus()
  }, [status])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/donate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          isAnonymous,
          confirmed,
          website: honeypot.current?.value ?? '',
          elapsedMs: mountedAt.current ? Date.now() - mountedAt.current : undefined,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setStatus('error')
      } else {
        setStatus('success')
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } catch {
      setError('Network error. Please check your connection and try again.')
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div
        role="status"
        aria-live="polite"
        className="relative overflow-hidden rounded-card border border-divider bg-surface-raised p-8 text-center inset-glow sm:p-10"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-56 -translate-x-1/2 glow-orange opacity-50 blur-[110px]"
        />
        <CornerTicks className="text-primary/40" size="md" />
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-none bg-emerald-100 dark:bg-emerald-950/40">
          <svg
            aria-hidden
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-emerald-600 dark:text-emerald-400"
          >
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <path d="M22 4 12 14.01l-3-3" />
          </svg>
        </div>
        <p className="hud-label mb-3 text-primary">Declaration Received</p>
        <h2
          ref={successRef}
          tabIndex={-1}
          className="mb-3 font-display text-3xl font-bold tracking-tight text-text outline-none"
        >
          Thank you!
        </h2>
        <p className="mx-auto mb-8 max-w-md leading-relaxed text-text-muted">
          We&apos;ll match your transfer against our records and add you to the supporters roll,
          usually within {verificationHours} hours. If anything doesn&apos;t line up we&apos;ll get
          in touch.
        </p>
        <Link
          href="/support#supporters"
          className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised"
        >
          See the supporters roll
          <svg
            aria-hidden
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform group-hover:translate-x-0.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative rounded-card border border-divider bg-surface-raised p-6 sm:p-8">
      <CornerTicks className="text-primary/15" size="md" />

      {/* Console header */}
      <div className="mb-7 flex items-center justify-between gap-4 border-b border-divider pb-4">
        <div className="flex items-center gap-2.5">
          <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
          <span className="hud-label text-text-muted">Declaration // Intake</span>
        </div>
        <span className="hud-label text-text-faint">
          <span className="text-primary">*</span> Required
        </span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8" aria-busy={status === 'loading'}>
        {/* Honeypot — hidden from humans, catnip for form-filling bots. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor={f('website')}>Website</label>
          <input id={f('website')} ref={honeypot} type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <fieldset
          className="m-0 flex min-w-0 flex-col gap-8 border-0 p-0"
          disabled={status === 'loading'}
        >
          {/* 01 — The payment */}
          <div className="flex flex-col gap-6">
            <SectionTitle index="01">Your Payment</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Channel you used" htmlFor={f('paymentMethod')} required>
                <div className="relative">
                  <select
                    id={f('paymentMethod')}
                    className={selectCls}
                    value={form.paymentMethod}
                    onChange={set('paymentMethod')}
                    required
                  >
                    <option value="" disabled>
                      Select channel
                    </option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  {SelectChevron}
                </div>
              </Field>
              <Field
                label="Account you sent from"
                htmlFor={f('senderAccount')}
                required
                hint="never published"
              >
                <input
                  id={f('senderAccount')}
                  type="text"
                  inputMode="tel"
                  className={inputCls}
                  placeholder="01XXXXXXXXX"
                  value={form.senderAccount}
                  onChange={set('senderAccount')}
                  maxLength={LIMITS.account}
                  required
                />
              </Field>
            </div>
            <Field
              label="Transaction ID"
              htmlFor={f('transactionId')}
              hint="optional — speeds up verification a lot"
            >
              <input
                id={f('transactionId')}
                type="text"
                className={inputCls}
                placeholder="e.g. 9F7K2LM4QP"
                value={form.transactionId}
                onChange={set('transactionId')}
                maxLength={LIMITS.transactionId}
              />
            </Field>
            <p className="text-xs leading-relaxed text-text-muted">
              We use these only to find your transfer in our statement. There is no amount field
              here — we read that off the record ourselves.
            </p>
          </div>

          {/* 02 — How you're listed */}
          <div className="flex flex-col gap-6">
            <SectionTitle index="02">How You&apos;re Listed</SectionTitle>
            <Field label="Your name" htmlFor={f('donorName')} required>
              <input
                id={f('donorName')}
                type="text"
                autoComplete="name"
                className={inputCls}
                placeholder="Farhan Ahmed"
                value={form.donorName}
                onChange={set('donorName')}
                maxLength={LIMITS.name}
                required
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 border border-divider bg-surface px-4 py-3.5 transition-colors hover:border-primary/40">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              />
              <span>
                <span className="block text-sm font-semibold text-text">List me as Anonymous</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-text-muted">
                  The roll will show “Anonymous” instead of your name. We still need your real name
                  above to match the payment — it is never published.
                </span>
              </span>
            </label>

            <div className="grid gap-6 sm:grid-cols-2">
              <Field
                label="Affiliation"
                htmlFor={f('affiliation')}
                hint={isAnonymous ? 'hidden while anonymous' : 'optional'}
              >
                <input
                  id={f('affiliation')}
                  type="text"
                  className={inputCls}
                  placeholder="BRACU CSE ’22"
                  value={form.affiliation}
                  onChange={set('affiliation')}
                  maxLength={LIMITS.affiliation}
                  disabled={isAnonymous}
                />
              </Field>
              <Field label="Public message" htmlFor={f('message')} hint="optional">
                <textarea
                  id={f('message')}
                  rows={2}
                  className={textareaCls}
                  placeholder="Go get that gold."
                  value={form.message}
                  onChange={set('message')}
                  maxLength={LIMITS.message}
                />
              </Field>
            </div>
          </div>

          {/* 03 — Contact */}
          <div className="flex flex-col gap-6">
            <SectionTitle index="03">Reaching You</SectionTitle>
            <div className="grid gap-6 sm:grid-cols-2">
              <Field label="Email" htmlFor={f('contactEmail')} hint="optional — never published">
                <input
                  id={f('contactEmail')}
                  type="email"
                  autoComplete="email"
                  className={inputCls}
                  placeholder="you@example.com"
                  value={form.contactEmail}
                  onChange={set('contactEmail')}
                  maxLength={LIMITS.email}
                />
              </Field>
              <Field label="Phone" htmlFor={f('contactPhone')} hint="optional — never published">
                <input
                  id={f('contactPhone')}
                  type="tel"
                  autoComplete="tel"
                  className={inputCls}
                  placeholder="+880 1XXX-XXXXXX"
                  value={form.contactPhone}
                  onChange={set('contactPhone')}
                  maxLength={LIMITS.phone}
                />
              </Field>
            </div>
            <p className="text-xs leading-relaxed text-text-muted">
              Leave at least one if you can — it&apos;s how we reach you if the transfer
              doesn&apos;t match.
            </p>
          </div>

          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--primary)]"
              required
            />
            <span className="text-sm leading-relaxed text-text-muted">
              I confirm I have already sent this payment.
              <span className="text-primary" aria-hidden>
                {' '}
                *
              </span>
            </span>
          </label>
        </fieldset>

        {error && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-none border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 outline-none dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-5 pt-1">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised disabled:cursor-not-allowed disabled:opacity-60"
          >
            {status === 'loading' ? (
              <>
                <svg
                  aria-hidden
                  className="animate-spin"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                </svg>
                Submitting…
              </>
            ) : (
              <>
                Submit Declaration
                <svg
                  aria-hidden
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:translate-x-0.5"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          <span className="hud-label text-text-faint">Verified in ~{verificationHours}h</span>
        </div>
      </form>
    </div>
  )
}

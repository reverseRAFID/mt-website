'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { APPLY_SUBTEAMS } from '@/lib/subteams'
import { CornerTicks } from '@/components/ui/CornerTicks'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']

type Status = 'idle' | 'loading' | 'success' | 'error'

const initialForm = {
  name: '',
  email: '',
  phone: '',
  studentId: '',
  department: '',
  year: '',
  subteam1: '',
  subteam2: '',
  whyJoin: '',
  experience: '',
  portfolio: '',
}

const inputCls =
  'w-full min-h-[44px] rounded-md border border-divider bg-surface px-3.5 py-2.5 text-sm text-text placeholder-text-faint transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'
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
        {hint && <span className="ml-2 font-normal normal-case tracking-normal text-text-faint">{hint}</span>}
      </label>
      {children}
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

export function ApplyForm() {
  const uid = useId()
  const f = (k: string) => `${uid}-${k}`
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)
  const errorRef = useRef<HTMLParagraphElement>(null)
  const successRef = useRef<HTMLHeadingElement>(null)

  // Move focus to the relevant region on state change so screen-reader and
  // keyboard users are told the outcome (the submit button they had focused is
  // either removed or disabled).
  useEffect(() => {
    if (status === 'error') errorRef.current?.focus()
    if (status === 'success') successRef.current?.focus()
  }, [status])

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((prev) => {
        const next = { ...prev, [key]: e.target.value }
        // Keep the two sub-team choices distinct.
        if (key === 'subteam1' && next.subteam2 === next.subteam1) next.subteam2 = ''
        return next
      })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    setError('')
    try {
      const res = await fetch('/api/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        className="relative overflow-hidden rounded-card border border-divider bg-surface-raised p-8 text-center sm:p-10"
      >
        <CornerTicks className="text-primary/40" size="md" />
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
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
        <p className="hud-label text-primary mb-3">Transmission Received</p>
        <h2
          ref={successRef}
          tabIndex={-1}
          className="font-display font-bold text-3xl text-text tracking-tight mb-3 outline-none"
        >
          Application Submitted!
        </h2>
        <p className="text-text-muted leading-relaxed mb-8 mx-auto max-w-md">
          Thanks for applying to Mongol-Tori. We&apos;ll review your application and get back to you by email within
          two weeks.
        </p>
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
        >
          Back to Home
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
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    )
  }

  return (
    <div className="relative rounded-card border border-divider bg-surface-raised p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-6" aria-busy={status === 'loading'}>
        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Full Name" htmlFor={f('name')} required>
            <input id={f('name')} type="text" autoComplete="name" className={inputCls} placeholder="Farhan Ahmed" value={form.name} onChange={set('name')} required />
          </Field>
          <Field label="Email Address" htmlFor={f('email')} required>
            <input id={f('email')} type="email" autoComplete="email" className={inputCls} placeholder="you@bracu.ac.bd" value={form.email} onChange={set('email')} required />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Student ID" htmlFor={f('studentId')} required>
            <input id={f('studentId')} type="text" inputMode="numeric" className={inputCls} placeholder="21301234" value={form.studentId} onChange={set('studentId')} required />
          </Field>
          <Field label="Phone" htmlFor={f('phone')} hint="optional">
            <input id={f('phone')} type="tel" autoComplete="tel" className={inputCls} placeholder="+880 1XXX-XXXXXX" value={form.phone} onChange={set('phone')} />
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="Department" htmlFor={f('department')} required>
            <input id={f('department')} type="text" className={inputCls} placeholder="CSE / EEE / ME / etc." value={form.department} onChange={set('department')} required />
          </Field>
          <Field label="Academic Year" htmlFor={f('year')} required>
            <div className="relative">
              <select id={f('year')} className={selectCls} value={form.year} onChange={set('year')} required>
                <option value="" disabled>
                  Select year
                </option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              {SelectChevron}
            </div>
          </Field>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <Field label="First Sub-Team Choice" htmlFor={f('subteam1')} required>
            <div className="relative">
              <select id={f('subteam1')} className={selectCls} value={form.subteam1} onChange={set('subteam1')} required>
                <option value="" disabled>
                  Select sub-team
                </option>
                {APPLY_SUBTEAMS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {SelectChevron}
            </div>
          </Field>
          <Field label="Second Sub-Team Choice" htmlFor={f('subteam2')} hint="optional">
            <div className="relative">
              <select id={f('subteam2')} className={selectCls} value={form.subteam2} onChange={set('subteam2')}>
                <option value="">No preference</option>
                {APPLY_SUBTEAMS.filter((s) => s !== form.subteam1).map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {SelectChevron}
            </div>
          </Field>
        </div>

        <Field label="Why do you want to join Mongol-Tori?" htmlFor={f('whyJoin')} required>
          <textarea
            id={f('whyJoin')}
            rows={4}
            className={textareaCls}
            placeholder="Tell us what drives you and what you hope to contribute..."
            value={form.whyJoin}
            onChange={set('whyJoin')}
            maxLength={5000}
            required
          />
        </Field>

        <Field label="Relevant experience or skills" htmlFor={f('experience')} hint="optional">
          <textarea
            id={f('experience')}
            rows={3}
            className={textareaCls}
            placeholder="Prior robotics, programming, CAD, electronics — anything relevant."
            value={form.experience}
            onChange={set('experience')}
            maxLength={5000}
          />
        </Field>

        <Field label="Portfolio / GitHub / LinkedIn" htmlFor={f('portfolio')} hint="optional">
          <input
            id={f('portfolio')}
            type="text"
            inputMode="url"
            className={inputCls}
            placeholder="github.com/you · linkedin.com/in/you"
            value={form.portfolio}
            onChange={set('portfolio')}
          />
        </Field>

        {error && (
          <p
            ref={errorRef}
            tabIndex={-1}
            role="alert"
            className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 outline-none dark:border-red-800 dark:bg-red-950/30 dark:text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex items-center gap-5 pt-1">
          <button
            type="submit"
            disabled={status === 'loading'}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
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
                Submit Application
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
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>
          <Link
            href="/join"
            className="inline-flex min-h-[44px] items-center px-1 text-sm font-medium text-text-faint transition-colors hover:text-primary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

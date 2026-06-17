'use client'

import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import { useState } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

const SUBTEAMS = [
  'Mechanical', 'Electrical', 'Software', 'Science', 'Drone', 'Outreach', 'Management',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']

type Status = 'idle' | 'loading' | 'success' | 'error'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="hud-label text-text-muted">
        {label}{required && <span className="text-primary ml-1" aria-hidden>*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'w-full min-h-[44px] rounded-md border border-divider bg-surface px-3.5 py-2.5 text-sm text-text placeholder-text-faint transition-colors focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-none leading-relaxed`
const selectCls = `${inputCls} appearance-none cursor-pointer pr-10`

export default function ApplyPage() {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '', email: '', studentId: '', department: '', year: '',
    subteam1: '', subteam2: '', whyJoin: '', experience: '',
  })

  function set(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }))
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
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong.')
        setStatus('error')
      } else {
        setStatus('success')
      }
    } catch {
      setError('Network error. Please try again.')
      setStatus('error')
    }
  }

  // Chevron for selects (decorative)
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

  if (status === 'success') {
    return (
      <PageLayout>
        <div className="section-container min-h-dvh py-20 flex items-center justify-center">
          <Reveal y={32} blur={6} className="w-full max-w-lg">
            <div className="relative rounded-card border border-divider bg-surface-raised p-8 sm:p-10 text-center">
              <CornerTicks className="text-primary/40" size="md" />
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>
                </svg>
              </div>
              <p className="hud-label text-primary mb-3">Transmission Received</p>
              <h1 className="font-display font-bold text-3xl text-text tracking-tight mb-3">Application Submitted!</h1>
              <p className="text-text-muted leading-relaxed mb-8">
                Thanks for applying to Mongol-Tori. We&apos;ll review your application and get back to you within two weeks.
              </p>
              <Link href="/" className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover">
                Back to Home
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </Reveal>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <SectionHeader
            kicker="Recruitment"
            title="Apply to Join"
            description={
              <>
                Already know the team?{' '}
                <Link href="/join" className="text-primary link-underline">Back to recruitment overview.</Link>
              </>
            }
          />
        </div>
      </section>

      <div className="section-container py-16 lg:py-20 max-w-2xl">
        <Reveal>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Full Name" required>
                <input type="text" className={inputCls} placeholder="Farhan Ahmed" value={form.name} onChange={set('name')} required />
              </Field>
              <Field label="Email Address" required>
                <input type="email" className={inputCls} placeholder="you@bracu.ac.bd" value={form.email} onChange={set('email')} required />
              </Field>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="Student ID" required>
                <input type="text" className={inputCls} placeholder="21301234" value={form.studentId} onChange={set('studentId')} required />
              </Field>
              <Field label="Department" required>
                <input type="text" className={inputCls} placeholder="CSE / EEE / ME / etc." value={form.department} onChange={set('department')} required />
              </Field>
            </div>

            <Field label="Academic Year" required>
              <div className="relative">
                <select className={selectCls} value={form.year} onChange={set('year')} required>
                  <option value="" disabled>Select year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                {SelectChevron}
              </div>
            </Field>

            <div className="grid sm:grid-cols-2 gap-6">
              <Field label="First Sub-Team Choice" required>
                <div className="relative">
                  <select className={selectCls} value={form.subteam1} onChange={set('subteam1')} required>
                    <option value="" disabled>Select sub-team</option>
                    {SUBTEAMS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                  </select>
                  {SelectChevron}
                </div>
              </Field>
              <Field label="Second Sub-Team Choice">
                <div className="relative">
                  <select className={selectCls} value={form.subteam2} onChange={set('subteam2')}>
                    <option value="">No preference</option>
                    {SUBTEAMS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
                  </select>
                  {SelectChevron}
                </div>
              </Field>
            </div>

            <Field label="Why do you want to join Mongol-Tori?" required>
              <textarea
                rows={4}
                className={textareaCls}
                placeholder="Tell us what drives you and what you hope to contribute..."
                value={form.whyJoin}
                onChange={set('whyJoin')}
                required
              />
            </Field>

            <Field label="Relevant experience or skills (optional)">
              <textarea
                rows={3}
                className={textareaCls}
                placeholder="Prior robotics, programming, CAD, electronics — anything relevant."
                value={form.experience}
                onChange={set('experience')}
              />
            </Field>

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </p>
            )}

            <div className="flex items-center gap-5 pt-2">
              <button
                type="submit"
                disabled={status === 'loading'}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              >
                {status === 'loading' ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Submitting…
                  </>
                ) : (
                  <>
                    Submit Application
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
              <Link href="/join" className="text-sm font-medium text-text-faint transition-colors hover:text-primary">
                Cancel
              </Link>
            </div>
          </form>
        </Reveal>
      </div>
    </PageLayout>
  )
}

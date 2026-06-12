'use client'

import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import { useState } from 'react'

const SUBTEAMS = [
  'Mechanical', 'Electrical', 'Software', 'Science', 'Drone', 'Outreach', 'Management',
]

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate']

type Status = 'idle' | 'loading' | 'success' | 'error'

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-text">
        {label}{required && <span className="text-primary ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

const inputCls = 'bg-bg border border-divider rounded-md px-3 py-2 text-sm text-text placeholder-text-faint focus:outline-none focus:border-primary transition-colors'
const textareaCls = `${inputCls} resize-none`
const selectCls = `${inputCls} appearance-none cursor-pointer`

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

  if (status === 'success') {
    return (
      <PageLayout>
        <div className="section-container py-20 max-w-lg mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/40 flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-600 dark:text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/>
            </svg>
          </div>
          <h1 className="font-display font-bold text-3xl text-text mb-3">Application Submitted!</h1>
          <p className="text-text-muted mb-8">
            Thanks for applying to Mongol-Tori. We&apos;ll review your application and get back to you within two weeks.
          </p>
          <Link href="/" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors">
            Back to Home
          </Link>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Recruitment</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-2">Apply to Join</h1>
          <p className="text-text-muted">
            Already know the team?{' '}
            <Link href="/join" className="text-primary hover:underline">Back to recruitment overview.</Link>
          </p>
        </div>
      </div>

      <div className="section-container py-14 max-w-2xl">
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
            <select className={selectCls} value={form.year} onChange={set('year')} required>
              <option value="" disabled>Select year</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </Field>

          <div className="grid sm:grid-cols-2 gap-6">
            <Field label="First Sub-Team Choice" required>
              <select className={selectCls} value={form.subteam1} onChange={set('subteam1')} required>
                <option value="" disabled>Select sub-team</option>
                {SUBTEAMS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
            </Field>
            <Field label="Second Sub-Team Choice">
              <select className={selectCls} value={form.subteam2} onChange={set('subteam2')}>
                <option value="">No preference</option>
                {SUBTEAMS.map((s) => <option key={s} value={s.toLowerCase()}>{s}</option>)}
              </select>
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
            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-md px-4 py-3">
              {error}
            </p>
          )}

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={status === 'loading'}
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-md font-semibold transition-colors"
            >
              {status === 'loading' ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Submitting…
                </>
              ) : 'Submit Application'}
            </button>
            <Link href="/join" className="text-sm text-text-faint hover:text-primary transition-colors">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </PageLayout>
  )
}

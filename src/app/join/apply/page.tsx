import type { Metadata } from 'next'
import Link from 'next/link'
import { PageLayout } from '@/components/layout/PageLayout'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { ApplyForm } from '@/components/join/ApplyForm'
import { sanityFetch } from '@/sanity/lib/client'
import { RECRUITMENT_CONFIG_QUERY } from '@/sanity/lib/queries'
import type { RecruitmentConfig } from '@/sanity/lib/types'
import { APPLY_SUBTEAMS } from '@/lib/subteams'

export const metadata: Metadata = { title: 'Apply to Join' }

const STEPS = [
  { title: 'Submit your application', desc: 'Share your background and which sub-teams interest you most.' },
  { title: 'Application review', desc: 'We read every submission and shortlist candidates by fit and interest.' },
  { title: 'Interview / technical task', desc: 'A short conversation and a hands-on task matched to your sub-team.' },
  { title: 'Onboarding', desc: 'Join the workspace, meet your mentors, and start building.' },
]

const STATUS_CONFIG = {
  open: {
    label: 'Applications Open',
    color:
      'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800',
  },
  'under-review': {
    label: 'Under Review',
    color:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800',
  },
  closed: { label: 'Applications Closed', color: 'bg-surface-2 text-text-faint border-divider' },
} as const

export default async function ApplyPage() {
  const recruitment = await sanityFetch<RecruitmentConfig | null>(RECRUITMENT_CONFIG_QUERY)
  const status = recruitment?.status ?? 'closed'
  const isOpen = status === 'open'
  const config = STATUS_CONFIG[status]

  // Match the format used on /join for a consistent reading.
  const deadline =
    recruitment?.closingDate &&
    new Date(recruitment.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <SectionHeader
            as="h1"
            kicker="Recruitment"
            title="Apply to Join"
            description={
              <>
                Want to know the sub-teams first?{' '}
                <Link href="/join" className="text-primary link-underline">
                  Back to recruitment overview.
                </Link>
              </>
            }
          />
        </div>
      </section>

      <section className="section-container py-16 lg:py-20">
        {isOpen ? (
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            {/* Info aside */}
            <aside className="lg:sticky lg:top-28 lg:self-start">
              <Reveal className="flex flex-col gap-8">
                {/* Status + deadline */}
                <div className="flex flex-col gap-3">
                  <div
                    className={`inline-flex w-fit max-w-full flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl border px-4 py-2 text-sm font-semibold ${config.color}`}
                  >
                    <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                    {config.label}
                    {deadline && <span className="font-normal opacity-75">· Deadline: {deadline}</span>}
                  </div>
                  {recruitment?.openingMessage && (
                    <p className="max-w-md text-sm text-text-muted leading-relaxed text-pretty">
                      {recruitment.openingMessage}
                    </p>
                  )}
                </div>

                {/* What happens next */}
                <div>
                  <div className="mb-4 flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                    <span className="hud-label text-primary">What happens next</span>
                  </div>
                  <ol className="flex flex-col gap-4">
                    {STEPS.map((step, i) => (
                      <li key={step.title} className="flex gap-3.5">
                        <span className="hud-label nums mt-0.5 text-text-faint">{String(i + 1).padStart(2, '0')}</span>
                        <div>
                          <p className="font-display text-sm font-semibold text-text">{step.title}</p>
                          <p className="mt-0.5 text-sm text-text-muted leading-relaxed text-pretty">{step.desc}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Sub-teams */}
                <div>
                  <div className="mb-3 flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                    <span className="hud-label text-primary">Sub-teams</span>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {APPLY_SUBTEAMS.map((s) => (
                      <li
                        key={s}
                        className="inline-flex items-center gap-1.5 rounded-full border border-divider bg-surface px-3 py-1 text-xs font-medium text-text-muted"
                      >
                        <span className="h-1 w-1 rotate-45 bg-primary" aria-hidden />
                        {s}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs text-text-faint leading-relaxed text-pretty">
                    Not sure which fits?{' '}
                    <Link href="/join" className="text-primary link-underline">
                      Read what each sub-team does.
                    </Link>
                  </p>
                </div>
              </Reveal>
            </aside>

            {/* Form */}
            <Reveal y={24}>
              <ApplyForm />
            </Reveal>
          </div>
        ) : (
          /* Closed / under-review state */
          <div className="flex min-h-[40vh] items-center justify-center">
            <Reveal y={28} blur={6} className="w-full max-w-lg">
              <div className="relative rounded-card border border-divider bg-surface-raised p-8 text-center sm:p-10">
                <CornerTicks className="text-primary/30" size="md" />
                <div
                  className={`mx-auto mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${config.color}`}
                >
                  <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                  {config.label}
                </div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-text">
                  {status === 'under-review' ? 'Applications are under review' : 'Applications are closed right now'}
                </h2>
                <p className="mx-auto mt-3 max-w-md text-text-muted leading-relaxed text-pretty">
                  {recruitment?.openingMessage ??
                    'Recruitment is not open at the moment. Check the recruitment overview for the next intake and follow our channels for updates.'}
                </p>
                <Link
                  href="/join"
                  className="mt-7 inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  Recruitment overview
                  <svg
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
            </Reveal>
          </div>
        )}
      </section>
    </PageLayout>
  )
}

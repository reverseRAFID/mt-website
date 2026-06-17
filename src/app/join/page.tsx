import type { ReactNode } from 'react'
import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RECRUITMENT_CONFIG_QUERY } from '@/sanity/lib/queries'
import type { RecruitmentConfig } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import type { ApplySubteam } from '@/lib/subteams'

export const metadata: Metadata = { title: 'Join the Team' }

const STATUS_CONFIG = {
  open: { label: 'Applications Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  'under-review': { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  closed: { label: 'Applications Closed', color: 'bg-surface-2 text-text-faint border-divider' },
}

const iconProps = {
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// `name` is typed against ApplySubteam so the cards here stay in lockstep with
// the apply-form / API / Sanity sub-team list (src/lib/subteams.ts).
const SUBTEAMS: { name: ApplySubteam; icon: ReactNode; description: string }[] = [
  {
    name: 'Mechanical & CAD',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
    description: 'Designs and prototypes structural systems, fixtures, and mechanisms with a focus on manufacturability, reliability, and hands-on iteration.',
  },
  {
    name: 'Electronics',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z" />
      </svg>
    ),
    description: 'Builds embedded hardware, power distribution, and sensing platforms while developing the practical electronics skills that support field-ready systems.',
  },
  {
    name: 'Controls & Software',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="m16 18 6-6-6-6" />
        <path d="m8 6-6 6 6 6" />
      </svg>
    ),
    description: 'Creates the software tools, automation logic, and control workflows that connect ideas into dependable engineered behavior.',
  },
  {
    name: 'Network & Vision',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
        <path d="m9 15 3-3" />
        <path d="M17 13a6 6 0 0 0-6-6" />
        <path d="M21 13A10 10 0 0 0 11 3" />
      </svg>
    ),
    description: 'Works on communication, imaging, and data flow so the team can observe, coordinate, and make decisions in real time.',
  },
  {
    name: 'AI & Autonomous',
    icon: (
      <svg {...iconProps} aria-hidden>
        <rect width="16" height="16" x="4" y="4" rx="2" />
        <rect width="6" height="6" x="9" y="9" rx="1" />
        <path d="M15 2v2" />
        <path d="M15 20v2" />
        <path d="M2 15h2" />
        <path d="M2 9h2" />
        <path d="M20 15h2" />
        <path d="M20 9h2" />
        <path d="M9 2v2" />
        <path d="M9 20v2" />
      </svg>
    ),
    description: 'Develops decision-making algorithms, perception pipelines, and machine learning methods for complex real-world tasks.',
  },
  {
    name: 'Astrobio & Science',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M6 18h8" />
        <path d="M3 22h18" />
        <path d="M14 22a7 7 0 1 0 0-14h-1" />
        <path d="M9 14h2" />
        <path d="M9 12a2 2 0 0 1-2-2V6h6v4a2 2 0 0 1-2 2Z" />
        <path d="M12 6V3a1 1 0 0 0-1-1H9a1 1 0 0 0-1 1v3" />
      </svg>
    ),
    description: 'Explores experimental design, measurement, and sample analysis through science-focused research and lab work.',
  },
  {
    name: 'Unmanned Aerial Vehicles',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
      </svg>
    ),
    description: 'Studies aerial systems, flight integration, and sensing to extend the team’s engineering reach beyond the ground platform.',
  },
  {
    name: 'Management & Outreach',
    icon: (
      <svg {...iconProps} aria-hidden>
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        <path d="M12 11h4" />
        <path d="M12 16h4" />
        <path d="M8 11h.01" />
        <path d="M8 16h.01" />
      </svg>
    ),
    description: 'Coordinates partnerships, logistics, and student engagement while building leadership, communication, and project management experience.',
  },
  {
    name: 'Research & Documentation',
    icon: (
      <svg {...iconProps} aria-hidden>
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20" />
      </svg>
    ),
    description: 'Turns technical work into clear reports, presentations, and published knowledge that support learning and future engineering growth.',
  },
]

export default async function JoinPage() {
  const recruitment = await sanityFetch<RecruitmentConfig | null>(RECRUITMENT_CONFIG_QUERY)

  const status = recruitment?.status ?? 'closed'
  const config = STATUS_CONFIG[status]

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <Reveal>
            <SectionHeader
              kicker="Recruitment"
              title="Join the Team"
              description="We are a multidisciplinary engineering team where students build practical expertise across design, fabrication, electronics, software, autonomy, research, and outreach. Our recruitment process helps us find people who are curious, collaborative, and ready to learn through project-based work, mentorship, and technical evaluation."
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mt-7 flex flex-col gap-4">
              <div
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${config.color}`}
              >
                <span className="h-2 w-2 rounded-full bg-current" aria-hidden />
                {config.label}
                {recruitment?.closingDate && status === 'open' && (
                  <span className="font-normal opacity-75">
                    · Deadline: {new Date(recruitment.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                  </span>
                )}
              </div>
              {recruitment?.openingMessage && (
                <p className="max-w-2xl text-base text-text-muted leading-relaxed text-pretty">
                  {recruitment.openingMessage}
                </p>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Sub-teams + FAQ */}
      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          <div className="grid gap-12 lg:grid-cols-3 lg:gap-14">
            {/* Sub-teams */}
            <div className="lg:col-span-2">
              <Reveal>
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <span className="hud-label text-primary">Sub-teams</span>
                </div>
                <p className="max-w-2xl text-sm text-text-muted leading-relaxed text-pretty">
                  Each group contributes to a different part of the engineering workflow, from hands-on prototyping and testing to communication, scientific analysis, and community impact. Together, these teams give students exposure to system-level thinking and real engineering practice.
                </p>
              </Reveal>

              <Reveal stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                {SUBTEAMS.map((team) => (
                  <div
                    key={team.name}
                    className="group relative rounded-card border border-divider bg-surface-raised p-6 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-divider bg-primary-highlight text-primary transition-colors group-hover:border-primary/40">
                        {team.icon}
                      </span>
                      <h3 className="font-display font-bold text-base text-text tracking-tight">{team.name}</h3>
                    </div>
                    <p className="text-sm text-text-muted leading-relaxed text-pretty">{team.description}</p>
                  </div>
                ))}
              </Reveal>

              {status === 'open' && (
                <Reveal delay={0.1}>
                  <a
                    href="/join/apply"
                    className="mt-10 inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                  >
                    Apply Now
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </Reveal>
              )}
            </div>

            {/* FAQ */}
            {recruitment?.faqItems && recruitment.faqItems.length > 0 && (
              <div>
                <Reveal>
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                    <span className="hud-label text-primary">FAQ</span>
                  </div>
                </Reveal>
                <Reveal stagger className="flex flex-col gap-4">
                  {recruitment.faqItems.map((item, i) => (
                    <div
                      key={i}
                      className="rounded-card border border-divider bg-surface-raised p-5 transition-colors hover:border-primary/40"
                    >
                      <h3 className="font-display font-semibold text-sm text-text mb-2">{item.question}</h3>
                      <p className="text-sm text-text-muted leading-relaxed text-pretty">{item.answer}</p>
                    </div>
                  ))}
                </Reveal>
              </div>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

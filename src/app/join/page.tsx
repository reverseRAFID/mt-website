import { PageLayout } from '@/components/layout/PageLayout'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { RECRUITMENT_CONFIG_QUERY } from '@/sanity/lib/queries'
import type { RecruitmentConfig } from '@/sanity/lib/types'

export const metadata: Metadata = { title: 'Join the Team' }

const STATUS_CONFIG = {
  open: { label: 'Applications Open', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800' },
  'under-review': { label: 'Under Review', color: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800' },
  closed: { label: 'Applications Closed', color: 'bg-surface-2 text-text-faint border-divider' },
}

const SUBTEAMS = [
  { name: 'Mechanical & CAD', icon: '⚙️', description: 'Designs and prototypes structural systems, fixtures, and mechanisms with a focus on manufacturability, reliability, and hands-on iteration.' },
  { name: 'Electronics', icon: '⚡', description: 'Builds embedded hardware, power distribution, and sensing platforms while developing the practical electronics skills that support field-ready systems.' },
  { name: 'Controls & Software', icon: '💻', description: 'Creates the software tools, automation logic, and control workflows that connect ideas into dependable engineered behavior.' },
  { name: 'Network & Vision', icon: '📡', description: 'Works on communication, imaging, and data flow so the team can observe, coordinate, and make decisions in real time.' },
  { name: 'AI & Autonomous', icon: '🏎', description: 'Develops decision-making algorithms, perception pipelines, and machine learning methods for complex real-world tasks.' },
  { name: 'Astrobio & Science', icon: '🔬', description: 'Explores experimental design, measurement, and sample analysis through science-focused research and lab work.' },
  { name: 'Unmanned Aerial Vehicles', icon: '✈', description: 'Studies aerial systems, flight integration, and sensing to extend the team’s engineering reach beyond the ground platform.' },
  { name: 'Management & Outreach', icon: '📋', description: 'Coordinates partnerships, logistics, and student engagement while building leadership, communication, and project management experience.' },
  { name: 'Research & Documentation', icon: '📚', description: 'Turns technical work into clear reports, presentations, and published knowledge that support learning and future engineering growth.' },
]

export default async function JoinPage() {
  const recruitment = await sanityFetch<RecruitmentConfig | null>(RECRUITMENT_CONFIG_QUERY)

  const status = recruitment?.status ?? 'closed'
  const config = STATUS_CONFIG[status]

  return (
    <PageLayout>
      <div className="bg-[#111111] border-b border-[#2e2e2e]">
        <div className="section-container py-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 text-xs font-semibold uppercase tracking-widest text-orange-500/60">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">Recruitment</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-orange-500 mt-4 mb-4">Join the Team</h1>
          <p className="text-white/70 text-lg mb-6 leading-relaxed">
            We are a multidisciplinary engineering team where students build practical expertise across design, fabrication, electronics, software, autonomy, research, and outreach. Our recruitment process helps us find people who are curious, collaborative, and ready to learn through project-based work, mentorship, and technical evaluation.
          </p>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold ${config.color}`}>
            <span className="w-2 h-2 rounded-full bg-current" />
            {config.label}
            {recruitment?.closingDate && status === 'open' && (
              <span className="font-normal opacity-75">
                · Deadline: {new Date(recruitment.closingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
              </span>
            )}
          </div>
          {recruitment?.openingMessage && (
            <p className="text-text-muted text-lg max-w-2xl mt-4">{recruitment.openingMessage}</p>
          )}
        </div>
      </div>

      <div className="section-container py-14">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Sub-teams */}
          <div className="lg:col-span-2">
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Sub-teams</h2>
            <p className="text-text-muted text-sm mb-6 leading-relaxed">
              Each group contributes to a different part of the engineering workflow, from hands-on prototyping and testing to communication, scientific analysis, and community impact. Together, these teams give students exposure to system-level thinking and real engineering practice.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mb-10">
              {SUBTEAMS.map((team) => (
                <div key={team.name} className="bg-surface rounded-xl border border-orange-500/30 border-divider p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{team.icon}</span>
                    <h3 className="font-display font-bold text-base text-text">{team.name}</h3>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed">{team.description}</p>
                </div>
              ))}
            </div>

            {status === 'open' && (
              <a
                href="/join/apply"
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold transition-colors"
              >
                Apply Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </a>
            )}
          </div>

          {/* FAQ */}
          {recruitment?.faqItems && recruitment.faqItems.length > 0 && (
            <div>
              <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">FAQ</h2>
              <div className="flex flex-col gap-4">
                {recruitment.faqItems.map((item, i) => (
                  <div key={i} className="bg-surface rounded-xl border border-divider p-5">
                    <h3 className="font-display font-semibold text-sm text-text mb-2">{item.question}</h3>
                    <p className="text-sm text-text-muted leading-relaxed">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  )
}

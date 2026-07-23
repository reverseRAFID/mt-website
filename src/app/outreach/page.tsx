import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionHeader } from '@/components/ui/SectionHeader'

export const metadata: Metadata = { title: 'STEM Outreach' }

const PROGRAMS: { name: string; description: string; icon: ReactNode }[] = [
  {
    name: 'Rover Demo Days',
    description: 'We bring our rovers to schools and universities across Dhaka for live demonstrations — sparking interest in robotics and space exploration among young students.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 8V4H8" />
        <rect width="16" height="12" x="4" y="8" rx="2" />
        <path d="M2 14h2M20 14h2M15 13v2M9 13v2" />
      </svg>
    ),
  },
  {
    name: 'BRACU Open Day',
    description: 'Every semester, we host an open lab at BRAC University where prospective students and the public can interact with our rovers, try ROS demos, and meet the team.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" />
        <path d="M22 10v6" />
        <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />
      </svg>
    ),
  },
  {
    name: 'RoboClub Workshops',
    description: 'Free workshops for BRACU students on ROS2, SolidWorks, PCB design, and embedded systems — skills that are core to our rover development pipeline.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
      </svg>
    ),
  },
  {
    name: 'Space & Robotics Competition Guidance',
    description: 'We mentor student teams applying to FIRST, WRO, and local robotics competitions — sharing lessons learned from competing internationally.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    ),
  },
  {
    name: 'Social Media & Science Communication',
    description: 'Our outreach sub-team produces educational content about Mars exploration, astrobiology, and robotics for our 10,000+ social media followers.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 10a7.31 7.31 0 0 0 10 10Z" />
        <path d="m9 15 3-3" />
        <path d="M17 13a6 6 0 0 0-6-6" />
        <path d="M21 13A10 10 0 0 0 11 3" />
      </svg>
    ),
  },
]

export default function OutreachPage() {
  return (
    <PageLayout>
      <PageHero
        kicker="Community"
        title="STEM Outreach"
        description="Beyond competitions, we're committed to growing a culture of engineering and science in Bangladesh — one workshop, demo, and conversation at a time."
        watermark="OUTREACH"
      />

      <section className="relative overflow-hidden border-b border-divider py-20 lg:py-28">
        <GhostText text="IMPACT" drift="right" />
        <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-[0.35]" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[320px] w-[480px] -translate-x-1/2 rounded-full glow-orange blur-[120px] opacity-40"
        />

        <div className="section-container relative">
          <Reveal>
            <SectionHeader
              index="01"
              kicker="Programs"
              title="Where the lab meets the public"
              description="Outreach runs year-round — live rover demonstrations, open labs, free technical workshops, and the science communication that carries engineering culture across Bangladesh."
              className="mb-12 lg:mb-16"
            />
          </Reveal>

          <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {PROGRAMS.map((program, i) => (
              <div
                key={program.name}
                className="group surface-lift relative flex flex-col rounded-card border border-divider bg-surface-raised p-6 hover:border-primary/40"
              >
                <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

                <div className="mb-5 flex items-start justify-between gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-primary/20 bg-primary-highlight text-primary transition-colors duration-300 group-hover:border-primary/50">
                    {program.icon}
                  </span>
                  <span
                    aria-hidden
                    className="hud-label text-text-faint transition-colors duration-300 group-hover:text-primary/60"
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <h2 className="font-display font-bold text-lg lg:text-xl text-text tracking-tight text-balance group-hover:text-primary transition-colors duration-150 mb-2">
                  {program.name}
                </h2>
                <p className="text-sm text-text-muted leading-relaxed text-pretty">{program.description}</p>
              </div>
            ))}
          </Reveal>

          {/* CTA */}
          <Reveal className="mt-12 lg:mt-16">
            <div className="relative overflow-hidden rounded-card border border-primary/20 bg-primary-highlight p-8 lg:p-10">
              <CornerTicks className="text-primary/40" />
              <div className="relative max-w-2xl">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <span className="hud-label text-primary">Host an Event</span>
                </div>
                <h2 className="font-display font-bold text-2xl lg:text-3xl text-text tracking-tight mb-3 text-balance">
                  Want us at your school or event?
                </h2>
                <p className="text-text-muted leading-relaxed mb-6 text-pretty">
                  We love bringing our rovers out to inspire the next generation of engineers. If you&apos;d like to host a demo day, workshop, or talk — get in touch.
                </p>
                <Link
                  href="/contact"
                  className="group/cta inline-flex items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                >
                  Get in Touch
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-300 group-hover/cta:translate-x-1">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </PageLayout>
  )
}

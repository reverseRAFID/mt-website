import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'STEM Outreach' }

const PROGRAMS = [
  {
    name: 'Rover Demo Days',
    description: 'We bring our rovers to schools and universities across Dhaka for live demonstrations — sparking interest in robotics and space exploration among young students.',
    icon: '🤖',
  },
  {
    name: 'BRACU Open Day',
    description: 'Every semester, we host an open lab at BRAC University where prospective students and the public can interact with our rovers, try ROS demos, and meet the team.',
    icon: '🏫',
  },
  {
    name: 'RoboClub Workshops',
    description: 'Free workshops for BRACU students on ROS2, SolidWorks, PCB design, and embedded systems — skills that are core to our rover development pipeline.',
    icon: '🔧',
  },
  {
    name: 'Space & Robotics Competition Guidance',
    description: 'We mentor student teams applying to FIRST, WRO, and local robotics competitions — sharing lessons learned from competing internationally.',
    icon: '🚀',
  },
  {
    name: 'Social Media & Science Communication',
    description: 'Our outreach sub-team produces educational content about Mars exploration, astrobiology, and robotics for our 10,000+ social media followers.',
    icon: '📡',
  },
]

export default function OutreachPage() {
  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Community</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">STEM Outreach</h1>
          <p className="text-text-muted text-lg max-w-2xl">
            Beyond competitions, we&apos;re committed to growing a culture of engineering and science in Bangladesh — one workshop, demo, and conversation at a time.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {PROGRAMS.map((program) => (
            <div key={program.name} className="bg-surface rounded-xl border border-divider p-6">
              <span className="text-3xl mb-4 block">{program.icon}</span>
              <h2 className="font-display font-bold text-lg text-text mb-2">{program.name}</h2>
              <p className="text-sm text-text-muted leading-relaxed">{program.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-primary-highlight border border-primary/20 rounded-2xl p-8">
          <div className="max-w-2xl">
            <h2 className="font-display font-bold text-2xl text-text mb-3">Want us at your school or event?</h2>
            <p className="text-text-muted mb-6">
              We love bringing our rovers out to inspire the next generation of engineers. If you&apos;d like to host a demo day, workshop, or talk — get in touch.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold transition-colors"
            >
              Get in Touch
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

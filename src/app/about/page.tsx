import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeLogo } from '@/components/ui/ThemeLogo'

export const metadata: Metadata = { title: 'About Us' }

const STATS = [
  { value: '2017', label: 'Founded' },
  { value: '7+', label: 'Rovers Built' },
  { value: '3', label: 'Competitions' },
  { value: '60+', label: 'Members' },
]

const TIMELINE = [
  { year: '2017', event: 'Team founded at BRAC University, Dhaka' },
  { year: '2018', event: 'First rover prototype — Mongol-Tori I' },
  { year: '2020', event: 'First international qualification — IRC' },
  { year: '2022', event: 'Debut at University Rover Challenge (URC), Utah' },
  { year: '2023', event: 'Competed at ERC in Poland alongside URC' },
  { year: '2024', event: 'URC 11th place — best result to date' },
]

export default function AboutPage() {
  return (
    <PageLayout>
      <div className="bg-surface border-b border-orange-500/30 border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500 text-text-faint">Who We Are</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-4">About Us</h1>
          <p className="text-text-muted text-lg max-w-2xl leading-relaxed mb-6">
            Mongol-Tori is BRAC University&apos;s competitive Mars rover team — a student-run engineering club that designs, builds, and races rovers at international competitions.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-text-faint uppercase tracking-wide">A team of</span>
            <ThemeLogo
              lightSrc="/bracu-logo.svg"
              darkSrc="/bracu-logo-dark.svg"
              alt="BRAC University"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
          </div>
        </div>
      </div>

      <div className="section-container py-14">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-16">
          {STATS.map((stat) => (
            <div key={stat.label} className="bg-surface rounded-xl border border-orange-500 border-divider p-6 text-center">
              <p className="font-display font-bold text-4xl text-primary mb-1">{stat.value}</p>
              <p className="text-sm text-text-muted">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-16 mb-16">
          {/* Mission */}
          <div>
            <h2 className="font-display font-bold text-2xl text-text mb-4 accent-line">Mission</h2>
            <p className="text-text-muted leading-relaxed mb-4">
              We exist to push the boundaries of what student engineers in Bangladesh can build. Through the rigor of international rover competitions — URC, IRC, and ERC — we train the next generation of roboticists, aerospace engineers, and system designers.
            </p>
            <p className="text-text-muted leading-relaxed">
              Every rover we build is a learning platform: a system of mechanical ingenuity, embedded electronics, and autonomous software that must survive real desert terrain and complete science missions far from human reach.
            </p>
          </div>

          {/* Timeline */}
          <div>
            <h2 className="font-display font-bold text-2xl text-text mb-4 accent-line">History</h2>
            <div className="flex flex-col gap-4">
              {TIMELINE.map(({ year, event }) => (
                <div key={year} className="flex items-start gap-4">
                  <span className="font-mono text-xs text-primary font-semibold shrink-0 mt-0.5 w-10">{year}</span>
                  <p className="text-sm text-text-muted leading-relaxed">{event}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4">
          <Link href="/team" className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors">
            Meet the Team
          </Link>
          <Link href="/rovers" className="inline-flex items-center gap-2 border border-divider text-text-muted hover:text-primary hover:border-primary px-5 py-2.5 rounded-md font-semibold text-sm transition-colors">
            See Our Rovers
          </Link>
        </div>
      </div>
    </PageLayout>
  )
}

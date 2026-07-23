import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Testimonials } from '@/components/sections/Testimonials'
import { sanityFetch } from '@/sanity/lib/client'
import { FEATURED_TESTIMONIALS_QUERY } from '@/sanity/lib/queries'
import type { Testimonial } from '@/sanity/lib/types'

export const metadata: Metadata = { title: 'About Us' }

const STATS = [
  { to: 2017, suffix: '', label: 'Founded' },
  { to: 7, suffix: '+', label: 'Rovers Built' },
  { to: 3, suffix: '', label: 'Competitions' },
  { to: 60, suffix: '+', label: 'Members' },
]

const TIMELINE = [
  { year: '2017', event: 'Team founded at BRAC University, Dhaka' },
  { year: '2018', event: 'First rover prototype — Mongol-Tori I' },
  { year: '2020', event: 'First international qualification — IRC' },
  { year: '2022', event: 'Debut at University Rover Challenge (URC), Utah' },
  { year: '2023', event: 'Competed at ERC in Poland alongside URC' },
  { year: '2024', event: 'URC 11th place — best result to date' },
]

export default async function AboutPage() {
  const testimonials = await sanityFetch<Testimonial[]>(FEATURED_TESTIMONIALS_QUERY)

  return (
    <PageLayout>
      <PageHero
        index="00"
        kicker="Who We Are"
        title="About Us"
        description="Mongol-Tori is BRAC University's competitive Mars rover team — a student-run engineering club that designs, builds, and races rovers at international competitions."
        watermark="MISSION"
      >
        <Reveal>
          <div className="mt-6 flex items-center gap-3">
            <span className="hud-label text-text-faint">A team of</span>
            <ThemeLogo
              lightSrc="/bracu-logo.svg"
              darkSrc="/bracu-logo-dark.svg"
              alt="BRAC University"
              width={100}
              height={28}
              className="h-7 w-auto"
            />
          </div>
        </Reveal>
      </PageHero>

      <section className="relative overflow-hidden py-20 lg:py-28">
        <GhostText text="ORIGIN" drift="left" />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full glow-orange opacity-50 blur-[120px]"
        />

        <div className="section-container relative z-10">
          {/* Stats */}
          <Reveal className="mb-6">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
              <span className="hud-label text-primary">
                <span className="text-text-faint">01 / </span>By The Numbers
              </span>
            </div>
          </Reveal>

          <Reveal stagger className="mb-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className="group surface-lift relative rounded-card border border-divider bg-surface-raised p-6 text-center hover:border-primary/40"
              >
                <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" />
                <Counter
                  to={stat.to}
                  suffix={stat.suffix}
                  className="display-figure nums block text-4xl text-primary lg:text-5xl"
                />
                <p className="hud-label mt-3 text-text-faint">{stat.label}</p>
              </div>
            ))}
          </Reveal>

          <div className="mb-16 grid gap-12 lg:grid-cols-2 lg:gap-16">
            {/* Mission */}
            <Reveal>
              <div className="mb-5 flex items-center gap-2.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                <span className="hud-label text-primary">
                  <span className="text-text-faint">02 / </span>Mission
                </span>
              </div>
              <h2 className="mb-4 text-balance font-display text-2xl font-bold tracking-tight text-text lg:text-3xl">
                Pushing what student engineers can build
              </h2>
              <p className="mb-4 text-pretty leading-relaxed text-text-muted">
                We exist to push the boundaries of what student engineers in Bangladesh can build.
                Through the rigor of international rover competitions — URC, IRC, and ERC — we train
                the next generation of roboticists, aerospace engineers, and system designers.
              </p>
              <p className="text-pretty leading-relaxed text-text-muted">
                Every rover we build is a learning platform: a system of mechanical ingenuity,
                embedded electronics, and autonomous software that must survive real desert terrain
                and complete science missions far from human reach.
              </p>
            </Reveal>

            {/* Timeline */}
            <div>
              <Reveal>
                <div className="mb-5 flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <span className="hud-label text-primary">
                    <span className="text-text-faint">03 / </span>History
                  </span>
                </div>
              </Reveal>
              <Reveal as="ol" stagger className="relative ml-1 border-l border-divider">
                {TIMELINE.map(({ year, event }) => (
                  <li key={year} className="group relative pb-6 pl-6 last:pb-0">
                    <span
                      aria-hidden
                      className="absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-none border-2 border-primary bg-bg transition-colors duration-300 group-hover:bg-primary"
                    />
                    <div className="hud-label nums mb-1 text-primary">{year}</div>
                    <p className="text-pretty text-sm leading-relaxed text-text-muted transition-colors duration-300 group-hover:text-text">
                      {event}
                    </p>
                  </li>
                ))}
              </Reveal>
            </div>
          </div>

          {/* CTAs */}
          <Reveal className="flex flex-wrap gap-4">
            <Link
              href="/team"
              className="group inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              Meet the Team
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
                className="transition-transform duration-300 group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/rovers"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            >
              See Our Rovers
            </Link>
          </Reveal>
        </div>
      </section>

      {testimonials?.length > 0 && (
        <Testimonials
          testimonials={testimonials}
          index="04"
          title="What our advisors say"
          description="The faculty and mentors who back Mongol-Tori on what the team is building and where it's headed."
        />
      )}
    </PageLayout>
  )
}

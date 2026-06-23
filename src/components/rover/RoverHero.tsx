'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { BlueprintBackdrop } from './BlueprintBackdrop'
import type { RoverSpecs } from '@/sanity/lib/types'

interface HeroStat {
  label: string
  value: string
}

interface RoverHeroProps {
  name: string
  year: number
  tagline?: string
  overview?: string
  isFlagship?: boolean
  teamLead?: string
  imageUrl?: string
  specs?: RoverSpecs
  competition?: {
    shortName: string
    year: number
    location?: string
    result?: string
    rank?: number
    slug?: { current: string }
  }
  pdfUrl?: string
  hasVideo?: boolean
}

function buildStats(specs?: RoverSpecs): HeroStat[] {
  if (!specs) return []
  const out: HeroStat[] = []
  if (specs.weight) out.push({ label: 'Mass', value: specs.weight })
  if (specs.driveSystem) out.push({ label: 'Drive', value: specs.driveSystem })
  if (specs.dof !== undefined) out.push({ label: 'Arm', value: `${specs.dof}-DOF` })
  if (specs.payload) out.push({ label: 'Payload', value: specs.payload })
  if (specs.autonomy) out.push({ label: 'Autonomy', value: specs.autonomy })
  return out.slice(0, 4)
}

export function RoverHero({
  name,
  year,
  tagline,
  overview,
  isFlagship,
  teamLead,
  imageUrl,
  specs,
  competition,
  pdfUrl,
  hasVideo,
}: RoverHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const words = name.split(' ')
  const stats = buildStats(specs)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || prefersReducedMotion()) return
      const q = gsap.utils.selector(root)

      // Entrance — staged rise.
      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } })
      tl.from(q('[data-hero-strip]'), { opacity: 0, y: -10, duration: 0.5 })
        .from(q('[data-hero-kicker]'), { opacity: 0, y: 14, duration: 0.5 }, '-=0.2')
        .from(q('[data-hero-word]'), { yPercent: 118, duration: 0.9, stagger: 0.09 }, '-=0.15')
        .from(q('[data-hero-tagline]'), { opacity: 0, y: 16, duration: 0.6 }, '-=0.45')
        .from(q('[data-hero-stat]'), { opacity: 0, y: 18, duration: 0.5, stagger: 0.06 }, '-=0.35')
        .from(q('[data-hero-cta]'), { opacity: 0, y: 14, duration: 0.5, stagger: 0.06 }, '-=0.35')
        .from(q('[data-hero-cue]'), { opacity: 0, duration: 0.6 }, '-=0.2')

      // Parallax — media drifts up and dims as the hero scrolls away.
      if (mediaRef.current) {
        gsap.fromTo(
          mediaRef.current,
          { yPercent: -8, scale: 1.12 },
          {
            yPercent: 10,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
          }
        )
      }
      // Content lifts slightly faster than the media for depth.
      gsap.to(q('[data-hero-content]'), {
        yPercent: -14,
        opacity: 0.35,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
    },
    { scope: rootRef }
  )

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-[88svh] flex-col justify-end overflow-hidden border-b border-divider lg:min-h-screen"
    >
      {/* Media layer */}
      <div ref={mediaRef} className="absolute inset-0 z-0">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${name} rover`}
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        ) : (
          <BlueprintBackdrop label={`${name.toUpperCase()} // BLUEPRINT`} watermark={name.split(' ')[0]} />
        )}
      </div>

      {/* Legibility scrims */}
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-t from-bg via-bg/80 to-bg/10" />
      <div aria-hidden className="absolute inset-0 z-[1] bg-gradient-to-r from-bg/85 via-bg/30 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-0 z-[2] tech-grid-sm opacity-30 mask-radial-fade" />
      <CornerTicks className="z-[3] hidden text-primary/30 sm:block" size="md" />

      {/* Top telemetry strip */}
      <div
        data-hero-strip
        className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8"
      >
        <Link href="/rovers" className="hud-label inline-flex items-center gap-2 text-text-faint transition-colors hover:text-primary">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Fleet
        </Link>
        <span className="hud-label nums hidden items-center gap-2 text-text-faint sm:inline-flex">
          <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
          REC · {competition ? `${competition.shortName} ${competition.year}` : `URC ${year}`}
        </span>
      </div>

      {/* Foreground content */}
      <div data-hero-content className="section-container relative z-10 pb-14 pt-28 sm:pb-16 lg:pb-20">
        <div data-hero-kicker className="mb-5 flex flex-wrap items-center gap-2.5">
          <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
          <span className="hud-label text-primary">Rover Profile</span>
          <span className="hud-label nums text-text-faint">/ {year}</span>
          {isFlagship && (
            <span className="inline-flex items-center gap-1.5 rounded-none bg-primary px-2 py-0.5">
              <span className="hud-label text-[9px] text-on-accent">★ Current Flagship</span>
            </span>
          )}
        </div>

        <h1 className="font-display text-[clamp(2.75rem,11vw,8.5rem)] font-bold uppercase leading-[0.86] tracking-[-0.03em] text-text">
          {words.map((w, i) => (
            <span key={`${w}-${i}`} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
              <span data-hero-word className="inline-block">
                {w}
              </span>
            </span>
          ))}
        </h1>

        {(tagline || overview) && (
          <p data-hero-tagline className="mt-5 max-w-2xl text-pretty text-base leading-relaxed text-text-muted sm:text-lg lg:text-xl">
            {tagline ?? overview}
          </p>
        )}

        {/* Stat rail */}
        {stats.length > 0 && (
          <dl className="mt-9 grid max-w-3xl grid-cols-2 gap-px overflow-hidden rounded-card border border-divider bg-divider sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} data-hero-stat className="bg-surface-raised/85 px-4 py-3.5 backdrop-blur-sm">
                <dt className="hud-label text-text-faint">{s.label}</dt>
                <dd className="mt-1.5 font-mono text-sm font-medium leading-snug text-text nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center gap-3">
          {hasVideo && (
            <a
              data-hero-cta
              href="#sar-video"
              className="group inline-flex items-center gap-2.5 rounded-none bg-primary px-5 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
              Watch SAR Video
            </a>
          )}
          {competition?.slug && (
            <Link
              data-hero-cta
              href={`/competitions/${competition.slug.current}`}
              className="group inline-flex items-center gap-2 rounded-none border border-border px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              Competition
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
          {pdfUrl && (
            <a
              data-hero-cta
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-none border border-border px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
              </svg>
              SAR PDF
            </a>
          )}
          {teamLead && (
            <span data-hero-cta className="hud-label hidden items-center gap-2 pl-2 text-text-faint sm:inline-flex">
              <span className="text-text-faint/60">LEAD //</span> {teamLead}
            </span>
          )}
        </div>
      </div>

      {/* Scroll cue */}
      <div data-hero-cue className="pointer-events-none absolute bottom-4 left-1/2 z-10 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
        <span className="hud-label text-text-faint">Scroll</span>
        <span className="relative flex h-9 w-[1px] overflow-hidden bg-divider">
          <span className="absolute inset-x-0 top-0 h-3 bg-primary motion-safe:animate-[mt-scan_1.8s_ease-in-out_infinite]" />
        </span>
      </div>
    </section>
  )
}

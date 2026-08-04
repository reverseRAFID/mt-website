'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Counter } from '@/components/motion/Counter'
import { Scramble } from '@/components/motion/Scramble'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SUBTEAM_COLORS } from '@/lib/subteam-style'
import { ghostStyle } from '@/lib/ghost-type'

export interface HeroStat {
  label: string
  value: number
  suffix?: string
}

interface MemberHeroProps {
  name: string
  role?: string | null
  tagline?: string | null
  subTeamKey?: string | null
  subLabel?: string
  isAlumni?: boolean | null
  currentOrg?: string | null
  photoUrl?: string | null
  idCode: string
  stats: HeroStat[]
}

/**
 * Cinematic member dossier header. Avatar reveals behind a scan wipe, the name
 * rises word-by-word, the role decodes from telemetry glyphs, and stat tiles
 * count up — all on a parallax watermark backdrop. Every animated element is
 * hidden via JS only, so the dossier is fully legible under reduced-motion or
 * with JS disabled.
 */
export function MemberHero({
  name,
  role,
  tagline,
  subTeamKey,
  subLabel,
  isAlumni,
  currentOrg,
  photoUrl,
  idCode,
  stats,
}: MemberHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const firstName = name.split(' ')[0] || name
  const words = name.split(' ')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || prefersReducedMotion()) return
      const q = gsap.utils.selector(root)

      const tl = gsap.timeline({ delay: 0.1, defaults: { ease: 'power3.out' } })

      tl.from(q('[data-hero-strip]'), { opacity: 0, y: -8, duration: 0.5 })
        // Avatar scan reveal — photo wipes in top→bottom, a bright line tracks the edge.
        // fromTo (immediateRender) applies the clipped start state at creation so the
        // eager `priority` avatar never flashes fully visible before the wipe begins.
        .set(q('[data-hero-scan]'), { top: '0%', opacity: 0 }, 0.15)
        .fromTo(
          q('[data-hero-photo]'),
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.95, immediateRender: true },
          0.2
        )
        .to(q('[data-hero-scan]'), { opacity: 1, duration: 0.12 }, 0.2)
        .to(q('[data-hero-scan]'), { top: '100%', duration: 0.95 }, 0.2)
        .to(q('[data-hero-scan]'), { opacity: 0, duration: 0.25 }, 0.95)
        // Identity column
        .from(q('[data-hero-chip]'), { opacity: 0, y: 12, stagger: 0.08, duration: 0.5 }, 0.35)
        .from(q('[data-hero-word]'), { yPercent: 118, opacity: 0, stagger: 0.08, duration: 0.85 }, 0.45)
        .from(q('[data-hero-role]'), { opacity: 0, y: 12, duration: 0.5 }, '-=0.5')
        .from(q('[data-hero-tagline]'), { opacity: 0, y: 12, duration: 0.55 }, '-=0.35')
        .from(q('[data-hero-stat]'), { opacity: 0, y: 16, stagger: 0.07, duration: 0.5 }, '-=0.25')

      // Parallax watermark drift
      if (markRef.current) {
        gsap.fromTo(
          markRef.current,
          { yPercent: 10 },
          {
            yPercent: -16,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
          }
        )
      }
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} className="relative overflow-hidden border-b border-divider py-12 sm:py-16 lg:py-20">
      <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
      <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[380px] w-[380px] rounded-full glow-orange blur-[120px] opacity-50" />

      {/* Parallax first-name watermark */}
      <div
        ref={markRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span style={ghostStyle(firstName)} className="ghost-word text-text/[0.045]">
          {firstName}
        </span>
      </div>

      {/* Scan sweep */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="h-full w-full motion-safe:animate-[mt-scan_9s_linear_infinite]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60" />
        </div>
      </div>

      {/* Section-level frame — matches the canonical PageHero header convention */}
      <CornerTicks className="hidden text-primary/20 sm:block" size="md" />

      <div className="section-container relative z-10">
        {/* HUD strip — breadcrumb + ID */}
        <div data-hero-strip className="mb-8 flex items-center justify-between gap-4 border-b border-divider/70 pb-4">
          <nav className="hud-label flex items-center gap-2 text-text-faint">
            <Link href="/team" className="rounded-none underline-offset-4 transition-colors hover:text-primary focus-visible:text-primary focus-visible:underline focus-visible:outline-none">Team</Link>
            <span aria-hidden>/</span>
            <span className="text-text">{name}</span>
          </nav>
          <span className="hud-label nums hidden items-center gap-2 text-text-faint sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
            ID // <Scramble text={idCode} delay={0.4} duration={0.9} />
          </span>
        </div>

        <div className="flex flex-col items-center gap-7 text-center sm:flex-row sm:items-end sm:gap-9 sm:text-left">
          {/* Framed avatar */}
          <div className="relative shrink-0 rounded-card border border-divider bg-surface-2 p-1.5">
            <CornerTicks className="text-primary/40" size="md" />
            <div className="relative h-40 w-40 overflow-hidden bg-surface-2 scanlines sm:h-48 sm:w-48">
              {photoUrl ? (
                <Image
                  data-hero-photo
                  src={photoUrl}
                  alt={name}
                  fill
                  sizes="192px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div data-hero-photo className="absolute inset-0 flex items-center justify-center tech-grid-sm opacity-50">
                  <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-text-faint" aria-hidden>
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
              {/* scan line tracking the reveal edge */}
              <div
                data-hero-scan
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 z-10 h-8 -translate-y-1/2 opacity-0"
                style={{
                  background:
                    'linear-gradient(to bottom, transparent, rgba(var(--primary-rgb),0.55), transparent)',
                }}
              />
            </div>
          </div>

          {/* Identity */}
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              {subLabel && (
                <span data-hero-chip className={`hud-label rounded-none px-2.5 py-1 ${subTeamKey ? SUBTEAM_COLORS[subTeamKey] ?? 'bg-surface-2 text-text-faint' : 'bg-surface-2 text-text-faint'}`}>
                  {subLabel}
                </span>
              )}
              <span data-hero-chip className={`hud-label inline-flex items-center gap-1.5 rounded-none px-2.5 py-1 ${isAlumni ? 'bg-surface-2 text-text-faint' : 'bg-primary-highlight text-primary'}`}>
                <span className={`h-1.5 w-1.5 rounded-none ${isAlumni ? 'bg-text-faint' : 'bg-primary'}`} aria-hidden />
                {isAlumni ? 'Alumni' : 'Active'}
              </span>
            </div>

            <h1 className="font-display text-4xl font-bold leading-[0.98] tracking-tight text-text text-balance sm:text-5xl lg:text-6xl">
              {words.map((w, i) => (
                <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.08em] align-bottom">
                  <span data-hero-word className="inline-block">{w}</span>
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {role && (
              <p data-hero-role className="mt-3">
                <Scramble text={role} className="hud-label text-primary" delay={0.7} duration={0.9} />
              </p>
            )}
            {tagline && (
              <p data-hero-tagline className="mt-3 max-w-xl text-base leading-relaxed text-text-muted text-pretty">
                {tagline}
              </p>
            )}
            {currentOrg && (
              <p data-hero-tagline className="mt-2.5 text-sm text-text-faint">
                {isAlumni ? 'Now at' : 'Currently at'} <span className="text-text-muted">{currentOrg}</span>
              </p>
            )}
          </div>
        </div>

        {/* Stat tiles */}
        {stats.length > 0 && (
          <div className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} data-hero-stat className="relative rounded-card border border-divider bg-surface-raised px-4 py-3.5">
                <CornerTicks className="text-primary/20" />
                <div className="font-display text-2xl font-bold text-primary nums sm:text-3xl">
                  <Counter to={s.value} suffix={s.suffix ?? ''} />
                </div>
                <div className="hud-label mt-1 text-text-faint">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Counter } from '@/components/motion/Counter'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface PageHeroProps {
  index?: string
  kicker: string
  title: string
  description?: ReactNode
  /** Optional big readout on the right (desktop). */
  stat?: { value: number; suffix?: string; label: string }
  /** Faded oversized word behind the title. Defaults to the title. */
  watermark?: string
  /** Mono telemetry readout shown at the right of the top strip (desktop). */
  coords?: string
  children?: ReactNode
}

/**
 * Cinematic, reusable page header — the canonical header for every inner page.
 * The title reveals word-by-word on mount; a giant dimmed watermark sits behind
 * it and is scroll-scrubbed (parallax) for depth; a thin HUD telemetry strip
 * (blinking node + mono coordinates + scan sweep) adds the mission-control vibe.
 * Degrades to static, fully-legible content under reduced-motion. Client island —
 * safe to drop inside server components.
 */
export function PageHero({
  index,
  kicker,
  title,
  description,
  stat,
  watermark,
  coords = 'LAT 23.78°N · LON 90.41°E',
  children,
}: PageHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const markRef = useRef<HTMLDivElement>(null)
  const words = title.split(' ')
  const mark = watermark ?? title

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || prefersReducedMotion()) return
      const q = gsap.utils.selector(root)

      // Entrance — word-by-word title rise.
      const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power3.out' } })
      tl.from(q('[data-ph-strip]'), { opacity: 0, y: -8, duration: 0.5 })
        .from(q('[data-ph-kicker]'), { opacity: 0, y: 12, duration: 0.5 }, '-=0.2')
        .from(q('[data-ph-word]'), { yPercent: 115, opacity: 0, duration: 0.85, stagger: 0.08 }, '-=0.2')
        .from(q('[data-ph-desc]'), { opacity: 0, y: 14, duration: 0.6 }, '-=0.4')
        .from(q('[data-ph-aside]'), { opacity: 0, y: 14, duration: 0.6 }, '-=0.5')

      // Parallax — the watermark drifts up as the hero scrolls away.
      if (markRef.current) {
        gsap.fromTo(
          markRef.current,
          { yPercent: 12 },
          {
            yPercent: -18,
            ease: 'none',
            scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
          }
        )
      }
    },
    { scope: rootRef }
  )

  return (
    <section
      ref={rootRef}
      className="relative overflow-hidden border-b border-divider py-16 sm:py-20 lg:py-28"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-[360px] w-[360px] rounded-full glow-orange blur-[120px] opacity-60"
      />

      {/* Parallax dimmed watermark */}
      <div
        ref={markRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
      >
        <span className="select-none whitespace-nowrap font-display text-[30vw] font-bold leading-[0.8] tracking-tighter text-text/[0.045] lg:text-[21vw]">
          {mark}
        </span>
      </div>

      {/* Faint scan sweep — full-height carrier so the 1px line travels the band */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="h-full w-full motion-safe:animate-[mt-scan_8s_linear_infinite]">
          <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60" />
        </div>
      </div>

      <CornerTicks className="hidden text-primary/20 sm:block" size="md" />

      <div className="section-container relative z-10">
        {/* HUD telemetry strip (decorative) */}
        <div
          data-ph-strip
          aria-hidden
          className="mb-6 flex items-center justify-between gap-4 border-b border-divider/70 pb-4 text-text-faint"
        >
          <span className="hud-label inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
            {index ? `${index} //` : '// LIVE'}
          </span>
          <span className="hud-label nums hidden sm:inline">{coords}</span>
        </div>

        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div data-ph-kicker className="mb-5 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
              <span className="hud-label text-primary">
                {index && <span className="text-text-faint">{index} / </span>}
                {kicker}
              </span>
            </div>

            <h1 className="font-display text-5xl font-bold leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl">
              {words.map((w, i) => (
                <span key={`${w}-${i}`} className="inline-block overflow-hidden pb-[0.1em] align-bottom">
                  <span data-ph-word className="inline-block">
                    {w}
                  </span>
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {description && (
              <p data-ph-desc className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted text-pretty sm:text-lg">
                {description}
              </p>
            )}

            {children && (
              <div data-ph-desc className="mt-7">
                {children}
              </div>
            )}
          </div>

          {stat && (
            <div data-ph-aside className="shrink-0">
              <div className="relative rounded-card border border-divider bg-surface-raised px-7 py-5 text-center">
                <CornerTicks className="text-primary/30" />
                <div className="font-display text-5xl font-bold text-primary nums">
                  <Counter to={stat.value} suffix={stat.suffix ?? ''} />
                </div>
                <div className="hud-label mt-2 text-text-faint">{stat.label}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

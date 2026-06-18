'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Counter } from '@/components/motion/Counter'
import { Magnetic } from '@/components/motion/Magnetic'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { MarsTerrain } from '@/components/fx/MarsTerrain'

const STATS = [
  { value: 10, label: 'Years Active', suffix: '+' },
  { value: 12, label: 'Competitions', suffix: '+' },
  { value: 70, label: 'Team Members', suffix: '+' },
  { value: 3, label: 'Continents Competed', suffix: '' },
]

export function Hero() {
  const rootRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const markRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root) return

      if (prefersReducedMotion()) return

      // Scroll parallax on the technical grid + orange glow (always on).
      gsap.to(gridRef.current, {
        yPercent: 14,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to(glowRef.current, {
        yPercent: 28,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to(markRef.current, {
        yPercent: -40,
        ease: 'none',
        scrollTrigger: { trigger: root, start: 'top top', end: 'bottom top', scrub: true },
      })

      const q = gsap.utils.selector(root)
      let played = false
      const playIntro = () => {
        if (played) return
        played = true
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
        tl.from(q('[data-hero-badge]'), { opacity: 0, y: 14, duration: 0.6 })
          .from(
            q('[data-hero-word]'),
            { opacity: 0, yPercent: 120, filter: 'blur(6px)', duration: 0.9, stagger: 0.12 },
            '-=0.2'
          )
          .from(q('[data-hero-sub]'), { opacity: 0, y: 18, duration: 0.7 }, '-=0.55')
          .from(q('[data-hero-cta]'), { opacity: 0, y: 16, duration: 0.6, stagger: 0.12 }, '-=0.4')
          .from(q('[data-hero-hud]'), { opacity: 0, duration: 0.6 }, '-=0.35')
          .from(q('[data-hero-stat]'), { opacity: 0, y: 20, duration: 0.6, stagger: 0.1 }, '-=0.3')
          .from(q('[data-hero-cue]'), { opacity: 0, duration: 0.6 }, '-=0.2')
      }

      // Wait for the preloader's "boot gate" so the reveal isn't hidden behind it.
      const booted = (window as unknown as { __mtBooted?: boolean }).__mtBooted
      if (booted) {
        playIntro()
        return
      }
      const run = () => {
        window.removeEventListener('mt:booted', run)
        gate.kill()
        playIntro()
      }
      window.addEventListener('mt:booted', run)
      const gate = gsap.delayedCall(2.2, run) // safety: play even if the gate never opens
      return () => {
        window.removeEventListener('mt:booted', run)
        gate.kill()
      }
    },
    { scope: rootRef }
  )

  return (
    <section
      ref={rootRef}
      className="relative flex min-h-dvh flex-col justify-center overflow-hidden bg-[#050505]"
    >
      {/* Technical grid (parallax / WebGL fallback) */}
      <div
        ref={gridRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 -top-[14%] h-[128%] opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* WebGL Martian terrain centerpiece */}
      <MarsTerrain className="pointer-events-none absolute inset-0 h-full w-full" />

      {/* Horizon glow where terrain meets sky */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 horizon-glow" />

      {/* Orange glow (parallax) */}
      <div
        ref={glowRef}
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[28%] h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[130px]"
      />

      {/* Dimmed wordmark watermark (parallax) */}
      <div
        ref={markRef}
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-[6%] z-0 flex justify-center overflow-hidden"
      >
        <span className="select-none whitespace-nowrap font-display text-[17vw] font-bold leading-none tracking-tighter text-white/[0.035]">
          MONGOL-TORI
        </span>
      </div>

      {/* Vignette + faint scanning sweep */}
      <div aria-hidden className="pointer-events-none absolute inset-0 vignette" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60 motion-safe:animate-[mt-scan_7s_linear_infinite]"
      />

      {/* Mission-control HUD frame corners */}
      <CornerTicks className="hidden text-white/15 sm:block" size="md" />

      <div className="section-container relative z-10 pb-16 pt-28 lg:pt-32">
        {/* HUD status line (decorative) */}
        <div
          data-hero-hud
          aria-hidden
          className="mb-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-white/45"
        >
          <span className="hud-label inline-flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
            {'// SYS: NOMINAL'}
          </span>
          <span className="hud-label nums hidden sm:inline">LAT 23.78 N&nbsp;&nbsp;LON 90.41 E</span>
          <span className="hud-label hidden md:inline text-white/30">MONGOL-TORI / BRAC UNIVERSITY</span>
        </div>

        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div
            data-hero-badge
            className="mb-6 inline-flex items-center gap-2 rounded-none border border-white/10 bg-white/5 px-4 py-1.5"
          >
            <span className="hud-label text-white/70">Built by Dreamers and Problem Solvers</span>
          </div>

          {/* Heading — word-by-word reveal */}
          <h1 className="mb-6 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-8xl">
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span data-hero-word className="inline-block">
                Engineered
              </span>
            </span>{' '}
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span data-hero-word className="inline-block">
                for
              </span>
            </span>{' '}
            <span className="inline-block overflow-hidden pb-[0.12em] align-bottom">
              <span data-hero-word className="inline-block text-primary">
                Mars.
              </span>
            </span>
          </h1>

          <p
            data-hero-sub
            className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl"
          >
            BRACU Mongol-Tori designs and builds Mars rovers to compete at URC, IRC, and ERC —
            pushing the boundaries of engineering, autonomy, and science at the undergraduate level.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Magnetic className="inline-flex">
              <Link
                data-hero-cta
                href="/rovers"
                className="inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors duration-150 hover:bg-primary-hover"
              >
                Explore Our Rovers
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
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </Magnetic>
            <Link
              data-hero-cta
              href="/join"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-colors duration-150 hover:border-primary hover:bg-white/15"
            >
              Join the Team
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="mx-auto mt-20 grid max-w-3xl grid-cols-2 gap-8 border-t border-white/10 pt-12 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat.label} data-hero-stat className="text-center">
              <div className="font-display text-4xl font-bold tabular-nums text-primary lg:text-5xl">
                <Counter to={stat.value} suffix={stat.suffix} />
              </div>
              <div className="hud-label mt-2 text-white/55">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll cue */}
      <div
        data-hero-cue
        className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 text-white/35"
      >
        <span className="hud-label">Scroll</span>
        <div className="h-8 w-px bg-gradient-to-b from-white/40 to-transparent motion-safe:animate-float" />
      </div>
    </section>
  )
}

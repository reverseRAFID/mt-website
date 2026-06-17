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
  /** Faded oversized word behind the title. */
  watermark?: string
  children?: ReactNode
}

/**
 * Cinematic, reusable page header. The title reveals word-by-word (clip + rise)
 * on mount — giving every route a dramatic entrance — over a local grid/glow
 * backdrop with a faded watermark. Degrades to plain visible text under
 * reduced-motion. Drop-in replacement for the old "header band".
 */
export function PageHero({ index, kicker, title, description, stat, watermark, children }: PageHeroProps) {
  const rootRef = useRef<HTMLElement>(null)
  const words = title.split(' ')

  useGSAP(
    () => {
      const root = rootRef.current
      if (!root || prefersReducedMotion()) return
      const q = gsap.utils.selector(root)
      const tl = gsap.timeline({ delay: 0.15, defaults: { ease: 'power3.out' } })
      tl.from(q('[data-ph-kicker]'), { opacity: 0, y: 12, duration: 0.5 })
        .from(
          q('[data-ph-word]'),
          { yPercent: 115, opacity: 0, duration: 0.85, stagger: 0.08 },
          '-=0.2'
        )
        .from(q('[data-ph-desc]'), { opacity: 0, y: 14, duration: 0.6 }, '-=0.4')
        .from(q('[data-ph-aside]'), { opacity: 0, y: 14, duration: 0.6 }, '-=0.5')
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
      {watermark && (
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-10 right-0 select-none font-display text-[20vw] font-bold leading-none tracking-tighter text-text/[0.03]"
        >
          {watermark}
        </div>
      )}
      <CornerTicks className="hidden text-primary/20 sm:block" size="md" />

      <div className="section-container relative">
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
                  {i < words.length - 1 ? ' ' : ''}
                </span>
              ))}
            </h1>

            {description && (
              <p data-ph-desc className="mt-5 max-w-2xl text-base leading-relaxed text-text-muted text-pretty sm:text-lg">
                {description}
              </p>
            )}

            {children && <div data-ph-desc className="mt-7">{children}</div>}
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

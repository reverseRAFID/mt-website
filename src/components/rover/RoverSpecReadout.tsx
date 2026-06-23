'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { Counter } from '@/components/motion/Counter'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from '@/components/rover/SectionEyebrow'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'
import type { KeySpec } from '@/sanity/lib/types'
import { parseStat } from './roverHelpers'

function SpecValue({ value }: { value: string }) {
  const parsed = parseStat(value)
  if (!parsed) return <>{value}</>
  return (
    <>
      {parsed.prefix}
      <Counter to={parsed.num} decimals={parsed.decimals} />
      {parsed.suffix}
    </>
  )
}

/**
 * Kinetic parts index: one seamless marquee row. The track holds the items
 * twice so a -50% translate loops gaplessly. Under reduced motion the track
 * stills and reflows into a static wrapping row (duplicate copy dropped), and
 * because the items are plain SSR text it reads fine with no JS at all.
 */
function PartsRow({ items, reverse = false, decorative = false }: { items: string[]; reverse?: boolean; decorative?: boolean }) {
  return (
    <div className="relative overflow-hidden" aria-hidden={decorative || undefined}>
      <ul
        className="flex w-max items-center gap-x-3 pause-on-hover animate-marquee motion-reduce:w-full motion-reduce:flex-wrap motion-reduce:gap-y-2 motion-reduce:animate-none"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
      >
        {[...items, ...items].map((c, i) => {
          const isDup = i >= items.length
          return (
            <li
              key={`${c}-${i}`}
              aria-hidden={isDup || undefined}
              className={`flex items-center gap-x-3 ${isDup ? 'motion-reduce:hidden' : ''}`}
            >
              <span className="whitespace-nowrap rounded-none border border-transparent px-2 py-1 font-mono text-xs uppercase tracking-wide text-text-muted transition-colors hover:border-primary/50 hover:text-primary">
                {c}
              </span>
              <span className="text-text-faint" aria-hidden>
                ·
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function RoverSpecReadout({
  keySpecs,
  namedComponents,
  index = '04',
}: {
  keySpecs?: KeySpec[]
  namedComponents?: string[]
  index?: string
}) {
  const specs = keySpecs ?? []
  const components = namedComponents ?? []

  const gridRef = useRef<HTMLDivElement>(null)

  // Purely-decorative charge pass: on scroll-in, sweep each cell's underline
  // from scale-x-0 to 1 and light its corner dot. The SSR/no-JS/reduced-motion
  // default leaves the underline collapsed (invisible) and the dot dim, so this
  // is strictly additive — nothing here is needed to reach the resting state.
  useGSAP(
    () => {
      const el = gridRef.current
      if (!el || prefersReducedMotion()) return
      const cells = gsap.utils.toArray<HTMLElement>(el.querySelectorAll('[data-cell]'))
      if (cells.length === 0) return

      const triggers = ScrollTrigger.batch(cells, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          batch.forEach((cell, i) => {
            const charge = cell.querySelector('[data-charge]')
            const dot = cell.querySelector('[data-dot]')
            if (charge) gsap.to(charge, { scaleX: 1, duration: 0.6, ease: 'power2.out', delay: i * 0.05 })
            if (dot) gsap.to(dot, { opacity: 1, duration: 0.4, ease: 'power1.out', delay: i * 0.05 })
          })
        },
      })

      return () => triggers.forEach((t) => t.kill())
    },
    { scope: gridRef }
  )

  if (specs.length === 0 && components.length === 0) return null

  return (
    <section className="relative border-y border-divider bg-surface py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <SectionEyebrow index={index} label="Telemetry" className="mb-3" />
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-4xl lg:text-5xl">
            The numbers behind the build
          </h2>
        </Reveal>

        {specs.length > 0 && (
          <div ref={gridRef}>
            <Reveal stagger={0.04} className="scanlines relative mt-10 grid gap-px overflow-hidden rounded-card border border-divider bg-divider sm:grid-cols-2 lg:grid-cols-3">
              {specs.map((s) => (
                <div key={s.label} data-cell className="group relative bg-surface-raised px-5 py-6 transition-colors hover:bg-surface-2">
                  <div className="hud-label text-text-faint">{s.label}</div>
                  <div className="mt-2 font-mono text-lg font-medium leading-snug text-text nums sm:text-xl">
                    <SpecValue value={s.value} />
                  </div>
                  <span
                    data-dot
                    className="absolute right-4 top-5 h-1.5 w-1.5 rounded-none bg-primary opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    aria-hidden
                  />
                  <span
                    data-charge
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-primary"
                    aria-hidden
                  />
                </div>
              ))}
            </Reveal>
          </div>
        )}

        {components.length > 0 && (
          <Reveal className="relative mt-8 overflow-hidden rounded-card border border-divider bg-surface-raised p-6 sm:p-8">
            <CornerTicks className="text-primary/20" />
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" aria-hidden />
              <span className="hud-label text-text-muted">Parts Index // {components.length} components</span>
            </div>
            <div className="-mx-6 flex flex-col gap-2 sm:-mx-8">
              <PartsRow items={components} />
              {/* Decorative counter-scrolling lane — hidden when motion is
                  reduced so the parts list isn't duplicated as a static row. */}
              <div className="motion-reduce:hidden">
                <PartsRow items={[...components].reverse()} reverse decorative />
              </div>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

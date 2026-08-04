'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { GhostText } from '@/components/motion/GhostText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

export interface RankPoint {
  year: number
  rank: number
  shortName: string
  totalTeams?: number | null
}

/**
 * Rank-over-years trend. Bar height encodes how well we placed (taller =
 * better), with the rank number labelled above each bar so meaning never
 * depends on the visual alone. Bars grow in on scroll (transform-only scaleY);
 * under reduced-motion they render full. Pass at least two ranked points.
 */
export function RankTrend({ points }: { points: RankPoint[] }) {
  const ref = useRef<HTMLDivElement>(null)

  const ranks = points.map((p) => p.rank)
  const best = Math.min(...ranks)
  const worst = Math.max(...ranks)
  const heightFor = (rank: number) => (best === worst ? 100 : 40 + (60 * (worst - rank)) / (worst - best))

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const bars = el.querySelectorAll<HTMLElement>('[data-bar]')
      gsap.set(bars, { scaleY: 0, transformOrigin: 'bottom center' })
      gsap.to(bars, {
        scaleY: 1,
        duration: 0.9,
        ease: 'power3.out',
        stagger: 0.1,
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      })
    },
    { scope: ref }
  )

  return (
    <section className="relative border-t border-divider bg-surface py-20 lg:py-28">
      <GhostText text="ASCENT" drift="left" outline />
      <div className="section-container relative">
        <SectionHeader
          index="02"
          kicker="Trajectory"
          title="Climbing the world rankings"
          description="Our placement at international competitions over the years. Taller bars are better results — a lower rank number means a higher finish."
          className="mb-12 lg:mb-16"
        />

        <div className="relative rounded-card border border-divider bg-surface-raised p-6 sm:p-8 lg:p-10">
          <CornerTicks className="text-primary/30" size="md" />

          <div ref={ref} className="flex items-end justify-between gap-2 sm:gap-5">
            {points.map((p) => {
              const isBest = p.rank === best
              return (
                <figure
                  key={`${p.shortName}-${p.year}`}
                  className="flex min-w-0 flex-1 flex-col items-center gap-3"
                  aria-label={`${p.shortName} ${p.year}: ranked number ${p.rank}${p.totalTeams ? ` of ${p.totalTeams} teams` : ''}`}
                >
                  <span className={`font-display text-lg font-bold nums sm:text-2xl ${isBest ? 'text-primary' : 'text-text'}`}>
                    #{p.rank}
                  </span>
                  <div className="relative flex h-40 w-full items-end sm:h-56">
                    <div
                      data-bar
                      style={{ height: `${heightFor(p.rank)}%` }}
                      className={`mx-auto w-full max-w-[3.5rem] origin-bottom rounded-none ${isBest ? 'bg-primary' : 'bg-primary/60'}`}
                    />
                  </div>
                  <figcaption className="flex flex-col items-center gap-0.5 text-center">
                    <span className="hud-label text-text">{p.shortName}</span>
                    <span className="hud-label nums text-text-muted">{p.year}</span>
                  </figcaption>
                </figure>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface ContributionRailProps {
  joinedYear?: number
  graduationYear?: number
  yearsContributed?: number[]
  isAlumni?: boolean
}

interface YearNode {
  year: number
  contributed: boolean
  joined: boolean
  grad: boolean
}

/**
 * "Service record" — a horizontal timeline of every year the member was on the
 * team. The active span draws across on scroll and each year node pops in
 * sequence; non-contributed years in the range read as hollow nodes so the
 * meaning never relies on colour alone. Static + fully legible under
 * reduced-motion. Returns null when there is no year data to plot.
 */
export function ContributionRail({ joinedYear, graduationYear, yearsContributed, isAlumni }: ContributionRailProps) {
  const ref = useRef<HTMLDivElement>(null)

  const provided = (yearsContributed ?? []).filter((y) => Number.isFinite(y))
  // Ignore a graduationYear that precedes joinedYear (a data slip) so the rail never reverses.
  const effGrad =
    joinedYear != null && graduationYear != null && graduationYear < joinedYear ? undefined : graduationYear
  const anchors = [...provided, joinedYear, effGrad].filter((y): y is number => Number.isFinite(y as number))
  const start = anchors.length ? Math.min(...anchors) : undefined
  const end = anchors.length ? Math.max(...anchors) : undefined

  const nodes: YearNode[] = []
  if (start !== undefined && end !== undefined && end - start < 30) {
    const set = new Set(provided)
    const hasExplicit = provided.length > 0
    for (let y = start; y <= end; y++) {
      nodes.push({
        year: y,
        // With explicit years, only those count; otherwise the whole joined→grad span is service.
        contributed: hasExplicit ? set.has(y) : true,
        joined: y === joinedYear,
        grad: y === effGrad,
      })
    }
  }

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const line = el.querySelector<HTMLElement>('[data-rail-line]')
      const dots = el.querySelectorAll<HTMLElement>('[data-rail-node]')
      const labels = el.querySelectorAll<HTMLElement>('[data-rail-label]')

      const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 78%', once: true } })
      if (line) tl.fromTo(line, { scaleX: 0 }, { scaleX: 1, transformOrigin: 'left center', duration: 1, ease: 'power2.out' }, 0)
      tl.from(dots, { scale: 0, opacity: 0, stagger: 0.06, duration: 0.45, ease: 'back.out(2)' }, 0.15)
      tl.from(labels, { opacity: 0, y: 8, stagger: 0.05, duration: 0.4, ease: 'power2.out' }, 0.3)
    },
    { scope: ref, dependencies: [nodes.length] }
  )

  if (nodes.length === 0) return null

  const seasons = nodes.filter((n) => n.contributed).length

  return (
    <section className="relative border-b border-divider bg-surface py-14 lg:py-20">
      <div className="section-container">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
              <span className="hud-label text-primary">Service Record</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
              {seasons} {seasons === 1 ? 'season' : 'seasons'} on the team
            </h2>
          </div>
          <p className="hud-label nums text-text-faint">
            {nodes[0].year} — {isAlumni || graduationYear ? nodes[nodes.length - 1].year : 'PRESENT'}
          </p>
        </div>

        <div ref={ref} className="relative rounded-card border border-divider bg-surface-raised p-6 sm:p-8 lg:p-10">
          <CornerTicks className="text-primary/25" size="md" />

          <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="relative min-w-max px-2">
              {/* base track + animated progress, centred on the node row
                  (caption h-1.5rem + mb-1.5 0.375rem + node half 0.375rem = 2.25rem) */}
              <div aria-hidden className="absolute left-2 right-2 top-[2.25rem] h-px bg-divider" />
              <div data-rail-line aria-hidden className="absolute left-2 right-2 top-[2.25rem] h-px bg-primary" />

              <ol className="relative flex items-stretch justify-between gap-3">
                {nodes.map((n) => {
                  const tag = n.joined ? 'JOINED' : n.grad ? 'GRAD' : null
                  return (
                    <li key={n.year} className="flex min-w-[58px] flex-1 flex-col items-center">
                      <span className={`hud-label mb-1.5 flex h-[1.5rem] items-end justify-center text-[10px] leading-none ${tag ? 'text-primary' : 'text-transparent'}`} aria-hidden={!tag}>
                        {tag ?? '·'}
                      </span>
                      <span
                        data-rail-node
                        className={`block h-3 w-3 rotate-45 border ${
                          n.contributed ? 'border-primary bg-primary' : 'border-divider bg-surface-raised'
                        }`}
                        title={`${n.year}${n.contributed ? ' · active' : ''}`}
                      />
                      <span
                        data-rail-label
                        className={`hud-label nums mt-3 ${n.contributed ? 'text-text' : 'text-text-faint'}`}
                      >
                        {String(n.year).slice(-2)}
                        <span className="sr-only">{n.year}{n.contributed ? ' — active' : ' — inactive'}</span>
                      </span>
                    </li>
                  )
                })}
              </ol>
            </div>
          </div>

          {/* legend */}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-divider pt-5">
            <span className="inline-flex items-center gap-2 text-xs text-text-muted">
              <span className="h-2.5 w-2.5 rotate-45 border border-primary bg-primary" aria-hidden />
              Active year
            </span>
            <span className="inline-flex items-center gap-2 text-xs text-text-muted">
              <span className="h-2.5 w-2.5 rotate-45 border border-divider bg-surface-raised" aria-hidden />
              On record
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}

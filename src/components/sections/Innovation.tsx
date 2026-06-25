import type { ReactNode } from 'react'
import type { RoverCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { CAPABILITIES, type Capability } from '@/lib/capabilities'

const ICONS: Record<Capability['icon'], ReactNode> = {
  arm: (
    <>
      <circle cx="5" cy="19" r="2" />
      <path d="M5 17V9a2 2 0 0 1 2-2h3" />
      <path d="m9 5 4 2-1.5 3.5" />
      <circle cx="9" cy="5" r="1.5" />
      <path d="M11.5 10.5 17 13l2-2" />
      <rect x="17" y="8" width="4" height="5" rx="1" />
    </>
  ),
  cpu: (
    <>
      <rect x="6" y="6" width="12" height="12" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="0.5" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </>
  ),
  beaker: (
    <>
      <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" />
      <path d="M7.5 14h9" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
    </>
  ),
  signal: (
    <>
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
}

/**
 * Innovation / capabilities — an interactive "systems" grid. Cards reveal in a
 * scroll-triggered stagger, then respond to hover with a lifting surface, an
 * accent bar that wipes across the top, lit corner brackets, and an icon that
 * fills with the accent. Surfaces the featured rover's real specs where
 * available. Replaces the former pinned horizontal-scroll reel — content now
 * reads as a calm, scannable grid with no scroll-jacking.
 */
export function Innovation({ rover }: { rover: RoverCard | null }) {
  const specValue = (cap: Capability): string | null => {
    if (!cap.specKey) return null
    const v = rover?.specs?.[cap.specKey]
    if (v === undefined || v === null || v === '') return null
    return cap.specKey === 'dof' ? `${v}-DOF` : String(v)
  }

  return (
    <section className="relative border-t border-divider bg-surface py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          kicker="Engineering"
          title="What makes our rover tick"
          description="Six subsystems, designed and built in-house, working together to survive the desert and complete missions far from human reach."
        />

        <Reveal stagger={0.09} className="mt-12 grid gap-px overflow-hidden rounded-card border border-divider bg-divider sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
          {CAPABILITIES.map((cap, i) => {
            const spec = specValue(cap)
            return (
              <article
                key={cap.title}
                className="group relative flex min-h-[16rem] flex-col bg-surface-raised p-7 transition-colors duration-300 hover:bg-surface"
              >
                {/* Accent bar wipes across the top on hover */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-primary transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
                />
                <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" size="md" />

                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-divider bg-surface text-primary transition-colors duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-on-accent">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {ICONS[cap.icon]}
                    </svg>
                  </span>
                  <span aria-hidden className="font-display text-3xl font-bold text-text/[0.07] nums transition-colors duration-300 group-hover:text-primary/20">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>

                <h3 className="mb-2 font-display text-xl font-bold text-text">{cap.title}</h3>
                <p className="leading-relaxed text-text-muted text-pretty">{cap.description}</p>

                {spec && (
                  <div className="mt-auto flex items-center gap-2 pt-6">
                    <span className="hud-label text-text-muted">{cap.specLabel}</span>
                    <span className="h-px flex-1 bg-divider" aria-hidden />
                    <span className="font-mono text-sm font-medium text-primary nums">{spec}</span>
                  </div>
                )}
              </article>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

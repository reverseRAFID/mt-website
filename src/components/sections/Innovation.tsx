import type { ReactNode } from 'react'
import type { RoverCard } from '@/sanity/lib/types'
import { HorizontalScroll } from '@/components/motion/HorizontalScroll'
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
 * Innovation / capabilities reel — a pinned horizontal-scroll showcase of the
 * rover's subsystems on desktop, native swipe row on mobile. Surfaces the
 * featured rover's real specs where available. Server-rendered cards passed
 * into the client HorizontalScroll.
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
        <p className="mt-4 flex items-center gap-2 text-sm text-text-muted lg:hidden">
          <span className="hud-label">Swipe through the systems</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </p>
      </div>

      <HorizontalScroll
        ariaLabel="Rover capabilities"
        className="mt-10 lg:mt-14"
        trackClassName="gap-5 px-4 py-2 sm:px-6 lg:px-8"
      >
        {CAPABILITIES.map((cap, i) => {
          const spec = specValue(cap)
          return (
            <article
              key={cap.title}
              className="w-[80vw] shrink-0 snap-start sm:w-[54vw] lg:w-[36vw] xl:w-[28vw]"
            >
              <div className="relative flex h-full min-h-[17rem] flex-col overflow-hidden rounded-card border border-divider bg-surface-raised p-7">
                <CornerTicks className="text-primary/20" />
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-none border border-divider bg-surface text-primary">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {ICONS[cap.icon]}
                    </svg>
                  </span>
                  <span aria-hidden className="hud-label nums text-text-faint">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="mb-2 font-display text-xl font-bold text-text">{cap.title}</h3>
                <p className="leading-relaxed text-text-muted text-pretty">{cap.description}</p>

                {spec && (
                  <div className="mt-auto flex items-center gap-2 pt-5">
                    <span className="hud-label text-text-muted">{cap.specLabel}</span>
                    <span className="font-mono text-sm font-medium text-text nums">{spec}</span>
                  </div>
                )}
              </div>
            </article>
          )
        })}
      </HorizontalScroll>
    </section>
  )
}

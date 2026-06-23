'use client'

import { HorizontalScroll } from '@/components/motion/HorizontalScroll'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from './SectionEyebrow'
import type { RoverInnovation } from '@/sanity/lib/types'
import { pad2 } from './roverHelpers'

export function RoverInnovations({
  innovations,
  roverName,
  index = '01',
}: {
  innovations: RoverInnovation[]
  roverName: string
  index?: string
}) {
  if (!innovations || innovations.length === 0) return null

  // The eyebrow + title travel WITH the pinned stage so the whole bay reads as
  // one deliberate set-piece (this is the fix for the "stuck strip" bug — the
  // header is no longer marooned above an empty, top-glued pin).
  const header = (
    <div className="pb-8 lg:pb-10">
      <SectionEyebrow index={index} label="What Makes It New" className="mb-3" />
      <h2 className="max-w-3xl text-balance font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
        {innovations.length} breakthroughs that define {roverName}
      </h2>
    </div>
  )

  return (
    <HorizontalScroll
      ariaLabel={`${roverName} key innovations`}
      header={header}
      count={innovations.length}
      trackClassName="gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8"
      className="border-y border-divider bg-surface py-16 lg:py-24"
    >
      {/* Leading spacer so card 01 can rest fully centered on desktop. */}
      <div aria-hidden className="w-1 shrink-0 sm:w-4 lg:w-[33vw]" />

      {innovations.map((item, i) => (
        <article
          key={item.title}
          data-hs-card
          className="group relative flex w-[82vw] shrink-0 snap-start flex-col justify-between rounded-card border border-divider bg-surface-raised p-6 transition-[opacity,border-color] duration-300 hover:border-primary/45 data-[active=true]:border-primary/40 sm:w-[58vw] sm:p-8 lg:w-[34vw] lg:data-[active=false]:opacity-40 xl:w-[30vw]"
        >
          <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/45 group-data-[active=true]:text-primary/45" size="md" />
          <div className="flex items-start justify-between gap-4">
            <span className="font-display text-6xl font-bold leading-none text-primary/15 nums transition-colors duration-300 group-hover:text-primary/30 group-data-[active=true]:text-primary/35 sm:text-7xl">
              {pad2(i + 1)}
            </span>
            <span className="hud-label mt-2 text-text-faint">Innovation</span>
          </div>
          <div className="mt-10 sm:mt-14">
            <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-text sm:text-2xl">
              {item.title}
            </h3>
            <p className="mt-3 text-pretty text-sm leading-relaxed text-text-muted sm:text-base">
              {item.description}
            </p>
          </div>
        </article>
      ))}

      {/* Trailing spacer so the last card can rest fully centered on desktop. */}
      <div aria-hidden className="w-1 shrink-0 sm:w-4 lg:w-[33vw]" />
    </HorizontalScroll>
  )
}

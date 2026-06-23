'use client'

import { HorizontalScroll } from '@/components/motion/HorizontalScroll'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Reveal } from '@/components/motion/Reveal'
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

  return (
    <section className="relative border-b border-divider bg-surface py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>What Makes It New
            </span>
          </div>
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-4xl lg:text-5xl">
            {innovations.length} breakthroughs that define {roverName}
          </h2>
        </Reveal>
      </div>

      <div className="mt-10 lg:mt-14">
        <HorizontalScroll
          ariaLabel={`${roverName} key innovations`}
          trackClassName="gap-4 px-4 sm:gap-5 sm:px-6 lg:px-8"
        >
          {innovations.map((item, i) => (
            <article
              key={item.title}
              className="group relative flex w-[82vw] shrink-0 snap-start flex-col justify-between rounded-card border border-divider bg-surface-raised p-6 transition-colors duration-300 hover:border-primary/45 sm:w-[58vw] sm:p-8 lg:w-[34vw] xl:w-[30vw]"
            >
              <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/45" size="md" />
              <div className="flex items-start justify-between gap-4">
                <span className="font-display text-6xl font-bold leading-none text-primary/15 transition-colors duration-300 group-hover:text-primary/30 nums sm:text-7xl">
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
          {/* tail spacer so the last card can rest fully in view */}
          <div aria-hidden className="w-4 shrink-0 sm:w-6 lg:w-8" />
        </HorizontalScroll>
      </div>
    </section>
  )
}

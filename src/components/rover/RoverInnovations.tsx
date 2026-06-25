import { Reveal } from '@/components/motion/Reveal'
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

  return (
    <section
      aria-label={`${roverName} key innovations`}
      className="relative border-y border-divider bg-surface py-16 lg:py-24"
    >
      <div className="section-container">
        <Reveal className="pb-10 lg:pb-14">
          <SectionEyebrow index={index} label="What Makes It New" className="mb-3" />
          <h2 className="max-w-3xl text-balance font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
            {innovations.length} breakthroughs that define {roverName}
          </h2>
        </Reveal>

        {/* Indexed editorial reveal — big numbers, hairline rows, no scroll-jacking. */}
        <ol className="border-t border-divider">
          {innovations.map((item, i) => (
            <li key={item.title}>
              <Reveal y={24}>
                <article className="group relative grid grid-cols-[auto_1fr] gap-x-6 border-b border-divider py-8 transition-colors duration-300 hover:bg-surface-raised sm:gap-x-10 sm:py-10 lg:grid-cols-[10rem_1fr]">
                  <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/30" size="md" />

                  {/* Big index */}
                  <div className="pl-1 sm:pl-2">
                    <span className="block font-display text-5xl font-bold leading-none tracking-tight text-primary/15 nums transition-colors duration-300 group-hover:text-primary/30 sm:text-7xl lg:text-8xl">
                      {pad2(i + 1)}
                    </span>
                  </div>

                  {/* Copy */}
                  <div className="max-w-2xl self-center pr-2">
                    <div className="mb-3 flex items-center gap-3">
                      <span className="hud-label text-primary">Innovation</span>
                      <span className="h-px w-8 bg-primary/40 transition-all duration-300 group-hover:w-14" aria-hidden />
                    </div>
                    <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-text sm:text-2xl">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-pretty text-sm leading-relaxed text-text-muted sm:text-base">
                      {item.description}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

import { Reveal } from '@/components/motion/Reveal'
import type { RoverMission } from '@/sanity/lib/types'
import { pad2 } from './roverHelpers'

/**
 * Mission approaches rendered as a vertical spine of stepped nodes. Server
 * component — the only motion is the Reveal client island.
 */
export function RoverMissions({
  missions,
  index = '04',
}: {
  missions: RoverMission[]
  index?: string
}) {
  if (!missions || missions.length === 0) return null

  return (
    <section className="relative py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>Mission Plan
            </span>
          </div>
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-4xl lg:text-5xl">
            Four missions, one machine
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted text-pretty">
            How this rover is engineered to score across every University Rover Challenge task.
          </p>
        </Reveal>

        <div className="relative mt-12">
          {/* spine */}
          <div aria-hidden className="absolute bottom-2 left-[15px] top-2 w-px bg-divider sm:left-[19px]" />
          <ol className="space-y-8">
            {missions.map((m, i) => (
              <Reveal as="li" key={`${m.name}-${i}`} y={18} className="relative grid grid-cols-[32px_1fr] gap-5 sm:grid-cols-[40px_1fr] sm:gap-7">
                <div className="relative z-10 flex h-8 w-8 items-center justify-center rounded-none border border-primary/40 bg-bg font-mono text-xs font-medium text-primary nums sm:h-10 sm:w-10 sm:text-sm">
                  {pad2(i + 1)}
                </div>
                <div className="pt-0.5 sm:pt-1.5">
                  <h3 className="font-display text-lg font-bold leading-tight tracking-tight text-text sm:text-2xl">
                    {m.name}
                  </h3>
                  <p className="mt-2 max-w-2xl text-pretty text-sm leading-relaxed text-text-muted sm:text-base">
                    {m.summary}
                  </p>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

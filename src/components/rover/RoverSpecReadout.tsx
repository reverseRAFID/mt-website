'use client'

import { Counter } from '@/components/motion/Counter'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
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

export function RoverSpecReadout({
  keySpecs,
  namedComponents,
  index = '03',
}: {
  keySpecs?: KeySpec[]
  namedComponents?: string[]
  index?: string
}) {
  const specs = keySpecs ?? []
  const components = namedComponents ?? []
  if (specs.length === 0 && components.length === 0) return null

  return (
    <section className="relative border-y border-divider bg-surface py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>Telemetry
            </span>
          </div>
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-4xl lg:text-5xl">
            The numbers behind the build
          </h2>
        </Reveal>

        {specs.length > 0 && (
          <Reveal stagger={0.04} className="scanlines relative mt-10 grid gap-px overflow-hidden rounded-card border border-divider bg-divider sm:grid-cols-2 lg:grid-cols-3">
            {specs.map((s) => (
              <div key={s.label} className="group relative bg-surface-raised px-5 py-6 transition-colors hover:bg-surface-2">
                <div className="hud-label text-text-faint">{s.label}</div>
                <div className="mt-2 font-mono text-lg font-medium leading-snug text-text nums sm:text-xl">
                  <SpecValue value={s.value} />
                </div>
                <span className="absolute right-4 top-5 h-1.5 w-1.5 rounded-none bg-primary/0 transition-colors group-hover:bg-primary" aria-hidden />
              </div>
            ))}
          </Reveal>
        )}

        {components.length > 0 && (
          <Reveal className="relative mt-8 rounded-card border border-divider bg-surface-raised p-6 sm:p-8">
            <CornerTicks className="text-primary/20" />
            <div className="mb-5 flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" aria-hidden />
              <span className="hud-label text-text-muted">Tech Stack // {components.length} components</span>
            </div>
            <ul className="flex flex-wrap gap-2">
              {components.map((c) => (
                <li
                  key={c}
                  className="rounded-none border border-divider bg-surface px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-primary/50 hover:text-primary"
                >
                  {c}
                </li>
              ))}
            </ul>
          </Reveal>
        )}
      </div>
    </section>
  )
}

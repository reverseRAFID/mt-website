import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SponsorGlyph } from '@/components/sponsors/icons'
import { IMPACT_METRICS, type ImpactMetric } from '@/lib/sponsorship'
import { cn } from '@/lib/utils'

interface ImpactMetricsProps {
  index?: string
  kicker?: string
  title?: string
  description?: string
  /** Subset / custom set of metrics. Defaults to the full impact list. */
  metrics?: ImpactMetric[]
  /** Section background tone. */
  tone?: 'bg' | 'surface'
  className?: string
}

/**
 * Impact & reach band — animated count-ups that prove credibility (the data a
 * sponsor wants before they commit). Reusable: full set on the sponsors page,
 * a tighter set on the home page. Placeholder figures render an "EST." marker.
 * Server component; `Counter`/`Reveal` are client islands rendered within it.
 */
export function ImpactMetrics({
  index,
  kicker = 'By the numbers',
  title = 'Impact & reach',
  description,
  metrics = IMPACT_METRICS,
  tone = 'surface',
  className,
}: ImpactMetricsProps) {
  return (
    <section
      className={cn(
        'relative border-y border-divider py-20 lg:py-28',
        tone === 'surface' ? 'bg-surface' : 'bg-bg',
        className
      )}
    >
      <div className="section-container">
        {(kicker || title || description) && (
          <SectionHeader
            index={index}
            kicker={kicker}
            title={title}
            description={description}
            align="center"
            className="mb-12 lg:mb-16"
          />
        )}

        <Reveal
          stagger
          className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
        >
          {metrics.map((m) => (
            <div
              key={m.label}
              className="group relative flex flex-col items-center gap-3 rounded-card border border-divider bg-surface-raised px-4 py-8 text-center transition-colors duration-300 hover:border-primary/40 sm:px-6"
            >
              <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/30" />
              <span className="flex h-10 w-10 items-center justify-center rounded-none border border-divider bg-surface text-primary transition-colors duration-300 group-hover:border-primary/40">
                <SponsorGlyph icon={m.icon} size={20} />
              </span>
              <div className="font-display text-4xl font-bold leading-none text-primary nums lg:text-5xl">
                <Counter to={m.value} prefix={m.prefix} suffix={m.suffix} grouping={m.grouping} />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="hud-label text-text">{m.label}</span>
                {m.tbd && (
                  <span
                    className="hud-label rounded-none border border-divider px-1 py-px text-[0.5rem] text-text-muted"
                    title="Estimate — to be confirmed by the team"
                  >
                    Est.
                  </span>
                )}
              </div>
              {m.note && <p className="text-xs leading-relaxed text-text-muted text-pretty">{m.note}</p>}
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

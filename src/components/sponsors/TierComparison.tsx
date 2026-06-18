import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { BENEFITS_MATRIX, COMPARISON_TIERS, type MatrixValue } from '@/lib/sponsorship'
import { cn } from '@/lib/utils'

function CellMark({ value }: { value: MatrixValue }) {
  if (value === true)
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-primary" aria-label="Included">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    )
  if (value === false)
    return (
      <span className="block text-center text-text-faint" aria-label="Not included">
        <span aria-hidden>—</span>
      </span>
    )
  return <span className="block text-center text-xs font-medium leading-tight text-text">{value}</span>
}

/**
 * Benefits comparison. Renders a real table on desktop (with a sticky header
 * row) and reflows into per-tier stacked cards on mobile — so there is never a
 * horizontal scroll. The "most popular" Gold column is tinted.
 */
export function TierComparison() {
  const goldIndex = COMPARISON_TIERS.findIndex((t) => t.id === 'gold')

  return (
    <section className="relative border-y border-divider bg-surface py-20 lg:py-28">
      <div className="section-container">
        <SectionHeader
          index="05"
          kicker="The fine print"
          title="What each tier includes"
          align="center"
          className="mb-12 lg:mb-16"
        />

        {/* Desktop: comparison table */}
        <Reveal className="hidden lg:block">
          <div className="overflow-hidden rounded-card border border-divider">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr>
                  <th scope="col" className="sticky top-16 z-10 w-[28%] bg-surface-2 px-4 py-4 align-bottom">
                    <span className="hud-label text-text-muted">Benefit</span>
                  </th>
                  {COMPARISON_TIERS.map((t, i) => (
                    <th
                      key={t.id}
                      scope="col"
                      className={cn(
                        'sticky top-16 z-10 px-3 py-4 text-center align-bottom',
                        i === goldIndex ? 'bg-primary-highlight' : 'bg-surface-2'
                      )}
                    >
                      <span className={cn('font-display text-base font-bold', i === goldIndex ? 'text-primary' : 'text-text')}>
                        {t.label}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BENEFITS_MATRIX.map((row) => (
                  <tr key={row.feature} className="border-t border-divider">
                    <th scope="row" className="bg-surface-raised px-4 py-3.5 text-sm font-medium text-text">
                      {row.feature}
                    </th>
                    {COMPARISON_TIERS.map((t, i) => (
                      <td
                        key={t.id}
                        className={cn('px-3 py-3.5 align-middle', i === goldIndex ? 'bg-primary-highlight/50' : 'bg-surface-raised')}
                      >
                        <CellMark value={row[t.id]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>

        {/* Mobile / tablet: per-tier stacked cards (only included benefits) */}
        <Reveal stagger className="flex flex-col gap-4 lg:hidden">
          {COMPARISON_TIERS.map((t) => {
            const included = BENEFITS_MATRIX.filter((row) => row[t.id] !== false)
            return (
              <div
                key={t.id}
                className={cn(
                  'rounded-card border bg-surface-raised p-5',
                  t.id === 'gold' ? 'border-primary/40' : 'border-divider'
                )}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h3 className="font-display text-lg font-bold text-text">{t.label}</h3>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {included.map((row) => (
                    <li key={row.feature} className="flex items-start justify-between gap-3 text-sm">
                      <span className="text-text-muted">{row.feature}</span>
                      <span className="shrink-0 text-right font-medium text-text">
                        {row[t.id] === true ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary" aria-label="Included">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        ) : (
                          <span className="text-xs">{row[t.id]}</span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

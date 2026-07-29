'use client'

import { useMemo, useState } from 'react'
import type { Supporter } from '@/lib/cms/donations'
import { formatRank, rankTier, HIGHLIGHT_RANKS } from '@/lib/crowdfunding'
import { RankBadge, ROW_STYLES, RANK_TEXT } from '@/components/support/RankBadge'
import { cn } from '@/lib/utils'

interface SupportersTableProps {
  supporters: Supporter[]
  /** Rows rendered before "Show more" appears. Pass 0 to render all. */
  pageSize?: number
  /** Hide the search box — used by the compact homepage variant. */
  searchable?: boolean
  className?: string
}

const PAGE = 25

function VerifiedDate({ value }: { value?: string | null }) {
  if (!value) return <span className="text-text-faint">—</span>
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return <span className="text-text-faint">—</span>
  return (
    <time dateTime={d.toISOString()} className="nums">
      {d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
    </time>
  )
}

/**
 * The public honour roll.
 *
 * Ranking is precomputed on the server from an `order(amount desc)` query, so
 * this component never sees a monetary figure — there is nothing here to leak.
 * It only presents `rank`, `displayName`, `affiliation`, `message` and
 * `approvedAt`.
 *
 * Rendered as a real `<table>` (it is tabular data, and screen readers get
 * proper row/column semantics). Narrow viewports drop the note and date
 * columns rather than reflowing to cards, which keeps the rank↔name↔badge
 * relationship — the whole point of the table — intact at every width. The
 * wrapper scrolls horizontally as a backstop so a long name can never push the
 * page sideways.
 */
export function SupportersTable({
  supporters,
  pageSize = PAGE,
  searchable = true,
  className,
}: SupportersTableProps) {
  const [query, setQuery] = useState('')
  const [visible, setVisible] = useState(pageSize || supporters.length)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return supporters
    return supporters.filter(
      (s) =>
        s.displayName.toLowerCase().includes(q) ||
        (s.affiliation ?? '').toLowerCase().includes(q)
    )
  }, [supporters, query])

  // Searching should reveal every match, not just the first page of them.
  const rows = query.trim() ? filtered : filtered.slice(0, visible)
  const hasMore = !query.trim() && visible < filtered.length

  return (
    <div className={cn('flex flex-col gap-5', className)}>
      {searchable && supporters.length > 8 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative w-full sm:max-w-xs">
            <span className="sr-only">Search supporters by name</span>
            <svg
              aria-hidden
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search supporters"
              className="w-full min-h-[44px] rounded-none border border-divider bg-surface py-2.5 pl-9 pr-3.5 text-sm text-text placeholder-text-faint transition-colors hover:border-border focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </label>
          <p className="hud-label nums text-text-faint" role="status" aria-live="polite">
            {query.trim()
              ? `${filtered.length} match${filtered.length === 1 ? '' : 'es'}`
              : `${supporters.length} supporter${supporters.length === 1 ? '' : 's'}`}
          </p>
        </div>
      )}

      <div className="relative overflow-x-auto border border-divider bg-surface-raised">
        <table className="w-full min-w-[34rem] border-collapse text-left">
          <caption className="sr-only">
            Verified supporters ordered by contribution. Contribution amounts are not
            published; the top {HIGHLIGHT_RANKS} supporters carry a badge.
          </caption>
          <thead>
            <tr className="border-b border-divider bg-surface">
              <th scope="col" className="hud-label px-4 py-3.5 text-text-faint sm:px-5">
                Rank
              </th>
              <th scope="col" className="hud-label px-4 py-3.5 text-text-faint sm:px-5">
                Supporter
              </th>
              <th scope="col" className="hud-label px-4 py-3.5 text-text-faint sm:px-5">
                Standing
              </th>
              <th scope="col" className="hud-label hidden px-5 py-3.5 text-text-faint lg:table-cell">
                Note
              </th>
              <th scope="col" className="hud-label hidden px-5 py-3.5 text-text-faint md:table-cell">
                Verified
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const tier = rankTier(s.rank)
              return (
                <tr
                  key={s.id}
                  className={cn(
                    'border-b border-l-2 border-divider transition-colors last:border-b-0 hover:bg-surface-2/60',
                    tier ? ROW_STYLES[tier.key] : 'border-l-transparent'
                  )}
                >
                  <td className="px-4 py-4 align-top sm:px-5">
                    <span
                      className={cn(
                        'font-display nums text-lg font-bold leading-none',
                        tier ? RANK_TEXT[tier.key] : 'text-text-faint'
                      )}
                    >
                      {tier && <span aria-hidden>#</span>}
                      {formatRank(s.rank)}
                    </span>
                  </td>
                  <td className="px-4 py-4 align-top sm:px-5">
                    <span className="block font-display text-sm font-bold uppercase leading-tight tracking-tight text-text sm:text-base">
                      {s.displayName}
                    </span>
                    {s.affiliation && (
                      <span className="mt-1 block text-xs text-text-muted">{s.affiliation}</span>
                    )}
                    {/* Note is dropped from its own column below lg — surface it
                        here so narrow viewports do not lose the content. */}
                    {s.message && (
                      <span className="mt-1.5 block text-xs italic leading-relaxed text-text-muted lg:hidden">
                        “{s.message}”
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 align-top sm:px-5">
                    {tier ? (
                      <RankBadge rank={s.rank} />
                    ) : (
                      <span className="hud-label text-text-faint">Supporter</span>
                    )}
                  </td>
                  <td className="hidden max-w-xs px-5 py-4 align-top lg:table-cell">
                    {s.message ? (
                      <span className="text-sm italic leading-relaxed text-text-muted">
                        “{s.message}”
                      </span>
                    ) : (
                      <span className="text-text-faint">—</span>
                    )}
                  </td>
                  <td className="hidden whitespace-nowrap px-5 py-4 align-top text-sm text-text-muted md:table-cell">
                    <VerifiedDate value={s.approvedAt} />
                  </td>
                </tr>
              )
            })}

            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-text-muted">
                  No supporters match “{query.trim()}”.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="text-center">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Show more supporters
            <span className="hud-label nums text-text-faint">
              {filtered.length - visible} left
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import type { ResearchCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { cn } from '@/lib/utils'

const STATUS_STYLE: Record<string, string> = {
  published: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  preprint: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'under-review': 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
}
const STATUS_LABEL: Record<string, string> = {
  published: 'Published',
  preprint: 'Pre-print',
  'under-review': 'Under Review',
}

const STATUS_ORDER = ['published', 'preprint', 'under-review']

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-[40px] items-center rounded-none border px-3 py-1.5 text-sm font-semibold transition-colors',
        active
          ? 'border-primary bg-primary text-on-accent'
          : 'border-divider bg-surface-raised text-text-muted hover:border-primary/40 hover:text-primary'
      )}
    >
      {children}
    </button>
  )
}

/**
 * Filterable research archive. Filter by publication status and by topic
 * (focus area) on the client. The initial list reveals on scroll; re-filtered
 * results render immediately. All data-driven from the papers passed in.
 */
export function ResearchExplorer({ papers }: { papers: ResearchCard[] }) {
  const [status, setStatus] = useState<string>('all')
  const [topic, setTopic] = useState<string>('all')

  const statuses = useMemo(
    () => STATUS_ORDER.filter((s) => papers.some((p) => p.status === s)),
    [papers]
  )
  const topics = useMemo(() => {
    const all = papers.flatMap((p) => p.topics ?? [])
    return Array.from(new Set(all)).sort((a, b) => a.localeCompare(b))
  }, [papers])

  const filtered = useMemo(
    () =>
      papers.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (topic === 'all' || (p.topics ?? []).includes(topic))
      ),
    [papers, status, topic]
  )

  const reset = () => {
    setStatus('all')
    setTopic('all')
  }

  return (
    <div>
      {/* Status filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="hud-label mr-1 text-text-muted">Status</span>
        <FilterChip active={status === 'all'} onClick={() => setStatus('all')}>
          All
        </FilterChip>
        {statuses.map((s) => (
          <FilterChip key={s} active={status === s} onClick={() => setStatus(s)}>
            {STATUS_LABEL[s] ?? s}
          </FilterChip>
        ))}
      </div>

      {/* Topic / focus-area filters */}
      {topics.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          <span className="hud-label mr-1 text-text-muted">Focus</span>
          <FilterChip active={topic === 'all'} onClick={() => setTopic('all')}>
            All
          </FilterChip>
          {topics.map((t) => (
            <FilterChip key={t} active={topic === t} onClick={() => setTopic(t)}>
              {t}
            </FilterChip>
          ))}
        </div>
      )}

      <p className="mb-6 hud-label nums text-text-muted" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'paper' : 'papers'}
      </p>

      {filtered.length === 0 ? (
        <div className="rounded-card border border-divider bg-surface-raised py-16 text-center">
          <p className="text-text-muted">No papers match these filters.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-4 inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <Reveal stagger className="flex flex-col gap-3">
          {filtered.map((paper, i) => (
            <Link
              key={paper._id}
              href={`/research/${paper.slug.current}`}
              className="group relative flex flex-col gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)] sm:flex-row sm:items-center sm:gap-6 sm:p-6"
            >
              <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />

              <span className="hud-label nums shrink-0 text-text-muted transition-colors group-hover:text-primary">
                {String(i + 1).padStart(2, '0')}
              </span>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className={`inline-flex items-center rounded-none px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[paper.status] ?? 'bg-surface-2 text-text-muted'}`}>
                    {STATUS_LABEL[paper.status] ?? paper.status}
                  </span>
                  {paper.conference && (
                    <span className="hud-label nums text-text-muted">
                      {paper.conference} · {paper.year}
                    </span>
                  )}
                </div>

                <h2 className="font-display text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary lg:text-xl">
                  {paper.title}
                </h2>

                {paper.authorNames && paper.authorNames.length > 0 && (
                  <p className="mt-1.5 text-sm text-text-muted">{paper.authorNames.join(', ')}</p>
                )}

                {paper.topics && paper.topics.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {paper.topics.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center whitespace-nowrap rounded-none bg-primary-highlight px-2 py-0.5 text-xs font-medium text-primary"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <span
                aria-hidden
                className="hidden shrink-0 self-center text-text-muted transition-all group-hover:translate-x-0.5 group-hover:text-primary sm:block"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </Reveal>
      )}
    </div>
  )
}

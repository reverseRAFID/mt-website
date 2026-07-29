'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { RichTextBody } from '@/lib/cms/richtext'
import { Reveal } from '@/components/motion/Reveal'
import { Scramble } from '@/components/motion/Scramble'
import { Magnetic } from '@/components/motion/Magnetic'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from './SectionEyebrow'
import type { RichTextValue } from '@/lib/cms/richtext'
import type { Competition } from '@/lib/cms/types'

interface RoverBriefProps {
  overview?: string | null
  description?: RichTextValue
  competition?: Competition | null
  year: number
  teamLead?: string | null
  pdfUrl?: string
  slug: string
}

/**
 * Mission Brief, reframed as an engineering drawing's title-block: the big
 * statement + prose on the left, a sticky spec "title-block" card on the right.
 * The calm orientation beat before the Teardown centerpiece.
 */
export function RoverBrief({
  overview,
  description,
  competition,
  year,
  teamLead,
  pdfUrl,
  slug,
}: RoverBriefProps) {
  const rows: Array<{ label: string; value: ReactNode }> = []
  if (competition) {
    rows.push({
      label: 'Competition',
      value: competition.slug ? (
        <Link
          href={`/competitions/${competition.slug}`}
          className="text-text transition-colors hover:text-primary"
        >
          {competition.shortName} {competition.year}
        </Link>
      ) : (
        `${competition.shortName} ${competition.year}`
      ),
    })
    if (competition.location) rows.push({ label: 'Venue', value: competition.location })
    if (competition.rank)
      rows.push({
        label: 'Result',
        value: `#${competition.rank}${competition.totalTeams ? ` of ${competition.totalTeams}` : ''}`,
      })
    else if (competition.result) rows.push({ label: 'Result', value: competition.result })
  }
  rows.push({ label: 'Year', value: String(year) })
  if (teamLead) rows.push({ label: 'Team Lead', value: teamLead })

  if (!overview && !description && rows.length === 0) return null

  return (
    <section className="relative py-16 lg:py-24">
      <div className="section-container grid gap-10 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <Reveal>
          <SectionEyebrow label="Mission Brief" className="mb-5" />
          {/* decorative trace down the prose gutter */}
          <div className="relative">
            <span
              aria-hidden
              className="absolute -left-4 top-1 hidden h-full w-px bg-divider lg:block"
            />
            {overview && (
              <Scramble
                as="p"
                text={overview}
                start="top 80%"
                className="block max-w-2xl text-balance font-display text-xl font-medium leading-snug tracking-tight text-text sm:text-2xl lg:text-3xl"
              />
            )}
            <RichTextBody
              value={description}
              className="prose prose-sm mt-7 max-w-none leading-relaxed text-text-muted"
            />
          </div>
        </Reveal>

        {rows.length > 0 && (
          <Reveal y={20}>
            <div className="relative rounded-card border border-divider bg-surface-raised lg:sticky lg:top-24">
              <CornerTicks className="text-primary/25" />
              {/* title-block header */}
              <div className="flex items-center justify-between gap-3 border-b border-divider px-5 py-3">
                <span className="hud-label text-text-faint">Spec Sheet</span>
                <span className="hud-label nums text-text-faint">
                  DWG {slug}-{year}
                </span>
              </div>
              <dl className="grid grid-cols-1 gap-px bg-divider">
                {rows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-baseline justify-between gap-4 bg-surface-raised px-5 py-3.5"
                  >
                    <dt className="hud-label text-text-faint">{row.label}</dt>
                    <dd className="text-right text-sm font-medium text-text">{row.value}</dd>
                  </div>
                ))}
              </dl>
              {pdfUrl && (
                <div className="border-t border-divider p-3">
                  <Magnetic strength={0.2} block>
                    <a
                      href={pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-none border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                      </svg>
                      Download SAR PDF
                    </a>
                  </Magnetic>
                </div>
              )}
            </div>
          </Reveal>
        )}
      </div>
    </section>
  )
}

// ============================================================
// Server-side crowdfunding data layer.
//
// SERVER ONLY. Never import this from a `'use client'` module — not because
// it holds secrets (it does not; that is the point) but because keeping the
// boundary sharp is what stops a future edit from casually pulling an amount
// into a client bundle.
//
// Rank is derived here, from array position. Sanity has already sorted by
// `amount desc` inside the query, so the ordering is authoritative while the
// figure behind it never crosses the wire. See src/sanity/lib/queries.ts.
// ============================================================

import { cache } from 'react'
import { sanityFetch } from '@/sanity/lib/client'
import {
  APPROVED_DONATIONS_QUERY,
  TOP_DONATIONS_QUERY,
  APPROVED_DONATION_COUNT_QUERY,
  CROWDFUNDING_CONFIG_QUERY,
} from '@/sanity/lib/queries'
import type { PublicDonation, Supporter, CrowdfundingConfig } from '@/sanity/lib/types'
import {
  DEFAULT_STEPS,
  DEFAULT_FAQ,
  DEFAULT_VERIFICATION_HOURS,
  HIGHLIGHT_RANKS,
} from '@/lib/crowdfunding'

/** ISR window for supporter data — a newly approved donor appears within a minute. */
const REVALIDATE = 60

/** Attach 1-based ranks to an already-ordered list. */
function withRanks(rows: PublicDonation[] | null): Supporter[] {
  return (rows ?? []).map((row, i) => ({ ...row, rank: i + 1 }))
}

/** Every approved supporter, in rank order. */
export async function getSupporters(): Promise<Supporter[]> {
  const rows = await sanityFetch<PublicDonation[] | null>(
    APPROVED_DONATIONS_QUERY,
    {},
    REVALIDATE
  )
  return withRanks(rows)
}

/** The highest-ranked supporters — defaults to the badged band. */
export async function getTopSupporters(limit: number = HIGHLIGHT_RANKS): Promise<Supporter[]> {
  const rows = await sanityFetch<PublicDonation[] | null>(
    TOP_DONATIONS_QUERY,
    { limit },
    REVALIDATE
  )
  return withRanks(rows)
}

export async function getSupporterCount(): Promise<number> {
  const count = await sanityFetch<number | null>(APPROVED_DONATION_COUNT_QUERY, {}, REVALIDATE)
  return count ?? 0
}

/**
 * Campaign settings with editorial fallbacks applied, so /support renders a
 * complete page even before anyone fills the singleton in. A missing document
 * resolves to a closed campaign — failing shut, so a Sanity outage cannot
 * accidentally reopen a finished campaign.
 */
export async function getCrowdfundingConfig(): Promise<CrowdfundingConfig> {
  const config = await sanityFetch<CrowdfundingConfig | null>(
    CROWDFUNDING_CONFIG_QUERY,
    {},
    REVALIDATE
  )

  return {
    status: config?.status ?? 'closed',
    headline: config?.headline,
    pitch: config?.pitch,
    closedMessage: config?.closedMessage,
    verificationHours: config?.verificationHours ?? DEFAULT_VERIFICATION_HOURS,
    showSupporterCount: config?.showSupporterCount ?? true,
    channels: config?.channels ?? [],
    steps: config?.steps?.length ? config.steps : DEFAULT_STEPS.map((s) => ({ ...s })),
    faqItems: config?.faqItems?.length ? config.faqItems : DEFAULT_FAQ.map((f) => ({ ...f })),
  }
}

/** Everything /support needs, in one round of parallel fetches. */
export async function getSupportPageData() {
  const [config, supporters, supporterCount] = await Promise.all([
    getCrowdfundingConfig(),
    getSupporters(),
    getSupporterCount(),
  ])
  return { config, supporters, supporterCount }
}

/** The minimum a support CTA needs to decide whether and what to render. */
export interface SupportCtaData {
  /** False whenever the campaign cannot receive money — CTAs must not render. */
  isOpen: boolean
  supporterCount: number
  deadline?: string
  showSupporterCount: boolean
}

/**
 * Campaign state for the site-wide CTAs.
 *
 * Wrapped in React `cache()` so the dozen-plus pages and the sticky banner that
 * each need this resolve to a single fetch pair per request, rather than one
 * per CTA. The underlying queries are ISR-cached for 60s on top of that.
 *
 * Fails CLOSED on error: if Sanity is unreachable the CTAs disappear rather
 * than inviting money the team may not be able to receive.
 */
export const getSupportCtaData = cache(async (): Promise<SupportCtaData> => {
  try {
    const [config, supporterCount] = await Promise.all([
      getCrowdfundingConfig(),
      getSupporterCount(),
    ])
    return {
      isOpen: config.status === 'open',
      supporterCount,
      deadline: config.deadline,
      showSupporterCount: config.showSupporterCount ?? true,
    }
  } catch (err) {
    console.error('[support-cta] falling back to hidden CTAs:', err)
    return { isOpen: false, supporterCount: 0, showSupporterCount: false }
  }
})

// ============================================================
// Crowdfunding reads — SERVER ONLY.
//
// Replaces src/lib/donations.ts's Sanity half. Never import from a
// `'use client'` module — not because it holds a secret (it does not; that is
// the point) but because keeping the boundary sharp is what stops a future edit
// from casually pulling an amount into a client bundle.
//
// ════════════════════════════════════════════════════════════════════════
// PRIVACY-CRITICAL. Two rules, and the reason each one is written the way it is.
//
//  1. RANK IS PUBLISHED, THE AMOUNT IS NOT.
//     `sort: ['-amount', 'approvedAt']` orders the rows inside MongoDB, and the
//     `select` below does not ask for `amount`. The site receives rows already
//     in rank order and derives the rank from array position, so the figure
//     never leaves the database. Sorting by a field you do not select is the
//     whole trick, and it is the same one APPROVED_DONATIONS_QUERY used.
//
//  2. AN ANONYMOUS DONOR'S REAL NAME IS NOT PUBLISHED.
//     GROQ could resolve this in the query with `select()`. Payload cannot, so
//     `donorName` is fetched and swapped for "Anonymous" in `toPublic()` below
//     — inside the cached function, before anything is returned. What comes out
//     of these functions is the only thing that reaches a page or the data
//     cache, so the real name exists solely as a local variable on the server.
//
// Never add `amount`, `senderAccount`, `transactionId`, `contactEmail`,
// `contactPhone`, `adminNotes`, `rejectionReason` or `verifiedBy` to the
// returned shape. `npm run check:privacy` enforces it.
// ════════════════════════════════════════════════════════════════════════

import { cache } from 'react'

import {
  ANONYMOUS_LABEL,
  DEFAULT_FAQ,
  DEFAULT_STEPS,
  DEFAULT_VERIFICATION_HOURS,
  HIGHLIGHT_RANKS,
} from '@/lib/crowdfunding'

import type { Donation } from '@/payload-types'

import { cachedRead } from './cache'
import { getCms } from './client'

/** A single approved supporter as published. No monetary figure, by design. */
export interface PublicDonation {
  id: string
  /** Already anonymised — safe to render directly. */
  displayName: string
  /** Null for anonymous donors. */
  affiliation?: string | null
  message?: string | null
  approvedAt?: string | null
}

/** A `PublicDonation` with its 1-based position, derived from array index. */
export interface Supporter extends PublicDonation {
  rank: number
}

/** The only fields a supporter row is allowed to carry off the server. */
const PUBLIC_SELECT = {
  donorName: true,
  isAnonymous: true,
  affiliation: true,
  message: true,
  approvedAt: true,
} as const

type Row = {
  id: string | number
  donorName?: string | null
  isAnonymous?: boolean | null
  affiliation?: string | null
  message?: string | null
  approvedAt?: string | null
}

/** Resolve anonymity here, on the server, before anything is returned. */
function toPublic(row: Row): PublicDonation {
  const anonymous = row.isAnonymous === true
  return {
    id: String(row.id),
    displayName: anonymous ? ANONYMOUS_LABEL : (row.donorName ?? ANONYMOUS_LABEL),
    affiliation: anonymous ? null : (row.affiliation ?? null),
    message: row.message ?? null,
    approvedAt: row.approvedAt ?? null,
  }
}

function withRanks(rows: PublicDonation[]): Supporter[] {
  return rows.map((row, i) => ({ ...row, rank: i + 1 }))
}

async function findApproved(limit: number): Promise<PublicDonation[]> {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'donations',
    depth: 0,
    limit,
    // Ordered by the figure, which is then not selected. Ties break on the
    // earlier verification, so an equal donation made first ranks higher.
    sort: ['-amount', 'approvedAt', 'createdAt'],
    where: { status: { equals: 'approved' } },
    select: PUBLIC_SELECT,
  })
  return (docs as Row[]).map(toPublic)
}

/** Every approved supporter, in rank order. */
export const getSupporters = cachedRead('donations:supporters', ['donations'], async () =>
  withRanks(await findApproved(1000))
)

/** The highest-ranked supporters — defaults to the badged band. */
export const getTopSupporters = cachedRead(
  'donations:top',
  ['donations'],
  async (limit: number = HIGHLIGHT_RANKS) => withRanks(await findApproved(limit))
)

export const getSupporterCount = cachedRead(
  'donations:count',
  ['donations'],
  async (): Promise<number> => {
    const cms = await getCms()
    const { totalDocs } = await cms.count({
      collection: 'donations',
      where: { status: { equals: 'approved' } },
    })
    return totalDocs
  }
)

// ── Campaign config ───────────────────────────────────────────

/**
 * Campaign settings with editorial fallbacks, so /support renders a complete
 * page even before anyone fills the global in.
 *
 * A missing document resolves to a CLOSED campaign — failing shut, so a
 * database problem cannot accidentally reopen a finished campaign and invite
 * money the team cannot receive.
 */
export const getCrowdfundingConfig = cachedRead(
  'global:crowdfunding',
  ['crowdfunding'],
  async () => {
    const cms = await getCms()
    const config = await cms.findGlobal({ slug: 'crowdfunding', depth: 0 })

    return {
      status: config?.status ?? 'closed',
      headline: config?.headline ?? undefined,
      pitch: config?.pitch ?? undefined,
      closedMessage: config?.closedMessage ?? undefined,
      deadline: config?.deadline ?? undefined,
      verificationHours: config?.verificationHours ?? DEFAULT_VERIFICATION_HOURS,
      showSupporterCount: config?.showSupporterCount ?? true,
      channels: config?.channels ?? [],
      steps: config?.steps?.length ? config.steps : DEFAULT_STEPS.map((s) => ({ ...s })),
      faqItems: config?.faqItems?.length ? config.faqItems : DEFAULT_FAQ.map((f) => ({ ...f })),
    }
  }
)

export type CrowdfundingConfig = Awaited<ReturnType<typeof getCrowdfundingConfig>>

/** Everything /support needs, in one round of parallel reads. */
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
 * each need this resolve to one pair of reads per request rather than one per
 * CTA. The underlying reads are themselves cached until a donation changes.
 *
 * Fails CLOSED on error: if the database is unreachable the CTAs disappear
 * rather than inviting money the team may not be able to receive.
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
      deadline: config.deadline ?? undefined,
      showSupporterCount: config.showSupporterCount ?? true,
    }
  } catch (err) {
    console.error('[support-cta] falling back to hidden CTAs:', err)
    return { isOpen: false, supporterCount: 0, showSupporterCount: false }
  }
})

// ── Write path ────────────────────────────────────────────────

/**
 * The campaign gate. UNCACHED, deliberately.
 *
 * `getCrowdfundingConfig()` above is cached because it feeds a page. This is
 * the check /api/donate makes before accepting a declaration, and a campaign
 * that closed a minute ago must not still be collecting them.
 *
 * Fails CLOSED, so a database problem cannot reopen a finished campaign.
 */
export async function getCampaignStatus(): Promise<'open' | 'paused' | 'closed'> {
  try {
    const cms = await getCms()
    const config = await cms.findGlobal({ slug: 'crowdfunding', depth: 0 })
    return (config?.status as 'open' | 'paused' | 'closed') ?? 'closed'
  } catch (err) {
    console.error('[crowdfunding] status read failed — treating as closed:', err)
    return 'closed'
  }
}

/**
 * Duplicate guard for /api/donate.
 *
 * Returns a boolean and nothing else, so a probe cannot be used to enumerate
 * transaction IDs — the same reason the GROQ version wrapped its result in
 * `count(...) > 0`.
 */
export async function transactionIdExists(transactionId: string): Promise<boolean> {
  const cms = await getCms()
  const { totalDocs } = await cms.count({
    collection: 'donations',
    where: { transactionId: { equals: transactionId } },
  })
  return totalDocs > 0
}

export interface DonationInput {
  donorName: string
  isAnonymous: boolean
  affiliation?: string
  message?: string
  paymentMethod: string
  senderAccount: string
  transactionId?: string
  contactEmail?: string
  contactPhone?: string
}

/**
 * Record a donor's declaration.
 *
 * Deliberately cannot set `amount`, `status` or `approvedAt` — those are
 * admin-only, so no crafted payload can self-approve or buy a rank. The
 * declaration lands as `pending` and stays invisible until a human matches it
 * against the bank statement.
 */
export async function createDonation(input: DonationInput): Promise<void> {
  const cms = await getCms()
  const data: Partial<Donation> = {
    status: 'pending',
    ...input,
    paymentMethod: input.paymentMethod as Donation['paymentMethod'],
    donatedAt: new Date().toISOString(),
  }
  await cms.create({ collection: 'donations', data: data as Donation })
}

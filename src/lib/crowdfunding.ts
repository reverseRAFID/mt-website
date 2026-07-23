// ============================================================
// Crowdfunding domain constants.
//
// Single source of truth shared by the Sanity `donation` /
// `crowdfundingConfig` schemas, the /api/donate validator, and the /support
// UI. The schemas import this with a RELATIVE path (not the @/ alias) so the
// module resolves under both the Next bundler and the Sanity CLI — same
// convention as src/lib/subteams.ts.
//
// SECURITY NOTE — nothing in this file may reference a donation `amount`.
// Amounts are admin-only and must never reach a browser bundle. See
// docs/crowdfunding-plan.md §2.
// ============================================================

// ── Payment channels ──────────────────────────────────────────
// The rails a donor can send money over. `value` is what gets persisted, so
// renaming an entry is a data migration — add a new one instead.

export const PAYMENT_METHODS = [
  'bKash',
  'Nagad',
  'Rocket',
  'Upay',
  'Bank Transfer',
  'Other',
] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

/** Type guard — true when `value` is one of the supported payment channels. */
export function isPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === 'string' && (PAYMENT_METHODS as readonly string[]).includes(value)
}

/** Channels that settle into a bank account rather than a mobile wallet. */
export const BANK_METHODS: readonly PaymentMethod[] = ['Bank Transfer']

/** Account flavours a mobile-wallet or bank number can have. */
export const ACCOUNT_TYPES = [
  'Personal',
  'Merchant',
  'Agent',
  'Current',
  'Savings',
] as const

export type AccountType = (typeof ACCOUNT_TYPES)[number]

// ── Review pipeline ───────────────────────────────────────────

export const DONATION_STATUSES = ['pending', 'approved', 'rejected'] as const
export type DonationStatus = (typeof DONATION_STATUSES)[number]

// ── Campaign gate ─────────────────────────────────────────────

export const CAMPAIGN_STATUSES = ['open', 'paused', 'closed'] as const
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number]

// ── Rank tiers ────────────────────────────────────────────────
// Ranks 1–5 get a badge and their own colour. The palette deliberately stops
// at three metals plus the house orange: gold/silver/bronze read as *medals*
// rather than as a competing brand accent, so the single-hot-accent system
// survives. Colours resolve through CSS custom properties declared in
// globals.css, so both themes are handled by the tokens.

export type RankTierKey = 'gold' | 'silver' | 'bronze' | 'core' | 'core-outline'

export interface RankTier {
  key: RankTierKey
  /** Badge copy shown next to the supporter's name. */
  label: string
  /** Longer form used for the badge's accessible label. */
  description: string
}

/** Index 0 ⇒ rank 1. Ranks beyond this list are unbadged. */
export const RANK_TIERS: readonly RankTier[] = [
  { key: 'gold', label: 'Gold Patron', description: 'Highest-contributing supporter' },
  { key: 'silver', label: 'Silver Patron', description: 'Second-highest supporter' },
  { key: 'bronze', label: 'Bronze Patron', description: 'Third-highest supporter' },
  { key: 'core', label: 'Top Supporter', description: 'Fourth-highest supporter' },
  { key: 'core-outline', label: 'Top Supporter', description: 'Fifth-highest supporter' },
]

/** How many ranks are singled out with a badge. */
export const HIGHLIGHT_RANKS = RANK_TIERS.length

/** Tier for a 1-based rank, or null once past the highlighted band. */
export function rankTier(rank: number): RankTier | null {
  return RANK_TIERS[rank - 1] ?? null
}

/** Zero-padded rank readout, e.g. 7 → "07". */
export function formatRank(rank: number): string {
  return String(rank).padStart(2, '0')
}

// ── Display name ──────────────────────────────────────────────
// Anonymity is resolved server-side in GROQ (see APPROVED_DONATIONS_QUERY) so
// an anonymous donor's real name never leaves Sanity. This constant is the
// label that stands in for it.

export const ANONYMOUS_LABEL = 'Anonymous'

// ── Field limits ──────────────────────────────────────────────
// Mirrored by the /api/donate validator and the form's maxLength attributes.

export const LIMITS = {
  name: 80,
  affiliation: 60,
  message: 160,
  account: 40,
  transactionId: 40,
  email: 120,
  phone: 30,
} as const

/** Loose account matcher — digits, spaces, dashes and a leading +, 6–40 chars. */
export const ACCOUNT_RE = /^[+\d][\d\s-]{5,39}$/

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Strip formatting so two spellings of one number compare equal. */
export function normalizeAccount(value: string): string {
  return value.replace(/[\s-]/g, '')
}

// ── Copy ──────────────────────────────────────────────────────
// Fallbacks used when the Sanity singleton has not been filled in yet, so
// /support is never a broken page.

export const DEFAULT_STEPS = [
  {
    title: 'Copy an account number',
    body: 'Pick the wallet or bank you want to send from and copy our receiving number.',
  },
  {
    title: 'Send the money',
    body: 'Open your bKash, Nagad, Rocket or banking app and complete the transfer yourself. We never ask for your PIN or OTP.',
  },
  {
    title: 'Declare it here',
    body: 'Come back and tell us which channel you used and the number you sent from, so we can match it to our statement.',
  },
  {
    title: 'We verify and list you',
    body: 'A team member checks the transfer by hand. Once confirmed you appear on the supporters roll — anonymously if you asked for that.',
  },
] as const

export const DEFAULT_FAQ = [
  {
    question: 'Will my donation amount be shown publicly?',
    answer:
      'No. Amounts are never published anywhere on this site. Only the team treasurer sees them. The supporters roll shows your position relative to other supporters, never the figure behind it.',
  },
  {
    question: 'Can I donate anonymously?',
    answer:
      'Yes. Tick "List me as Anonymous" and the roll will show "Anonymous" in place of your name. We still record your name internally so we can match the payment, but it is never published.',
  },
  {
    question: 'Why do you need the number I sent from?',
    answer:
      'It is the only way we can match your declaration against our bKash or bank statement. We verify every entry by hand before it appears. Your number is never published.',
  },
  {
    question: 'How long does verification take?',
    answer:
      'Usually within a couple of days. If we cannot find a matching transfer we will reach out on the email or phone number you leave — so double-check them before submitting.',
  },
  {
    question: 'Will you ever ask for my PIN or OTP?',
    answer:
      'Never. Nobody from Mongol-Tori will ask for your PIN, OTP or password. If someone does, it is not us — please report it.',
  },
] as const

/** Fallback SLA copy when the singleton does not set one. */
export const DEFAULT_VERIFICATION_HOURS = 72

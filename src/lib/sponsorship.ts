/**
 * Sponsorship content model (editorial — not in Sanity).
 *
 * The Sanity `sponsor` document stores who our partners are (name, logo, tier,
 * website, startYear). What each tier *offers*, why a brand should sponsor us,
 * where the money goes, and the FAQ are marketing copy that lives here so the
 * team can edit it without a CMS migration.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TODO(team): search this file for `TODO` — replace the marked placeholder
 * figures (social reach, students reached) and confirm the fund-allocation
 * split and FAQ specifics with the management team before launch.
 * ─────────────────────────────────────────────────────────────────────────
 */

import type { Sponsor } from '@/sanity/lib/types'

/** Shared icon keys — mapped to inline SVGs in the components. */
export type SponsorIcon =
  | 'broadcast'
  | 'globe'
  | 'beaker'
  | 'talent'
  | 'rover'
  | 'trophy'
  | 'handshake'
  | 'calendar'
  | 'rocket'
  | 'graduation'

/** Where to route every sponsorship enquiry. */
export const SPONSOR_EMAIL = 'mongol-tori@bracu.ac.bd'

/** Pre-filled mailto for the "email us" CTAs. */
export const sponsorMailto = (tierLabel?: string) => {
  const subject = tierLabel
    ? `Sponsorship enquiry — ${tierLabel} tier`
    : 'Sponsorship enquiry — BRACU Mongol-Tori'
  const body =
    'Hi Mongol-Tori team,\n\nWe are interested in sponsoring the team. ' +
    'Here is a little about us:\n\n• Organization:\n• What we can offer (funds / parts / services):\n• Goals for the partnership:\n\nLooking forward to talking.'
  return `mailto:${SPONSOR_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/* ============================================================
   IMPACT & REACH
   `tbd: true` = placeholder the team should replace. These render
   with a small "EST." marker so they read as provisional, never
   as a verified figure.
   ============================================================ */
export interface ImpactMetric {
  /** Numeric target for the count-up. */
  value: number
  prefix?: string
  suffix?: string
  label: string
  /** One-line context shown under the label. */
  note?: string
  icon: SponsorIcon
  /** Group thousands (e.g. 50,000). */
  grouping?: boolean
  /** Placeholder figure — render with an "EST." marker. TODO(team): replace. */
  tbd?: boolean
}

export const IMPACT_METRICS: ImpactMetric[] = [
  { value: 60, suffix: '+', label: 'Active members', note: 'Engineers, scientists & managers', icon: 'talent' },
  { value: 7, suffix: '+', label: 'Rovers built', note: 'Since the first prototype in 2018', icon: 'rover' },
  { value: 3, label: 'World competitions', note: 'URC · IRC · ERC', icon: 'globe' },
  { value: 11, prefix: '#', label: 'Best world rank', note: 'URC 2024 — our best result to date', icon: 'trophy' },
  { value: 9, suffix: '+', label: 'Years competing', note: 'Founded at BRAC University in 2017', icon: 'calendar' },
  // TODO(team): replace the two figures below with real analytics numbers.
  { value: 50000, suffix: '+', grouping: true, label: 'Social reach', note: 'Followers across our channels', icon: 'broadcast', tbd: true },
  { value: 2000, suffix: '+', grouping: true, label: 'Students reached', note: 'Through STEM outreach & demos', icon: 'graduation', tbd: true },
]

/* ============================================================
   WHY SPONSOR US — value propositions
   ============================================================ */
export interface ValueProp {
  icon: SponsorIcon
  title: string
  description: string
  /** Optional short proof point, e.g. "URC · ERC · IRC". */
  proof?: string
}

export const VALUE_PROPS: ValueProp[] = [
  {
    icon: 'globe',
    title: 'A global stage',
    description:
      'Your brand travels with us to the University Rover Challenge in Utah, the European Rover Challenge in Poland, and the Indian Rover Challenge — in front of the world’s best engineering teams, judges from NASA & ESA, and international media.',
    proof: 'USA · Poland · India',
  },
  {
    icon: 'broadcast',
    title: 'Brand reach that grows',
    description:
      'Logo placement on the rover and team jersey, your name across our website and event banners, and dedicated social campaigns to an engaged, fast-growing STEM audience in Bangladesh and beyond.',
  },
  {
    icon: 'talent',
    title: 'A direct talent pipeline',
    description:
      'We graduate some of the country’s most capable robotics, embedded-systems and software engineers every year. Sponsors get first access to recruit them and to host lab visits & demos.',
  },
  {
    icon: 'beaker',
    title: 'Real STEM impact',
    description:
      'Every taka funds hands-on learning — components, machining, and travel that turn students into engineers — plus outreach that inspires the next generation across schools and universities.',
  },
]

/* ============================================================
   SPONSORSHIP TIERS — benefits only (pricing handled 1:1)
   ============================================================ */
export interface SponsorTier {
  /** Matches the Sanity sponsor `tier` enum. */
  id: Sponsor['tier']
  label: string
  tagline: string
  benefits: string[]
  /** Visually feature this tier ("Most popular"). */
  highlight?: boolean
  /** Badge text for the highlighted tier. */
  badge?: string
}

export const TIERS: SponsorTier[] = [
  {
    id: 'title',
    label: 'Title Partner',
    tagline: 'Our flagship partnership — your name leads the mission.',
    badge: 'Lead partner',
    benefits: [
      '"Powered by" co-branding across the team & season',
      'Largest logo on the rover chassis and team jersey',
      'Top logo placement site-wide and on all materials',
      'Dedicated social campaign + joint press release',
      'Private lab visit and a live rover demonstration',
      'First access to recruit our graduating engineers',
      'Speaking slot at our events and showcases',
    ],
  },
  {
    id: 'gold',
    label: 'Gold',
    tagline: 'High visibility on the rover, the jersey, and online.',
    highlight: true,
    badge: 'Most popular',
    benefits: [
      'Large logo on the rover and team jersey',
      'Prominent logo on the sponsors page',
      'Quarterly social media shout-outs',
      'Lab visit and rover demonstration',
      'Recruitment access to team members',
      'Certificate of partnership',
    ],
  },
  {
    id: 'silver',
    label: 'Silver',
    tagline: 'Solid brand presence across our channels.',
    benefits: [
      'Medium logo on the rover and website',
      'Social shout-outs on key milestones',
      'Group lab visit',
      'Certificate of partnership',
    ],
  },
  {
    id: 'bronze',
    label: 'Bronze',
    tagline: 'A great way to back the team and get seen.',
    benefits: [
      'Logo on the sponsors page',
      'Logo on our competition banner',
      'Thank-you post on social media',
      'Certificate of partnership',
    ],
  },
  {
    id: 'in-kind',
    label: 'In-Kind',
    tagline: 'Donate parts, tools, services or expertise.',
    benefits: [
      'Recognition for component, service or material support',
      'Logo on the sponsors page',
      'Social thank-you for your contribution',
      'Flexible — give what fits your organization',
    ],
  },
]

/* ============================================================
   BENEFITS COMPARISON MATRIX
   value: true (included) | false (not included) | string (qualified)
   ============================================================ */
export type MatrixValue = boolean | string
export interface BenefitRow {
  feature: string
  title: MatrixValue
  gold: MatrixValue
  silver: MatrixValue
  bronze: MatrixValue
  'in-kind': MatrixValue
}

export const COMPARISON_TIERS: { id: Sponsor['tier']; label: string }[] = [
  { id: 'title', label: 'Title' },
  { id: 'gold', label: 'Gold' },
  { id: 'silver', label: 'Silver' },
  { id: 'bronze', label: 'Bronze' },
  { id: 'in-kind', label: 'In-Kind' },
]

export const BENEFITS_MATRIX: BenefitRow[] = [
  { feature: 'Logo on rover & team jersey', title: 'Largest', gold: 'Large', silver: 'Medium', bronze: false, 'in-kind': false },
  { feature: 'Logo on website (sponsors page)', title: 'Top', gold: 'Prominent', silver: true, bronze: true, 'in-kind': true },
  { feature: 'Logo on competition banner', title: true, gold: true, silver: true, bronze: true, 'in-kind': false },
  { feature: 'Social media shout-outs', title: 'Dedicated campaign', gold: 'Quarterly', silver: 'Milestones', bronze: 'Thank-you post', 'in-kind': 'Thank-you post' },
  { feature: 'Press release / media mention', title: true, gold: false, silver: false, bronze: false, 'in-kind': false },
  { feature: 'Lab visit & rover demo', title: 'Private', gold: true, silver: 'Group', bronze: false, 'in-kind': false },
  { feature: 'Recruitment / talent access', title: 'First access', gold: true, silver: false, bronze: false, 'in-kind': false },
  { feature: 'Title co-branding & speaking slot', title: true, gold: false, silver: false, bronze: false, 'in-kind': false },
]

/* ============================================================
   WHERE YOUR SPONSORSHIP GOES — transparency
   TODO(team): confirm this split with the management team. Illustrative.
   ============================================================ */
export interface FundSlice {
  label: string
  percent: number
  detail: string
}

export const FUND_ALLOCATION: FundSlice[] = [
  { label: 'R&D & components', percent: 40, detail: 'Sensors, actuators, electronics & the science payload' },
  { label: 'Travel & logistics', percent: 30, detail: 'Flights, freight & accommodation for international competitions' },
  { label: 'Manufacturing & tools', percent: 18, detail: 'Machining, fabrication and workshop equipment' },
  { label: 'Outreach & operations', percent: 12, detail: 'STEM demos, events and day-to-day running costs' },
]

/* ============================================================
   HOW IT WORKS — partnership process
   ============================================================ */
export interface ProcessStep {
  title: string
  description: string
}

export const PROCESS_STEPS: ProcessStep[] = [
  {
    title: 'Reach out',
    description:
      'Email us or send a message and tell us a little about your organization and what you’d like the partnership to achieve.',
  },
  {
    title: 'Scope the package',
    description:
      'We tailor a tier and a set of deliverables — branding, demos, recruitment access — around your goals and budget.',
  },
  {
    title: 'Agreement',
    description:
      'We formalize the benefits, branding placements and timeline in a simple written agreement so everyone is aligned.',
  },
  {
    title: 'Activation',
    description:
      'Your logo goes live, demos get scheduled, and your brand joins us on the journey to the next competition season.',
  },
]

/* ============================================================
   FAQ
   ============================================================ */
export interface SponsorFaqItem {
  question: string
  answer: string
}

export const SPONSOR_FAQ: SponsorFaqItem[] = [
  {
    question: 'Where exactly does the money go?',
    answer:
      'Straight into the mission: rover components and the science payload, travel to international competitions, manufacturing and tools, and STEM outreach. See the "Where your sponsorship goes" breakdown above — we’re happy to share a detailed budget on request.',
  },
  {
    question: 'We’re a small company — can we still help?',
    answer:
      'Absolutely. There is no minimum to back the team. Bronze and In-Kind partnerships are designed for smaller organizations, and even a single component or service makes a real difference.',
  },
  {
    question: 'Can we sponsor something specific, like travel or a subsystem?',
    answer:
      'Yes. Targeted and in-kind sponsorships — funding a flight, donating parts, or backing a particular subsystem — are very welcome and come with their own recognition.',
  },
  {
    question: 'How long does a sponsorship last?',
    answer:
      'A typical partnership runs for one competition season (about a year) and is renewable. We’re flexible and can scope shorter or multi-year arrangements.',
  },
  {
    question: 'What do we get in return?',
    answer:
      'Brand visibility on the rover, jersey, website and at events; social campaigns; lab visits and demos; and access to recruit our engineers — scaled to your tier. See the comparison table for the full breakdown.',
  },
  {
    // TODO(team): confirm the exact payment route & whether receipts are tax-deductible.
    question: 'How do we pay, and is it tax-deductible?',
    answer:
      'Sponsorships are arranged through BRAC University and we’ll issue the appropriate documentation. Get in touch and we’ll walk you through the process for your organization.',
  },
]

// ============================================================
// Support CTA copy registry.
//
// Every crowdfunding call-to-action on the site draws its words from here, so
// the campaign speaks with one voice and the team can retune the pitch without
// touching component code.
//
// WHY CONTEXTUAL COPY — people give right after they have been impressed, not
// when a generic banner asks them to. The visitor who just read a 3rd-place
// result and the visitor who just browsed the rover gallery are in different
// frames of mind, and a single "Support us" line serves neither well. Each
// placement therefore names the thing the visitor has just been looking at and
// connects it to something the money buys.
//
// Keep every `body` to one or two sentences: these are interruptions, and a
// long one gets skipped.
// ============================================================

export type SupportCtaKey =
  | 'rovers'
  | 'roverDetail'
  | 'competitions'
  | 'achievements'
  | 'team'
  | 'teamDetail'
  | 'research'
  | 'news'
  | 'newsDetail'
  | 'gallery'
  | 'sarVideos'
  | 'outreach'
  | 'about'
  | 'join'
  | 'sponsors'
  | 'contact'

export interface SupportCtaCopy {
  /** Mono kicker above the headline. */
  kicker: string
  headline: string
  body: string
  /** Primary button label. Should read as an action, not a noun. */
  action: string
}

/**
 * Copy per placement. `action` labels vary intentionally — a page full of
 * identical "Donate now" buttons reads as an ad network; varied, specific verbs
 * read as a team asking for help.
 */
export const SUPPORT_CTA_COPY: Record<SupportCtaKey, SupportCtaCopy> = {
  rovers: {
    kicker: 'Fund the build',
    headline: 'Every rover on this page was paid for by someone',
    body: 'Actuators, machined parts, PCBs, cabling — the team designs it all, but none of it is free. Individual contributions are what turn a CAD file into hardware.',
    action: 'Fund the next rover',
  },
  roverDetail: {
    kicker: 'Fund the build',
    headline: 'This machine exists because people chipped in',
    body: 'Every subsystem you just read about started as a parts order somebody paid for. Help us build the next one.',
    action: 'Fund the next build',
  },
  competitions: {
    kicker: 'Get us there',
    headline: 'Building the rover is half the problem',
    body: 'The other half is freight, visas and airfare to Utah or Poland. We can engineer our way around a lot of things — a plane ticket is not one of them.',
    action: 'Help us get there',
  },
  achievements: {
    kicker: 'Get us there',
    headline: 'Results like these need a plane ticket',
    body: 'Every ranking on this page came after a shipping crate and a dozen air fares. Backing the team is what keeps us on the start line.',
    action: 'Back the next run',
  },
  team: {
    kicker: 'Back the crew',
    headline: 'Back the students, not just the machine',
    body: 'Everyone here is a full-time student building a Mars rover in their spare hours. Your support pays for the parts so they can spend that time engineering.',
    action: 'Back the team',
  },
  teamDetail: {
    kicker: 'Back the crew',
    headline: 'Support the people doing this work',
    body: 'Members fund a surprising amount of this themselves. A contribution takes that weight off a student who is already carrying a full course load.',
    action: 'Back the team',
  },
  research: {
    kicker: 'Fund the work',
    headline: 'Papers start as hardware that has to be bought',
    body: 'Test rigs, sensors and field trials come before publication. Contributions keep the experimental side of the team running.',
    action: 'Fund the research',
  },
  news: {
    kicker: 'Keep it moving',
    headline: 'Want more updates like these?',
    body: 'Every milestone on this page took parts, travel and workshop time. Supporters are what keep the next one coming.',
    action: 'Support the mission',
  },
  newsDetail: {
    kicker: 'Keep it moving',
    headline: 'Enjoyed this? Help us write the next one',
    body: 'Progress like this runs on components and competition entries. It takes a minute to chip in — and your amount is never published.',
    action: 'Support the mission',
  },
  gallery: {
    kicker: 'Fund the build',
    headline: 'Everything in these photos had to be paid for',
    body: 'Chassis, arms, cameras, the workshop time behind them. Contributions from individuals are a real slice of how it gets funded.',
    action: 'Fund the next build',
  },
  sarVideos: {
    kicker: 'Fund the build',
    headline: 'Watching is free. Building it was not',
    body: 'Every run you just watched is the output of parts, repairs and a lot of failed attempts. Help us keep the rovers rolling.',
    action: 'Keep us rolling',
  },
  outreach: {
    kicker: 'Widen the reach',
    headline: 'Help us reach the next classroom',
    body: 'Outreach sessions need transport, demo hardware and materials we give away. Supporters make the free-to-attend part possible.',
    action: 'Support outreach',
  },
  about: {
    kicker: 'Join the story',
    headline: 'Be part of what happens next',
    body: 'Mongol-Tori has run on people who decided to help since 2013. Adding your name to the supporters roll is one of the simplest ways to do it.',
    action: 'Support the mission',
  },
  join: {
    // The highest-intent audience on the site: people who wanted in and cannot
    // get in. Catching them here is the single best-converting placement.
    kicker: 'Another way in',
    headline: 'Not a BRACU student? You can still back us',
    body: 'Applications are only open to BRAC University students — but supporting the team is open to anyone, anywhere. Alumni, parents and fans all sit on the same roll.',
    action: 'Back the team',
  },
  sponsors: {
    // Complements the corporate funnel rather than competing with it.
    kicker: 'For individuals',
    headline: 'Not representing a company?',
    body: 'Sponsorship is built for organisations. If you want to back the team as a person, the crowdfunding roll is the way in — no invoices, no contracts.',
    action: 'Give as an individual',
  },
  contact: {
    kicker: 'Support us',
    headline: 'Looking to support the team?',
    body: 'You do not need to email us first. Send through bKash, Nagad, Rocket or bank transfer and tell us about it in one short form.',
    action: 'Support the mission',
  },
}

/** Where every support CTA points. Single constant so the route can move. */
export const DONATE_HREF = '/support/donate'
export const SUPPORT_HREF = '/support'
export const SUPPORTERS_HREF = '/support#supporters'

/**
 * Whole days remaining until `deadline`, or null when there is no usable
 * countdown.
 *
 * Returns null for an absent, unparseable or already-passed deadline so a
 * stale config can never render "-3 days left". Counts up from the current
 * instant and rounds up, so the final partial day still reads "1 day left"
 * rather than "0".
 */
export function daysLeft(deadline?: string | null): number | null {
  if (!deadline) return null
  const end = new Date(deadline).getTime()
  if (Number.isNaN(end)) return null
  const ms = end - Date.now()
  if (ms <= 0) return null
  return Math.max(1, Math.ceil(ms / 86_400_000))
}

/**
 * Urgency line for a deadline, or null when there is nothing urgent to say.
 * Stays quiet until the last three weeks — a countdown running for months
 * reads as decoration and stops being noticed when it finally matters.
 */
export function urgencyLabel(deadline?: string | null): string | null {
  const days = daysLeft(deadline)
  if (days === null || days > 21) return null
  if (days === 1) return 'Last day to contribute'
  return `${days} days left`
}

/**
 * Social-proof line for a supporter count, or null when there is nothing
 * flattering to say. Stays silent below five so the campaign never advertises
 * its own emptiness — "Join 2 supporters" is worse than no line at all.
 */
export function socialProofLabel(count: number): string | null {
  if (count < 5) return null
  return `Join ${count} supporters`
}

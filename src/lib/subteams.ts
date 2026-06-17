// ============================================================
// Mongol-Tori recruiting sub-teams.
//
// APPLY_SUBTEAMS — the full set applicants can choose from. This is the
//   single source of truth for the apply form dropdown, the /api/apply
//   validation, and the Sanity `application` schema options. The names MUST
//   stay identical to the sub-team cards on /join (src/app/join/page.tsx),
//   which annotates its array with `ApplySubteam` so drift fails the build.
//
// MARQUEE_SUBTEAMS — the shorter, flagship names shown in the homepage
//   marquee (the 2nd scrolling band). Intentionally a curated subset with
//   simplified labels; not used for validation.
// ============================================================

export const APPLY_SUBTEAMS = [
  'Mechanical & CAD',
  'Electronics',
  'Controls & Software',
  'Network & Vision',
  'AI & Autonomous',
  'Astrobio & Science',
  'Unmanned Aerial Vehicles',
  'Management & Outreach',
  'Research & Documentation',
] as const

export type ApplySubteam = (typeof APPLY_SUBTEAMS)[number]

/** Type guard — true when `value` is one of the selectable sub-team names. */
export function isApplySubteam(value: unknown): value is ApplySubteam {
  return typeof value === 'string' && (APPLY_SUBTEAMS as readonly string[]).includes(value)
}

export const MARQUEE_SUBTEAMS = [
  'Mechanical',
  'AI & Autonomous',
  'Electronics',
  'Science',
  'Controls & Software',
  'Network and Vision',
] as const

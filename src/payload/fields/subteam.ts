import type { Option } from 'payload'

import { SUBTEAM_LABEL } from '../../lib/subteam-style'

/**
 * The sub-team option list, derived from the styling map rather than retyped.
 *
 * SUBTEAM_COLORS/SUBTEAM_LABEL in src/lib/subteam-style.ts already had to be
 * the single source of truth — a badge with no colour entry renders unstyled —
 * so building the CMS dropdown from the same object removes the one way the two
 * could drift. The Sanity schemas kept a hand-written copy in two files and a
 * comment asking people to keep them in sync; this makes that impossible to get
 * wrong.
 */
export const SUBTEAM_OPTIONS: Option[] = Object.entries(SUBTEAM_LABEL).map(([value, label]) => ({
  label,
  value,
}))

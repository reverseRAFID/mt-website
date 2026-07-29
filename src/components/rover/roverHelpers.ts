// ============================================================
// Shared helpers for the rover product-landing components.
// ============================================================
import type { MediaRef } from '@/lib/cms/media'
import { SUBTEAM_COLORS, labelFor } from '@/lib/subteam-style'

export { SUBTEAM_COLORS, labelFor }

/** Roman-ish two-digit index, e.g. 1 -> "01". */
export const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * Split a spec value into a leading number and the trailing unit/text so the
 * number can be animated with a counter while the unit stays static.
 * "3.3 km NLoS" -> { num: 3.3, decimals: 1, prefix: "", suffix: " km NLoS" }
 * Returns null when there's no clean leading number to animate.
 */
export function parseStat(value: string): {
  num: number
  decimals: number
  prefix: string
  suffix: string
} | null {
  const m = value.match(/^(\D*?)(-?\d+(?:\.\d+)?)(.*)$/)
  if (!m) return null
  const [, prefix, numStr, suffix] = m
  const num = Number(numStr)
  if (!Number.isFinite(num)) return null
  const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0
  return { num, decimals, prefix, suffix }
}

/** A short, glanceable label for a subteam used on section eyebrows. */
export const subteamLabel = (key?: string) => (key ? labelFor(key) : 'System')

/**
 * The image that represents a rover: its featured shot, or the first gallery
 * photo when none was chosen.
 *
 * Sanity did this with `coalesce(featuredImage, gallery[0])` inside the query.
 * Payload has no query-level coalesce, so it happens here — in one place, so
 * the fleet grid, the hero, the OG card and the sibling strip cannot disagree
 * about which photo a rover is known by.
 */
export function roverHeroImage(rover: {
  featuredImage?: unknown
  gallery?: unknown[] | null
}): MediaRef {
  return (rover.featuredImage as MediaRef) ?? ((rover.gallery?.[0] as MediaRef) ?? null)
}

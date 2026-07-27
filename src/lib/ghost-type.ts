import type { CSSProperties } from 'react'

/**
 * Advance widths, in em, of Space Grotesk Bold — the display face every
 * oversized background watermark is set in.
 *
 * A watermark is supposed to span the whole screen, and a single `vw`
 * font-size can never do that: at one size "FAQ" leaves half the viewport
 * empty while "PARTNERSHIPS" runs miles past both edges. Measuring the word
 * lets CSS divide a target bleed width by its actual em width instead, so
 * every watermark lands at the same optical scale. Decorative sizing only —
 * an unlisted glyph falls back to the uppercase average, which just makes the
 * word bleed slightly more or less.
 */
const ADVANCE_EM: Record<string, number> = {
  A: 0.634, B: 0.664, C: 0.644, D: 0.666, E: 0.554, F: 0.534,
  G: 0.662, H: 0.656, I: 0.264, J: 0.61, K: 0.626, L: 0.542,
  M: 0.882, N: 0.67, O: 0.676, P: 0.604, Q: 0.676, R: 0.632,
  S: 0.606, T: 0.588, U: 0.672, V: 0.618, W: 0.898, X: 0.644,
  Y: 0.624, Z: 0.576, 0: 0.648, 1: 0.452, 2: 0.594, 3: 0.608,
  4: 0.636, 5: 0.6, 6: 0.618, 7: 0.554, 8: 0.6, 9: 0.618,
  ' ': 0.254, '-': 0.432, '.': 0.298, ',': 0.294, "'": 0.294,
  '&': 0.591, '/': 0.388, ':': 0.298, '+': 0.62,
}

const AVG_ADVANCE_EM = 0.632

/** Keep in sync with the `letter-spacing` on `.ghost-word` in globals.css. */
const TRACKING_EM = 0.05

/**
 * Width of `text` in em once set as a ghost word. `.ghost-word` divides its
 * target bleed width by this, so it must never reach zero.
 */
export function ghostUnits(text: string): number {
  const word = text.toUpperCase()
  let em = 0
  for (const ch of word) em += ADVANCE_EM[ch] ?? AVG_ADVANCE_EM
  return Math.max(em - word.length * TRACKING_EM, 1)
}

/** Inline style handing `.ghost-word` the measured width of its own text. */
export function ghostStyle(text: string): CSSProperties {
  return { '--ghost-units': ghostUnits(text) } as CSSProperties
}

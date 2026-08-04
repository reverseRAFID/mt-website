/**
 * next/image loader — delegates resizing to Cloudinary.
 *
 * Wired up as `images.loader: 'custom'` in next.config.mjs, so it runs for
 * EVERY <Image> on the site. That is the reason it passes non-Cloudinary URLs
 * straight through: the BRACU and team logos are local SVGs, and a loader that
 * mangled them would break the header on every page.
 *
 * What this buys, versus letting Next optimise Cloudinary originals:
 *
 *   • one hop instead of two — the browser fetches from Cloudinary's CDN rather
 *     than from our server, which fetches from Cloudinary
 *   • `f_auto` picks AVIF or WebP per browser; Next's optimiser would have to
 *     re-encode what Cloudinary already encoded
 *   • no Vercel image-optimisation usage at all
 *
 * `c_limit` rather than `c_fill`: this only ever narrows an image to the width
 * the layout asked for. Cropping is a decision for the call site (`cldUrl`), not
 * for a loader that has no idea what the image is of.
 */

import { cldTransform } from './cloudinary-url'

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string
  width: number
  quality?: number
}): string {
  return cldTransform(src, `f_auto,q_${quality ?? 'auto'},w_${width},c_limit`) ?? src
}

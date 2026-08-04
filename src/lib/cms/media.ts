// ============================================================
// Images and files.
//
// This is the direct replacement for Sanity's `urlFor()`, and it works the same
// way again: images live on Cloudinary, and any size is a URL away.
//
// That is worth stating because it was briefly not true. Sanity built a URL per
// call — `urlFor(img).width(440).height(550).url()` — and this codebase had 27
// distinct width/height/crop combinations. Payload has no image service of its
// own; it resizes with sharp at UPLOAD time into a fixed set, which cannot
// express an arbitrary crop, so the first cut of the migration worked around it
// with four stored sizes and let CSS do the cropping.
//
// Cloudinary removes the workaround. `cldUrl()` builds a transformation on
// demand, `f_auto` negotiates AVIF or WebP per browser, `q_auto` picks a quality
// per image, and `g_auto` chooses the crop region — so nothing is generated in
// advance and nothing has to be regenerated when a design changes.
//
// `next/image` is still used everywhere, but it no longer resizes: the custom
// loader in `cloudinary-loader.ts` hands the width to Cloudinary instead. We get
// the srcset and the layout behaviour without paying for the optimisation twice.
// ============================================================

import type { Document as PayloadDocument, Media } from '@/payload-types'

import { cldParams, cldTransform, type CldOptions } from './cloudinary-url'

/** A Payload upload field is `string | Media` depending on the query depth. */
export type MediaRef = string | Media | null | undefined
export type DocumentRef = string | PayloadDocument | null | undefined


/**
 * Resolve an upload field to the document, or null.
 *
 * Returns null for an unpopulated reference (a bare id string) rather than
 * throwing: a query run at the wrong depth should degrade to "no image", not
 * take the page down.
 */
export function media(ref: MediaRef): Media | null {
  return ref && typeof ref === 'object' ? ref : null
}

/** Same, for the `documents` collection (PDFs, .glb models). */
export function file(ref: DocumentRef): PayloadDocument | null {
  return ref && typeof ref === 'object' ? ref : null
}

/** Resolve a list of upload refs, dropping any that are unpopulated. */
export function mediaList(refs: MediaRef[] | null | undefined): Media[] {
  return (refs ?? []).map(media).filter((m): m is Media => m !== null)
}

/**
 * Props for `next/image`, or null when there is no image.
 *
 * Spread it: `{...imageProps(rover.featuredImage)}`. Width and height come from
 * the stored dimensions so the browser reserves the right space and the page
 * does not shift as images load.
 */
export function imageProps(
  ref: MediaRef,
  altOverride?: string
): { src: string; width: number; height: number; alt: string } | null {
  const m = media(ref)
  if (!m?.url) return null
  return {
    src: m.url,
    width: m.width ?? 1600,
    height: m.height ?? 900,
    alt: altOverride ?? m.alt ?? '',
  }
}

/**
 * A delivery URL at a specific size.
 *
 * Returns the original untouched when Cloudinary is not configured — local
 * development without credentials still renders, just without transformation.
 */
export function cldUrl(ref: MediaRef, options: CldOptions): string | null {
  const url = media(ref)?.url
  if (!url) return null
  return cldTransform(url, cldParams(options))
}

/**
 * An absolute URL, for contexts that leave the site.
 *
 * Order emails and Open Graph tags are read by clients that have no idea what
 * origin the relative path was relative to. Uploads served from the local
 * filesystem are same-origin relative paths; object storage already returns
 * absolute ones, so this leaves those alone.
 */
export function absoluteUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  return base ? `${base}${url.startsWith('/') ? '' : '/'}${url}` : url
}

/**
 * The inverse of {@link absoluteUrl} — drop our own origin, keep the path.
 *
 * Payload absolutises upload URLs against `serverURL` when it reads them, which
 * is right for rendering and wrong for STORING. An absolute URL frozen into an
 * order outlives the origin it was built from: move the site to a new domain and
 * every historical order's thumbnail 404s. Anything persisted keeps the path,
 * and absolutises again at the moment it is used.
 *
 * A URL on some other host is left alone — it was never ours to shorten.
 */
export function relativeUrl(url: string | null | undefined): string | null {
  if (!url) return null
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '')
  if (base && url.startsWith(base)) return url.slice(base.length) || '/'
  return url
}

/**
 * A 160×160 crop, absolute. For order emails and cart line images.
 *
 * An email client cannot call an image optimiser, so this has to be a real URL
 * at a real size — which is exactly what a Cloudinary transformation is.
 */
export function emailImageUrl(ref: MediaRef): string | undefined {
  return absoluteUrl(cldUrl(ref, { width: 160, height: 160, crop: 'fill' })) ?? undefined
}

/**
 * A 1200×630 crop, absolute. For Open Graph and Twitter cards.
 *
 * Scrapers do not run JavaScript and want a stable URL at exact dimensions.
 */
export function ogImageUrl(ref: MediaRef): string | undefined {
  return absoluteUrl(cldUrl(ref, { width: 1200, height: 630, crop: 'fill' })) ?? undefined
}

/** A square thumbnail. Used by the admin list views. */
export function thumbUrl(ref: MediaRef, size = 320): string | null {
  return cldUrl(ref, { width: size, height: size, crop: 'fill' })
}

/** Alt text, with the caption as a fallback and then the empty string. */
export function altText(ref: MediaRef, fallback = ''): string {
  const m = media(ref)
  return m?.alt || m?.caption || fallback
}

/** A media caption, when one was set. */
export function caption(ref: MediaRef): string | undefined {
  return media(ref)?.caption ?? undefined
}

// ── YouTube ───────────────────────────────────────────────────

/** The video id from any of the URL shapes people paste. */
export function getYouTubeID(url: string): string | null {
  return url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([^&\n?#/]+)/)?.[1] ?? null
}

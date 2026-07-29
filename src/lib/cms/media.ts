// ============================================================
// Images and files.
//
// This replaces `urlFor()` from the Sanity client, and it works differently
// enough to be worth explaining.
//
// Sanity built a URL per call — `urlFor(img).width(440).height(550).url()` —
// and the codebase had 27 distinct width/height/crop combinations. Payload
// resizes at upload time into a fixed set of sizes, so there is no equivalent
// of an arbitrary on-the-fly crop.
//
// It turns out not to need one. Nearly all of those 27 combinations were doing
// two separable things: picking a sensible download size, and forcing an aspect
// ratio. `next/image` already does the first, better — it emits a srcset and
// serves the width the device actually needs. The second is a layout concern,
// and every one of those call sites already sits inside a fixed-size container
// with `object-cover`.
//
// So the site hands `next/image` the original and lets CSS crop. The stored
// sizes exist only for the places `next/image` cannot reach: order emails
// (an email client cannot call the image optimiser) and Open Graph cards
// (scrapers want a stable absolute URL at exact dimensions).
// ============================================================

import type { Document as PayloadDocument, Media } from '@/payload-types'

/** A Payload upload field is `string | Media` depending on the query depth. */
export type MediaRef = string | Media | null | undefined
export type DocumentRef = string | PayloadDocument | null | undefined

/** The stored sizes, from src/payload/collections/Media.ts. */
export type MediaSize = 'email' | 'card' | 'og' | 'hero'

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

/** The URL of a specific stored size, falling back to the original. */
export function sizeUrl(ref: MediaRef, size: MediaSize): string | null {
  const m = media(ref)
  if (!m) return null
  return m.sizes?.[size]?.url ?? m.url ?? null
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

/** The 160×160 stored crop, absolute. For order emails and cart line images. */
export function emailImageUrl(ref: MediaRef): string | undefined {
  return absoluteUrl(sizeUrl(ref, 'email')) ?? undefined
}

/** The 1200×630 stored crop, absolute. For Open Graph and Twitter cards. */
export function ogImageUrl(ref: MediaRef): string | undefined {
  return absoluteUrl(sizeUrl(ref, 'og')) ?? undefined
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

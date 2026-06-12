import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

// ── Client ─────────────────────────────────────────────────────
// Uses next-sanity's createClient for built-in Next.js ISR cache support
export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'replace-me',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ── Image URL builder ──────────────────────────────────────────
const builder = imageUrlBuilder(sanityClient)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function urlFor(source: any) {
  return builder.image(source)
}

// ── YouTube helper ─────────────────────────────────────────────
export function getYouTubeID(url: string): string | null {
  return url.match(/(?:youtu\.be\/|v=)([^&\n?#]+)/)?.[1] ?? null
}

// ── Sanity file CDN URL ────────────────────────────────────────
export function getFileUrl(assetRef: string): string {
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'replace-me'
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
  // ref format: "file-<id>-<ext>"
  const [, id, ext] = assetRef.split('-')
  return `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}`
}

// ── Typed fetch helper ─────────────────────────────────────────
// revalidate controls ISR cache lifetime in seconds (default 60s)
export async function sanityFetch<T>(
  query: string,
  params: Record<string, unknown> = {},
  revalidate = 60
): Promise<T> {
  return sanityClient.fetch<T>(query, params, {
    next: { revalidate },
  })
}

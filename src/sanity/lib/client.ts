// TRANSITIONAL — this module is deleted once the Payload migration lands.
// See docs/payload-migration-plan.md. It reads from `@sanity/client` directly
// rather than `next-sanity`, which peer-depends on Next 15 and so cannot be
// installed alongside the Next 16 that Payload requires.
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'replace-me'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

// ── Client (token-less) ────────────────────────────────────────
// Safe to import from client components — backs urlFor() (which only needs
// projectId/dataset to build CDN URLs, never a token).
export const sanityClient = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
})

// ── Server read client (token) ─────────────────────────────────
// Reads work even when the dataset is private / role-restricted. The token is
// read from a server-only env var (NOT prefixed NEXT_PUBLIC), so Next replaces
// it with `undefined` in client bundles — it never reaches the browser. Used
// only by sanityFetch(), which runs in Server Components / route handlers.
// Prefer a dedicated read-only token (SANITY_API_READ_TOKEN); falls back to the
// write token so a single-token setup keeps working.
// `perspective: 'published'` makes a tokened read behave like an anonymous one
// — only published documents, never drafts — which is what a public site wants.
const readToken = process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_TOKEN
const readClient = readToken
  ? createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token: readToken, perspective: 'published' })
  : sanityClient

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
  return readClient.fetch<T>(query, params, {
    next: { revalidate },
  })
}

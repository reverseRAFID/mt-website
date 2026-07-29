import type { CollectionConfig, GlobalConfig } from 'payload'

import { revalidateTag } from 'next/cache'

/**
 * Cache invalidation for CMS content.
 *
 * ── What this replaces ────────────────────────────────────────
 * Every Sanity read was a `fetch()` with `next: { revalidate: 60 }`, so a
 * published change took up to a minute to appear and every page paid a
 * background refetch on a timer whether or not anything had changed.
 *
 * Payload's Local API is an in-process function call, not a fetch, so that
 * mechanism is simply gone — which turns out to be an improvement. Reads are
 * wrapped in `unstable_cache` keyed by a per-collection tag (see
 * src/lib/cms/cache.ts) and busted here, the moment a document is saved. The
 * site is now exactly as fresh as the CMS, with no polling.
 */
export const cacheTagFor = (collection: string) => `cms:${collection}`

/**
 * Bust a tag, tolerating being called outside a request.
 *
 * Payload hooks fire from three places: the admin UI (inside a Next request —
 * this works), our own route handlers (same), and CLI scripts like the Sanity
 * migration and the dev seeder (no Next context at all, where `revalidateTag`
 * throws). A migration that dies two thousand documents in because it could not
 * clear a cache that is not running would be an absurd failure mode.
 */
function bust(collection: string): void {
  try {
    revalidateTag(cacheTagFor(collection), 'max')
  } catch {
    // No Next request scope — a CLI script. Nothing is cached, so nothing to do.
  }
}

/** Standard afterChange/afterDelete pair for a content collection. */
export function revalidateCollection(slug: string): CollectionConfig['hooks'] {
  return {
    afterChange: [
      ({ doc }) => {
        bust(slug)
        return doc
      },
    ],
    afterDelete: [
      ({ doc }) => {
        bust(slug)
        return doc
      },
    ],
  }
}

/** Same, for a global. */
export function revalidateGlobal(slug: string): GlobalConfig['hooks'] {
  return {
    afterChange: [
      ({ doc }) => {
        bust(slug)
        return doc
      },
    ],
  }
}

export { bust as revalidateCollectionTag }

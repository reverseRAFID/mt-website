// ============================================================
// Read caching for CMS content.
//
// Sanity reads were `fetch()` calls with `next: { revalidate: 60 }`. The Payload
// Local API is an in-process function call, so that mechanism does not exist
// here and something has to replace it — otherwise every render of every page
// hits MongoDB again.
//
// The replacement is tag-based, and it is better than what it replaces:
// content is cached until it changes, and the collection's afterChange hook
// clears the tag the instant somebody saves. Publishing is immediate rather
// than up to a minute late, and there is no background refetch on a timer.
// ============================================================

import { unstable_cache } from 'next/cache'

import { cacheTagFor } from '@/payload/hooks/revalidate'

/**
 * Backstop expiry.
 *
 * Everything here is invalidated on write, so this only matters if a hook
 * fails to fire — a deploy mid-save, a direct database edit, a document changed
 * by a script that ran outside a request. An hour is short enough that such a
 * gap heals on its own and long enough that it never does real work.
 */
const BACKSTOP_TTL = 3600

/**
 * Wrap a read so it is cached until one of `collections` changes.
 *
 * `name` must be unique per function — it is the cache key prefix, and two
 * functions sharing one would serve each other's results. Arguments are folded
 * into the key automatically, so a parameterised read caches per-argument.
 *
 * DO NOT wrap anything that must be fresh. Stock counts at checkout, the shop
 * open/closed gate and order lookups all read uncached, exactly as they used
 * `revalidate: 0` before — a minute-old "in stock" badge sends a customer to a
 * checkout that then rejects them.
 *
 * DO NOT return a private field from inside one of these. The return value is
 * serialised into Next's data cache; a donation `amount` or a customer address
 * that goes in here is written to disk. Map to the public shape *inside* the
 * cached function, not after it.
 */
export function cachedRead<A extends unknown[], R>(
  name: string,
  collections: string[],
  fn: (...args: A) => Promise<R>
): (...args: A) => Promise<R> {
  return unstable_cache(fn, [name], {
    tags: collections.map(cacheTagFor),
    revalidate: BACKSTOP_TTL,
  })
}

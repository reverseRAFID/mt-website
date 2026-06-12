import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// Lazily create the Neon client so importing this module never requires
// DATABASE_URL. This keeps `next build` (which evaluates route modules while
// collecting page data) working even when the env var is absent, e.g. on the
// Vercel build runner before secrets are configured. The connection is created
// on first query at runtime and reused thereafter.
let sql: NeonQueryFunction<false, false> | null = null

export function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    const url = process.env.DATABASE_URL
    if (!url) {
      throw new Error('DATABASE_URL is not set')
    }
    sql = neon(url)
  }
  return sql
}

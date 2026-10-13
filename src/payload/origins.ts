/**
 * The origins the admin is allowed to act from.
 *
 * ── Why this exists ───────────────────────────────────────────
 * Payload's `csrf` list is an exact-match allowlist on the browser's `Origin`
 * header. When a request carries an Origin that is not on it, Payload does not
 * reject the request, it silently ignores the login cookie. Page navigations
 * send no Origin, so the admin looks perfectly logged in, and then every server
 * function (opening the upload drawer, building form state, adding a logo to a
 * sponsor) fails with "Unauthorized, you must be logged in to make this
 * request."
 *
 * The list used to be `[NEXT_PUBLIC_SITE_URL]` verbatim, which breaks on any
 * difference at all between that string and the address bar: `www.` vs the
 * apex, `http` behind a TLS-terminating proxy, a trailing slash, or a localhost
 * value inlined into a production build (`NEXT_PUBLIC_*` is fixed at build
 * time, not read at startup).
 *
 * So every configured URL is reduced to its origin, and its `www.`/apex and
 * http/https twins are added. These are all hosts we own, so the allowlist
 * still says "only our own site", which is the whole point of it.
 * `PAYLOAD_ALLOWED_ORIGINS` (comma-separated, read at runtime) covers anything
 * else, e.g. reaching the admin on the server's IP and port.
 */

/** `https://example.com/` → `https://example.com`, or null if not a URL. */
export function toOrigin(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null
  try {
    const { origin } = new URL(trimmed)
    return origin === 'null' ? null : origin
  } catch {
    return null
  }
}

const isLocal = (hostname: string) =>
  hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]'

const isIp = (hostname: string) => /^[\d.]+$/.test(hostname) || hostname.startsWith('[')

/** The origin plus its www/apex and http/https twins. */
function variants(origin: string): string[] {
  const url = new URL(origin)
  const port = url.port ? `:${url.port}` : ''
  const hosts = [url.hostname]
  if (!isLocal(url.hostname) && !isIp(url.hostname)) {
    hosts.push(
      url.hostname.startsWith('www.') ? url.hostname.slice(4) : `www.${url.hostname}`
    )
  }
  return hosts.flatMap((host) => [`https://${host}${port}`, `http://${host}${port}`])
}

/**
 * Every origin the admin may send requests from.
 *
 * Each entry may be a full URL or a comma-separated list of them (the shape of
 * PAYLOAD_ALLOWED_ORIGINS); anything that does not parse is skipped.
 */
export function allowedOrigins(...entries: (string | undefined)[]): string[] {
  const out = new Set<string>()
  for (const entry of entries.flatMap((e) => (e ?? '').split(','))) {
    const origin = toOrigin(entry)
    if (origin) variants(origin).forEach((o) => out.add(o))
  }
  return [...out]
}

/** True when a production server was configured with a localhost site URL. */
export function isLocalhostInProduction(siteURL: string | undefined): boolean {
  const site = toOrigin(siteURL)
  return (
    process.env.NODE_ENV === 'production' && site !== null && isLocal(new URL(site).hostname)
  )
}

/**
 * Asserts the admin accepts its login cookie from our own origins and only
 * those, using Payload's real cookie extractor against the real config.
 *
 *   npm run check:origins
 *   NEXT_PUBLIC_SITE_URL=https://bracumongoltori.com npm run check:origins
 *
 * Regression check for the "Unauthorized, you must be logged in" 401 that broke
 * every admin action (adding a sponsor logo first) when the browser's Origin did
 * not exactly match NEXT_PUBLIC_SITE_URL. See src/payload/origins.ts.
 */

// Payload exports no public entry point for this (and its package `exports`
// block the subpath); it is the function every
// authenticated request goes through, which is exactly what this checks.
// @ts-expect-error untyped deep import
import { extractJWT } from '../node_modules/payload/dist/auth/extractJWT.js'

import configPromise from '../payload.config'

async function main() {
  const config = await configPromise
  const site = new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000')

  const accepts = (origin: string) =>
    Boolean(
      extractJWT({
        headers: new Headers({ cookie: `${config.cookiePrefix}-token=t`, Origin: origin }),
        payload: { config },
      })
    )

  const withSlash = `${site.origin}/`
  const otherProtocol = `${site.protocol === 'https:' ? 'http' : 'https'}://${site.host}`
  const twin = site.hostname.startsWith('www.')
    ? site.origin.replace('://www.', '://')
    : site.origin.replace('://', '://www.')
  const isNamedHost = !/^(localhost|[\d.]+|\[.*\])$/.test(site.hostname)

  const cases: [string, string, boolean][] = [
    ['site origin', site.origin, true],
    ['other protocol (TLS-terminating proxy)', otherProtocol, true],
    ...(isNamedHost ? [['www/apex twin', twin, true] as [string, string, boolean]] : []),
    ['foreign origin', 'https://evil.example', false],
    ['look-alike suffix', `${site.protocol}//${site.hostname}.evil.example`, false],
  ]
  for (const extra of (process.env.PAYLOAD_ALLOWED_ORIGINS ?? '').split(',').filter(Boolean)) {
    cases.push(['PAYLOAD_ALLOWED_ORIGINS entry', new URL(extra.trim()).origin, true])
  }

  console.log(`serverURL: ${config.serverURL}`)
  console.log(`csrf:      ${config.csrf.join(', ')}\n`)
  let failed = 0
  if (config.serverURL === withSlash) {
    failed++
    console.log(`FAIL  serverURL kept its trailing slash         ${config.serverURL}`)
  }
  for (const [label, origin, expected] of cases) {
    const ok = accepts(origin) === expected
    if (!ok) failed++
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${label.padEnd(40)} ${origin} -> ${expected ? 'accepted' : 'rejected'}`)
  }
  process.exit(failed ? 1 : 0)
}

await main().catch((err) => {
  console.error(err)
  process.exit(1)
})

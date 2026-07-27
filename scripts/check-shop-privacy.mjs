#!/usr/bin/env node
/**
 * Merch shop privacy guard.
 *
 * Order documents hold more personal data than anything else in the dataset: a
 * real name, an email address, a mobile number and a home address, all tied to
 * a purchase. These checks are the automated half of keeping it in.
 *
 *   1. No public GROQ projection selects an order field at all.
 *   2. Every order projection is named `*_INTERNAL_QUERY`.
 *   3. No `'use client'` module imports the orders layer, the write client, or
 *      calls Sanity directly.
 *   4. `PublicOrder` — the only order shape allowed in a browser — declares no
 *      private field.
 *   5. The masking helpers still actually mask.
 *
 * Dataset visibility is checked by check-donation-privacy.mjs, which runs
 * alongside this one and covers the whole dataset, orders included.
 *
 * Usage: node scripts/check-shop-privacy.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

let failures = 0

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

function fail(check, message) {
  failures++
  console.error(`${red('✗')} ${check}\n  ${message}\n`)
}
function pass(check, detail) {
  console.log(`${green('✓')} ${check}${detail ? dim(` — ${detail}`) : ''}`)
}

/**
 * Order fields that must never reach a browser.
 *
 * `customerName` is deliberately absent: the track page shows it so the buyer
 * can recognise their own order. Everything that could be used to find or
 * contact them at home is here.
 */
const PRIVATE_ORDER_FIELDS = [
  'customerEmail',
  'customerPhone',
  'deliveryAddress',
  'campusDetails',
  'adminNotes',
  'idempotencyKey',
]

// Deliberately NOT private:
//   customerName        — the buyer has to recognise their own order.
//   cancellationReason  — written by an admin FOR the customer; the schema says
//                         so and the cancellation email already sends it.
//                         `adminNotes` is the field for internal remarks.

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(full)) out.push(full)
  }
  return out
}

const files = walk(SRC)
const queriesSource = readFileSync(join(SRC, 'sanity/lib/queries.ts'), 'utf8')

/** Every `export const NAME = groq`…`` in queries.ts. */
function exportedQueries(source) {
  const out = []
  const re = /export const ([A-Z0-9_]+)\s*=\s*groq`([\s\S]*?)`/g
  let match
  while ((match = re.exec(source)) !== null) out.push({ name: match[1], body: match[2] })
  return out
}

const queries = exportedQueries(queriesSource)

// ── 1 & 2. Order queries are internal-only ────────────────────
{
  const check = 'Order queries are server-only and marked _INTERNAL_QUERY'
  const problems = []

  const orderQueries = queries.filter(
    (q) => /_type\s*==\s*"order"/.test(q.body) || /\border-/.test(q.name.toLowerCase())
  )

  // ORDER_TRACK_QUERY is the one order query that is *meant* to be public. It
  // earns that by selecting no private field at all — which the inverse check
  // below verifies rather than takes on trust.
  const PUBLIC_ORDER_QUERIES = new Set(['ORDER_TRACK_QUERY'])

  for (const query of orderQueries) {
    if (PUBLIC_ORDER_QUERIES.has(query.name)) continue
    if (!query.name.endsWith('_INTERNAL_QUERY')) {
      problems.push(
        `${query.name} reads order documents but is not named *_INTERNAL_QUERY.\n  ` +
          `Rename it, or it will be mistaken for a projection that is safe to publish.`
      )
    }
  }

  // The inverse: a query NOT marked internal must not touch order PII.
  //
  // Selecting a specific safe SUBFIELD is the sanctioned pattern —
  // `"area": deliveryAddress.area` publishes a district, whereas
  // `deliveryAddress` publishes the street line and postcode with it. So the
  // check is on the bare object, with the named-safe subfields stripped first.
  const SAFE_SUBFIELDS = [
    /deliveryAddress\.(area|city)/g,
    /campusDetails\.handoverPoint/g,
  ]
  for (const query of queries) {
    if (query.name.endsWith('_INTERNAL_QUERY')) continue
    let body = query.body
    for (const safe of SAFE_SUBFIELDS) body = body.replace(safe, '')
    const leaked = PRIVATE_ORDER_FIELDS.filter((f) => new RegExp(`\\b${f}\\b`).test(body))
    if (leaked.length) {
      problems.push(
        `${query.name} is public but projects: ${leaked.join(', ')}.\n  ` +
          `Select the specific safe subfield instead, e.g. \`"area": deliveryAddress.area\`.`
      )
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, `${orderQueries.length} order queries, all internal`)
}

// ── 3. Client/server boundary ─────────────────────────────────
{
  const check = 'No client component reaches the orders layer or Sanity'
  const problems = []

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    if (!/^\s*['"]use client['"]/m.test(source)) continue

    const rel = relative(ROOT, file)

    // Types are erased at build time and carry no runtime code, so
    // `import type { … } from '@/lib/orders'` is safe and expected — the
    // checkout form needs the CartIssue shape. Only VALUE imports are a problem.
    const importLines = source.match(/^import[\s\S]*?from\s+['"][^'"]+['"]/gm) ?? []
    for (const line of importLines) {
      if (/@\/lib\/orders/.test(line) && !/^import\s+type\b/.test(line.trim())) {
        problems.push(`${rel} has a VALUE import from @/lib/orders (server-only)`)
      }
      if (/@\/lib\/shop-server/.test(line) && !/^import\s+type\b/.test(line.trim())) {
        problems.push(`${rel} has a VALUE import from @/lib/shop-server (server-only)`)
      }
      if (/@\/lib\/email/.test(line)) {
        problems.push(`${rel} imports the email layer (server-only)`)
      }
    }

    if (/\bsanityFetch\b/.test(source)) problems.push(`${rel} calls sanityFetch`)
    if (/from\s+['"]@\/sanity\/lib\/writeClient['"]/.test(source)) {
      problems.push(`${rel} imports the Sanity write client (token exposure)`)
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, 'client boundary intact')
}

// ── 4. PublicOrder shape ──────────────────────────────────────
{
  const check = 'PublicOrder carries no private field'
  const source = readFileSync(join(SRC, 'sanity/lib/types.ts'), 'utf8')
  const match = source.match(/export interface PublicOrder \{([\s\S]*?)\n\}/)

  if (!match) {
    fail(check, 'PublicOrder interface not found in types.ts')
  } else {
    const body = match[1]
    // `maskedPhone` / `maskedAddress` are the sanctioned replacements, so the
    // bare field names must not appear.
    const leaks = PRIVATE_ORDER_FIELDS.filter((f) => new RegExp(`\\b${f}\\b`).test(body))
    if (leaks.length) fail(check, `PublicOrder declares: ${leaks.join(', ')}`)
    else pass(check, 'masked fields only')
  }
}

// ── 5. The masking helpers actually mask ──────────────────────
// A regression here would be silent: the type still says `maskedPhone`, the
// checks above still pass, and the full number ships anyway.
{
  const check = 'Private fields are never selected, and the redaction that remains still redacts'
  const source = readFileSync(join(SRC, 'lib/shop.ts'), 'utf8')
  const problems = []

  // The phone is protected by NOT being selected, not by being masked after the
  // fact. Assert exactly that, since asserting on a masking helper the app no
  // longer calls would be false assurance.
  if (/\bcustomerPhone\b/.test(queries.find((q) => q.name === 'ORDER_TRACK_QUERY')?.body ?? '')) {
    problems.push('ORDER_TRACK_QUERY selects customerPhone — it must use phoneLast3')
  }
  if (!/phoneLast3/.test(queriesSource)) {
    problems.push('phoneLast3 is no longer projected — the track page would show no phone at all')
  }

  const maskAddress = source.match(
    /export function maskAddress\([\s\S]*?\): string \{([\s\S]*?)\n\}/
  )
  if (!maskAddress) {
    problems.push('maskAddress() not found in lib/shop.ts')
  } else if (/line1|line2|postcode/.test(maskAddress[1])) {
    problems.push('maskAddress() references a street line or postcode — it must use area/city only')
  }

  // And the one place that builds a PublicOrder must not spread the raw order.
  const orders = readFileSync(join(SRC, 'lib/orders.ts'), 'utf8')
  const toPublic = orders.match(/function toPublicOrder\([\s\S]*?\n\}/)
  if (!toPublic) {
    problems.push('toPublicOrder() not found in lib/orders.ts')
  } else if (/\.\.\.order\b/.test(toPublic[0])) {
    problems.push(
      'toPublicOrder() spreads the raw order — every field added to the schema in future would be published by default'
    )
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, 'phone never selected, maskAddress and toPublicOrder intact')
}

// ── Summary ───────────────────────────────────────────────────
console.log('')
if (failures > 0) {
  console.error(red(`${failures} shop privacy check(s) FAILED`))
  process.exit(1)
}
console.log(green('All shop privacy checks passed'))

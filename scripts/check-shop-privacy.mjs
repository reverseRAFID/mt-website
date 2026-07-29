#!/usr/bin/env node
/**
 * Merch shop privacy guard.
 *
 * Order documents hold more personal data than anything else in the database: a
 * real name, an email address, a mobile number and a home address, all tied to
 * a purchase. These checks are the automated half of keeping it in.
 *
 * ── WHAT CHANGED WITH PAYLOAD ─────────────────────────────────
 * Under Sanity the rule was "no public GROQ projection names an order field,
 * and every order projection is called *_INTERNAL_QUERY". Payload has no
 * projections; the equivalent control is the `select` passed to the Local API.
 * So these checks read TRACK_SELECT — the one order read a page is allowed to
 * make — and assert it asks for nothing private.
 *
 * The reasoning is unchanged, and is the whole point: FETCHING A FIELD IS
 * ENOUGH TO PUBLISH IT. Next serialises fetched data into the RSC flight
 * payload embedded in the page whether or not a component renders it. Masking
 * in React is too late.
 *
 *   1. TRACK_SELECT names no private order field.
 *   2. `PublicOrder` — the only order shape allowed in a browser — declares no
 *      private field.
 *   3. No `'use client'` module imports the server data layer.
 *   4. The `orders` collection denies anonymous reads and anonymous creates.
 *   5. The masking helpers still actually mask.
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
 * Deliberately NOT here:
 *   customerName       — the buyer has to recognise their own order.
 *   cancellationReason — written by an admin FOR the customer, and already sent
 *                        in the cancellation email. `adminNotes` is the field
 *                        for internal remarks.
 *   area, city         — the coarsened address the track page is allowed to
 *                        show. The street line and postcode are not.
 */
const PRIVATE_ORDER_FIELDS = [
  'customerEmail',
  'customerPhone',
  'adminNotes',
  'idempotencyKey',
  'postcode',
  'line1',
  'line2',
  'bracuId',
]

const read = (path) => readFileSync(join(ROOT, path), 'utf8')

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      if (entry === 'node_modules' || entry === '.next') continue
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(full)) {
      out.push(full)
    }
  }
  return out
}

// ── 1. The track select asks for nothing private ──────────────
{
  const check = 'The track-page select names no private order field'
  const source = read('src/lib/orders.ts')
  const block = source.match(/const TRACK_SELECT = \{([\s\S]*?)\} as const/)

  if (!block) {
    fail(check, 'TRACK_SELECT not found in src/lib/orders.ts — has it been renamed?')
  } else {
    const leaked = PRIVATE_ORDER_FIELDS.filter((f) =>
      new RegExp(`\\b${f}\\s*:\\s*true`).test(block[1])
    )
    if (leaked.length) {
      fail(
        check,
        `TRACK_SELECT asks for: ${leaked.join(', ')}\n  ` +
          'Selecting a field is enough to publish it — it lands in the page source ' +
          'whether or not anything renders it.'
      )
    } else if (!/deliveryAddress:\s*\{\s*area:\s*true,\s*city:\s*true\s*\}/.test(block[1])) {
      fail(
        check,
        'deliveryAddress is not narrowed to { area, city }. Taking the whole ' +
          'object publishes the street line and postcode with it.'
      )
    } else {
      pass(check, 'deliveryAddress narrowed to area + city')
    }
  }
}

// ── 2. PublicOrder declares nothing private ───────────────────
{
  const check = 'PublicOrder declares no private field'
  const source = read('src/lib/orders.ts')
  const iface = source.match(/export interface PublicOrder \{([\s\S]*?)\n\}/)

  if (!iface) {
    fail(check, 'PublicOrder interface not found in src/lib/orders.ts')
  } else {
    const leaks = PRIVATE_ORDER_FIELDS.filter((f) => new RegExp(`\\b${f}\\b`).test(iface[1]))
    if (leaks.length) fail(check, `PublicOrder declares: ${leaks.join(', ')}`)
    else pass(check, 'maskedPhone + maskedAddress only')
  }
}

// ── 3. No client component reaches for the server layer ───────
{
  const check = "No 'use client' module imports the server data layer"
  const SERVER_ONLY = [
    '@/lib/orders',
    '@/lib/cms/client',
    '@/lib/cms/shop',
    '@/lib/cms/content',
    '@/lib/cms/donations',
    '@/lib/cms/recruitment',
    '@payload-config',
  ]

  const problems = []
  for (const file of walk(SRC)) {
    const source = readFileSync(file, 'utf8')
    if (!/^\s*['"]use client['"]/m.test(source)) continue
    for (const mod of SERVER_ONLY) {
      // `import type` compiles away entirely and ships nothing.
      //
      // The character class excludes newlines on purpose. These files have no
      // semicolons, so `[^;]*` would happily span from an `import` on line 1 to
      // a `from` on line 7 and report a type-only import as a value import.
      const re = new RegExp(
        `import\\s+(?!type\\b)[^;\\n]*from\\s+['"]${mod.replace(/\//g, '\\/')}['"]`
      )
      if (re.test(source)) problems.push(`${relative(ROOT, file)} imports ${mod}`)
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, 'server modules stay on the server')
}

// ── 4. The orders collection is closed by default ─────────────
{
  const check = 'The orders collection denies anonymous read and create'
  const source = read('src/payload/collections/Orders.ts')
  const access = source.match(/access:\s*\{([\s\S]*?)\n\s{2}\},/)

  if (!access) {
    fail(check, 'No access block found in src/payload/collections/Orders.ts')
  } else {
    const problems = []
    if (!/read:\s*staff\b/.test(access[1])) problems.push('read is not `staff`')
    if (!/create:\s*nobody\b/.test(access[1])) problems.push('create is not `nobody`')
    if (!/update:\s*staff\b/.test(access[1])) problems.push('update is not `staff`')
    if (!/delete:\s*adminOnly\b/.test(access[1])) problems.push('delete is not `adminOnly`')
    if (problems.length) fail(check, problems.join('\n  '))
    else pass(check, 'read/update staff · create nobody · delete admin')
  }
}

// ── 5. The masking helpers still mask ─────────────────────────
{
  const check = 'Masking helpers still mask'
  const shop = read('src/lib/shop.ts')
  const orders = read('src/lib/orders.ts')
  const problems = []

  const maskAddress = shop.match(/export function maskAddress[\s\S]*?\n\}/)?.[0] ?? ''
  if (!maskAddress) problems.push('maskAddress is gone from src/lib/shop.ts')
  else if (/\b(postcode|line1|line2)\b/.test(maskAddress)) {
    problems.push('maskAddress now includes the street line or postcode')
  }

  if (!/phoneLast3\s*\?\s*`••••••\$\{row\.phoneLast3\}`/.test(orders)) {
    problems.push('the phone is no longer reduced to its last three digits')
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, 'address → area + city · phone → last 3')
}

console.log('')
if (failures > 0) {
  console.error(red(`${failures} shop privacy check(s) FAILED`))
  console.error(dim('See docs/shop-runbook.md.\n'))
  process.exit(1)
}
console.log(green('All shop privacy checks passed.\n'))

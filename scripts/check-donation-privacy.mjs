#!/usr/bin/env node
/**
 * Crowdfunding privacy guard.
 *
 * Four checks, all cheap enough to run in CI:
 *
 *   1. No public GROQ projection selects a private donation field.
 *   2. No `'use client'` module imports the server-only donations layer or
 *      calls Sanity directly.
 *   3. The public donation type carries no private field.
 *   4. The live Sanity dataset rejects anonymous reads.
 *
 * Check 4 needs network access and is reported as a WARNING when it cannot
 * run (offline, no project id), so the script stays usable in a sandboxed CI
 * step. Checks 1–3 are hard failures.
 *
 * Usage: node scripts/check-donation-privacy.mjs
 */

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

let failures = 0
let warnings = 0

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

function fail(check, message) {
  failures++
  console.error(`${red('✗')} ${check}\n  ${message}\n`)
}
function warn(check, message) {
  warnings++
  console.warn(`${yellow('!')} ${check}\n  ${dim(message)}\n`)
}
function pass(check, detail) {
  console.log(`${green('✓')} ${check}${detail ? dim(` — ${detail}`) : ''}`)
}

/** Every private field name that must never reach a browser. */
const PRIVATE_FIELDS = [
  'amount',
  'senderAccount',
  'transactionId',
  'contactEmail',
  'contactPhone',
  'adminNotes',
  'rejectionReason',
  'verifiedBy',
]

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(full)) out.push(full)
  }
  return out
}

const files = walk(SRC)

// ── 1. Public GROQ projections ────────────────────────────────
// Scan the exported donation queries in queries.ts. `order(amount desc)` is
// the intended mechanism — sorting happens inside Sanity — so the check
// targets the PROJECTION body (inside the braces), not the whole query.
{
  const check = 'Public GROQ projections exclude private donation fields'
  const queriesPath = join(SRC, 'sanity/lib/queries.ts')
  const source = readFileSync(queriesPath, 'utf8')

  const publicQueries = ['APPROVED_DONATIONS_QUERY', 'TOP_DONATIONS_QUERY']
  const problems = []

  for (const name of publicQueries) {
    const match = source.match(new RegExp(`export const ${name} = groq\`([\\s\\S]*?)\``))
    if (!match) {
      problems.push(`${name} not found in queries.ts`)
      continue
    }
    const body = match[1]
    const projection = body.slice(body.indexOf('{'))

    for (const field of PRIVATE_FIELDS) {
      if (new RegExp(`\\b${field}\\b`).test(projection)) {
        problems.push(`${name} projects private field "${field}"`)
      }
    }
    // A bare `donorName` would publish an anonymous donor's real name. It is
    // only legitimate inside the select() that replaces it with "Anonymous".
    const donorNameHits = [...projection.matchAll(/\bdonorName\b/g)]
    const guarded = /select\(\s*isAnonymous\s*==\s*true\s*=>\s*"Anonymous"\s*,\s*donorName\s*\)/.test(
      projection
    )
    if (donorNameHits.length > 0 && !guarded) {
      problems.push(`${name} projects donorName without the anonymity select()`)
    }
    if (donorNameHits.length > 1) {
      problems.push(`${name} references donorName more than once — verify anonymity still holds`)
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, `${publicQueries.length} queries clean`)
}

// ── 2. Client/server boundary ─────────────────────────────────
{
  const check = 'No client component imports the server donations layer or Sanity fetch'
  const problems = []

  for (const file of files) {
    const source = readFileSync(file, 'utf8')
    const isClient = /^\s*['"]use client['"]/m.test(source)
    if (!isClient) continue

    const rel = relative(ROOT, file)
    if (/from\s+['"]@\/lib\/donations['"]/.test(source)) {
      problems.push(`${rel} imports @/lib/donations`)
    }
    if (/\bsanityFetch\b/.test(source)) {
      problems.push(`${rel} calls sanityFetch`)
    }
    if (/from\s+['"]@\/sanity\/lib\/writeClient['"]/.test(source)) {
      problems.push(`${rel} imports the Sanity write client (token exposure)`)
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, 'client boundary intact')
}

// ── 3. Public type shape ──────────────────────────────────────
{
  const check = 'PublicDonation type carries no private field'
  const source = readFileSync(join(SRC, 'sanity/lib/types.ts'), 'utf8')
  const match = source.match(/export interface PublicDonation \{([\s\S]*?)\n\}/)

  if (!match) {
    fail(check, 'PublicDonation interface not found in types.ts')
  } else {
    const body = match[1]
    const leaks = PRIVATE_FIELDS.filter((f) => new RegExp(`\\b${f}\\b`).test(body))
    if (/\bdonorName\b/.test(body)) leaks.push('donorName')
    if (leaks.length) fail(check, `PublicDonation declares: ${leaks.join(', ')}`)
    else pass(check)
  }
}

// ── 4. Live dataset visibility ────────────────────────────────
{
  const check = 'Sanity dataset rejects anonymous reads'

  // Read the project id from the environment, falling back to .env.local so
  // the check works without a loaded env.
  let projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  let dataset = process.env.NEXT_PUBLIC_SANITY_DATASET
  if (!projectId || !dataset) {
    try {
      const env = readFileSync(join(ROOT, '.env.local'), 'utf8')
      projectId ||= env.match(/^NEXT_PUBLIC_SANITY_PROJECT_ID=(.+)$/m)?.[1]?.trim()
      dataset ||= env.match(/^NEXT_PUBLIC_SANITY_DATASET=(.+)$/m)?.[1]?.trim()
    } catch {
      /* no .env.local — handled below */
    }
  }

  if (!projectId || !dataset) {
    warn(check, 'Skipped — no Sanity project id/dataset available in env or .env.local.')
  } else {
    const query = encodeURIComponent('count(*[_type=="donation"])')
    const url = `https://${projectId}.api.sanity.io/v2024-01-01/data/query/${dataset}?query=${query}`

    try {
      const res = await fetch(url, { headers: { Accept: 'application/json' } })
      if (res.status === 401 || res.status === 403) {
        pass(check, `dataset "${dataset}" is private (HTTP ${res.status})`)
      } else if (res.ok) {
        const body = await res.json().catch(() => ({}))
        fail(
          check,
          `Dataset "${dataset}" is PUBLICLY READABLE — anonymous query returned ${JSON.stringify(
            body.result
          )} donation(s).\n  ` +
            `Every donation amount, sender account and donor phone number is world-readable.\n  ` +
            `Fix: sanity.io/manage → ${projectId} → Datasets → ${dataset} → Visibility → Private\n  ` +
            `See docs/privacy-runbook.md §1.`
        )
      } else {
        warn(check, `Unexpected HTTP ${res.status} from the Sanity API — could not determine visibility.`)
      }
    } catch (err) {
      warn(check, `Skipped — network request failed (${err.message}).`)
    }
  }
}

// ── Summary ───────────────────────────────────────────────────
console.log('')
if (failures > 0) {
  console.error(red(`${failures} privacy check(s) FAILED`) + (warnings ? dim(`, ${warnings} skipped`) : ''))
  process.exit(1)
}
console.log(green('All privacy checks passed') + (warnings ? dim(`, ${warnings} skipped`) : ''))

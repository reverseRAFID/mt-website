#!/usr/bin/env node
/**
 * Crowdfunding privacy guard, plus the whole-database access audit.
 *
 * The supporters roll on /support publishes a RANK and never an amount, and it
 * publishes "Anonymous" rather than a name when the donor asked for that. Both
 * are one careless edit away from being untrue, so both are checked here.
 *
 * ── WHAT CHANGED WITH PAYLOAD ─────────────────────────────────
 * GROQ could resolve anonymity inside the query — `select(isAnonymous == true
 * => "Anonymous", donorName)` — so a real name never left the dataset. Payload
 * has no query-level conditional, so `toPublic()` does it in TypeScript
 * instead, INSIDE the cached read, before anything is returned. That is still
 * safe, but it is safe for a different reason, and the check has to match: the
 * rule is now "the returned shape carries nothing private", not "the query
 * never selected it".
 *
 * Sanity also needed a check that the dataset itself was private, because its
 * API was public by default. Payload's is not: every collection sets explicit
 * access. So that check is replaced by a stronger one — every collection must
 * declare all four operations, and the four collections holding personal data
 * must not be publicly readable.
 *
 *   1. The supporter select does not ask for `amount` or any contact field.
 *   2. `PublicDonation` declares nothing private.
 *   3. Anonymity is resolved before anything is returned.
 *   4. Every collection declares read/create/update/delete explicitly.
 *   5. No private collection is publicly readable.
 *
 * Usage: node scripts/check-donation-privacy.mjs
 */

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
const COLLECTIONS = join(ROOT, 'src/payload/collections')

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

const read = (path) => readFileSync(join(ROOT, path), 'utf8')

/**
 * The body of an `access: { … }` block, brace-matched.
 *
 * A regex cannot do this: the block is written on one line in some collections
 * and across several in others, and a lazy `[\s\S]*?` up to a closing brace
 * stops at the first nested one. Counting braces is boring and correct.
 */
function accessBlock(source) {
  const start = source.indexOf('access:')
  if (start === -1) return null
  const open = source.indexOf('{', start)
  if (open === -1) return null
  let depth = 0
  for (let i = open; i < source.length; i++) {
    if (source[i] === '{') depth++
    else if (source[i] === '}') {
      depth--
      if (depth === 0) return source.slice(open + 1, i)
    }
  }
  return null
}

/**
 * Donation fields that must never reach a browser, in any form.
 *
 * `amount` leads the list because it is the subtle one: it is genuinely needed
 * to order the roll, and ordering by a field is not the same as publishing it.
 * Sorting happens in MongoDB; the figure must not come back with the rows.
 */
const PRIVATE_DONATION_FIELDS = [
  'amount',
  'senderAccount',
  'transactionId',
  'contactEmail',
  'contactPhone',
  'adminNotes',
  'rejectionReason',
  'verifiedBy',
]

/** Collections whose contents are personal data. */
const PRIVATE_COLLECTIONS = ['Orders', 'Donations', 'Applications', 'Users']

// ── 1. The supporter select asks for nothing private ──────────
{
  const check = 'The supporter select names no private donation field'
  const source = read('src/lib/cms/donations.ts')
  const block = source.match(/const PUBLIC_SELECT = \{([\s\S]*?)\} as const/)

  if (!block) {
    fail(check, 'PUBLIC_SELECT not found in src/lib/cms/donations.ts')
  } else {
    const leaked = PRIVATE_DONATION_FIELDS.filter((f) =>
      new RegExp(`\\b${f}\\s*:\\s*true`).test(block[1])
    )
    if (leaked.length) {
      fail(
        check,
        `PUBLIC_SELECT asks for: ${leaked.join(', ')}\n  ` +
          'The roll shows a rank, never a figure. Order by amount inside MongoDB; ' +
          'do not select it.'
      )
    } else if (!/sort:\s*\['-amount'/.test(source)) {
      fail(check, 'The approved-donation read no longer sorts by amount — rank would be arbitrary.')
    } else {
      pass(check, 'sorted by amount, never selecting it')
    }
  }
}

// ── 2. PublicDonation declares nothing private ────────────────
{
  const check = 'PublicDonation declares no private field'
  const source = read('src/lib/cms/donations.ts')
  const iface = source.match(/export interface PublicDonation \{([\s\S]*?)\n\}/)

  if (!iface) {
    fail(check, 'PublicDonation interface not found')
  } else {
    const leaks = PRIVATE_DONATION_FIELDS.filter((f) => new RegExp(`\\b${f}\\b`).test(iface[1]))
    if (leaks.length) fail(check, `PublicDonation declares: ${leaks.join(', ')}`)
    else pass(check, 'displayName, affiliation, message, approvedAt')
  }
}

// ── 3. Anonymity is resolved on the server ────────────────────
{
  const check = 'Anonymity is resolved before anything is returned'
  const source = read('src/lib/cms/donations.ts')
  const toPublic = source.match(/function toPublic\([\s\S]*?\n\}/)?.[0] ?? ''

  if (!toPublic) {
    fail(check, 'toPublic() not found in src/lib/cms/donations.ts')
  } else if (!/anonymous \? ANONYMOUS_LABEL/.test(toPublic)) {
    fail(check, 'toPublic() no longer substitutes the anonymous label for donorName.')
  } else if (!/affiliation:\s*anonymous \? null/.test(toPublic)) {
    fail(check, 'toPublic() no longer suppresses affiliation for anonymous donors.')
  } else {
    pass(check, 'donorName and affiliation both suppressed')
  }
}

// ── 4. Every collection declares access explicitly ────────────
{
  const check = 'Every collection declares all four access operations'
  const problems = []

  for (const file of readdirSync(COLLECTIONS).filter((f) => f.endsWith('.ts'))) {
    const source = readFileSync(join(COLLECTIONS, file), 'utf8')
    const access = accessBlock(source)
    if (!access) {
      problems.push(`${file} has no access block at all`)
      continue
    }
    for (const op of ['read', 'create', 'update', 'delete']) {
      if (!new RegExp(`\\b${op}:`).test(access)) {
        problems.push(`${file} does not declare \`${op}\``)
      }
    }
  }

  if (problems.length) {
    fail(
      check,
      `${problems.join('\n  ')}\n\n  ` +
        '"What happens if I forget to write an access rule" must never be a ' +
        'question anybody has to look up.'
    )
  } else {
    pass(check, `${readdirSync(COLLECTIONS).filter((f) => f.endsWith('.ts')).length} collections`)
  }
}

// ── 5. No private collection is publicly readable ─────────────
{
  const check = 'No collection holding personal data is publicly readable'
  const problems = []

  for (const name of PRIVATE_COLLECTIONS) {
    const source = readFileSync(join(COLLECTIONS, `${name}.ts`), 'utf8')
    const access = accessBlock(source) ?? ''
    if (/read:\s*anyone\b/.test(access)) {
      problems.push(`${name}.ts sets \`read: anyone\``)
    }
    if (/create:\s*anyone\b/.test(access)) {
      problems.push(`${name}.ts sets \`create: anyone\``)
    }
  }

  if (problems.length) fail(check, problems.join('\n  '))
  else pass(check, PRIVATE_COLLECTIONS.join(', '))
}

console.log('')
if (failures > 0) {
  console.error(red(`${failures} crowdfunding/access check(s) FAILED`))
  console.error(dim('See docs/privacy-runbook.md.\n'))
  process.exit(1)
}
console.log(green('All crowdfunding and access checks passed.\n'))

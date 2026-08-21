/**
 * Team roster (data/team.csv) → Members collection.
 *
 *   npm run seed:members       # write
 *   npm run seed:members:dry   # report what would happen, write nothing
 *
 * The CSV is a raw Google Form export: free-text sub-team names that don't
 * match the fixed `subTeam` enum, years buried in prose, one respondent who
 * submitted twice, and a "Profile Photo" column of Drive links that require
 * a BRACU sign-in to fetch — so photos are intentionally left for the CMS.
 *
 * ── IDEMPOTENT ────────────────────────────────────────────────
 * Matches existing documents by `slug` (derived from name, same algorithm the
 * collection itself uses) and updates rather than duplicates on a re-run.
 */

import { readFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '../payload.config'
import { slugify } from '../src/payload/fields/slug'

const DRY = process.env.SEED_DRY === '1'
const CSV_PATH = new URL('../data/team.csv', import.meta.url)

function log(...args: unknown[]) {
  console.log(...args)
}

// ── CSV parsing (RFC4180 — quoted fields carry embedded commas/newlines) ──

function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
      continue
    }
    if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\r') {
      // skip — \n (bare or in \r\n) ends the row
    } else if (c === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }
  return rows
}

function readRows(): Record<string, string>[] {
  const text = readFileSync(CSV_PATH, 'utf-8')
  const rows = parseCSV(text).filter((r) => r.some((cell) => cell.trim() !== ''))
  const [header, ...body] = rows
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])))
}

// ── Small text helpers ─────────────────────────────────────────

const collapse = (s: string) => s.replace(/\s+/g, ' ').trim()
const truncate = (s: string, max: number) => (s.length <= max ? s : s.slice(0, max - 1).trimEnd() + '…')

function stripWrappingQuotes(raw: string): string {
  const t = raw.trim()
  const pairs: [string, string][] = [
    ['"', '"'],
    ['“', '”'],
  ]
  for (const [open, close] of pairs) {
    if (t.length > open.length + close.length && t.startsWith(open) && t.endsWith(close)) {
      const inner = t.slice(open.length, t.length - close.length).trim()
      if (inner) return inner
    }
  }
  return t
}

const ORG_PLACEHOLDERS = new Set([
  'n/a', 'na', 'no', '.', '..', '...', 'none',
  'not a alumni yet', 'not an alumni yet', 'not alumni yet',
  'not alumini', 'not an alumni', 'not alumni',
])

/** Single-value free text (currentOrg, role): drop if it's a "no answer" placeholder. */
function textOrUndef(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const s = collapse(raw)
  if (!s || ORG_PLACEHOLDERS.has(s.toLowerCase())) return undefined
  return s
}

function normalizeUrl(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  let s = raw.trim()
  if (!s) return undefined
  // Sentence-like non-answers ("I do not have github") and stray punctuation
  // ("…", "N/A") never look like a bare URL — both fail this shape check.
  if (/\s/.test(s) && !/^https?:\/\//i.test(s)) return undefined
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`
  try {
    return new URL(s).toString()
  } catch {
    return undefined
  }
}

const LIST_PLACEHOLDERS = new Set(['n/a', 'na', 'none', 'idk', 'no', '.', '..', '...'])

/** Comma-split that doesn't break "ArduPilot (ArduRover, ArduCopter, ArduSub)" into three. */
function splitTopLevelCommas(s: string): string[] {
  const parts: string[] = []
  let depth = 0
  let current = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth = Math.max(0, depth - 1)
    if (ch === ',' && depth === 0) {
      parts.push(current)
      current = ''
    } else {
      current += ch
    }
  }
  parts.push(current)
  return parts
}

/** Comma- or newline-separated free text → a clean, deduped string array. */
function splitList(raw: string | undefined): string[] {
  if (!raw) return []
  const normalized = raw.replace(/\r\n/g, '\n')
  const parts = normalized.includes('\n') ? normalized.split('\n') : splitTopLevelCommas(normalized)

  const seen = new Set<string>()
  const out: string[] = []
  for (const part of parts) {
    let item = part.trim()
    item = item.replace(/^\d+(?:[.)]\s*|\s+)/, '') // "1. ", "2) ", or bare "4 "
    item = stripWrappingQuotes(item)
    item = collapse(item)
    if (!item || LIST_PLACEHOLDERS.has(item.toLowerCase())) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push(item)
  }
  return out
}

const arrOrUndef = <T,>(arr: T[]): T[] | undefined => (arr.length ? arr : undefined)

// ── Years ─────────────────────────────────────────────────────

/** All 20xx years in a string, tolerant of the sheet's mangled "202,420,252,026" style commas. */
function allYears(raw: string | undefined): number[] {
  if (!raw) return []
  const digitsOnly = raw.replace(/[^\d]/g, '')
  const found = digitsOnly.match(/20\d{2}/g) ?? []
  return [...new Set(found.map(Number))].sort((a, b) => a - b)
}

function parseJoinedYear(raw: string | undefined): number | undefined {
  if (!raw) return undefined
  const years = allYears(raw)
  if (years.length) return years[0]
  const season = raw.match(/\b(?:fall|spring|summer)\s*(\d{2})\b/i)
  if (season) return 2000 + Number(season[1])
  return undefined
}

/** URC2026 / ERC2025 style tags in the "Mongol-Tori Team" column → the years actually contributed. */
function deriveYearsContributed(mtTeam: string | undefined): number[] {
  return allYears(mtTeam)
}

// ── Sub-team mapping ──────────────────────────────────────────
// CSV free text → the 9 fixed enum values in src/lib/subteam-style.ts.
// "Creative & Pr" has no dedicated bucket; it's outreach-adjacent content
// work, so it folds into `management`. "Alumni" (one respondent's literal
// answer, in place of an actual sub-team) has no honest mapping — left unset.

const SUBTEAM_MAP: Record<string, string> = {
  'Management & Outreach': 'management',
  'Creative & Pr': 'management',
  'Network & Vision': 'network',
  'AI & Autonomous': 'autonomous',
  'Astrobio & Science': 'science',
  'Controls & Software': 'controls',
  'Electronics': 'electronics',
  'Mechanical & CAD': 'mechanical',
  'Research & Documentation': 'rnd',
  'Unmanned Aerial Vehicles': 'uav',
}

const unmappedSubTeams = new Set<string>()

function mapSubTeam(raw: string | undefined): string | undefined {
  const key = collapse(raw ?? '')
  const mapped = SUBTEAM_MAP[key]
  if (!mapped) unmappedSubTeams.add(`${key || '(empty)'}`)
  return mapped
}

// ── isActive / isAlumni ─────────────────────────────────────────
// "Currently Active Member" is Yes/No/Maybe, not a clean boolean. Everyone
// who didn't explicitly say No (several "Maybe"s are graduating-soon members,
// one is the sitting co-team lead) is treated as active — the default a
// missing answer gets anyway.

function parseIsActive(raw: string | undefined): boolean {
  return collapse(raw ?? '').toLowerCase() !== 'no'
}

function parseIsAlumni(raw: string | undefined): boolean {
  return collapse(raw ?? '').toLowerCase() === 'yes'
}

// ── Works & Projects ─────────────────────────────────────────
// Free text ranging from a bare link to multi-project blobs with inline
// "Link:/ Description:" prose. Multi-URL rows are split one work per URL
// (named from the URL itself — a repo path is informative on its own); the
// surrounding prose is not reliably attributable to a single URL and is
// dropped rather than mis-split. Flagged in the run summary for a manual
// pass.

const URL_RE = /(https?:\/\/[^\s,]+|www\.[^\s,]+\.[a-z]{2,}[^\s,]*)/gi

function nameFromUrl(rawUrl: string): string {
  const url = normalizeUrl(rawUrl)
  if (!url) return rawUrl
  let u: URL
  try {
    u = new URL(url)
  } catch {
    return url
  }
  const host = u.hostname.replace(/^www\./, '')
  const segments = u.pathname.split('/').filter(Boolean)

  if (host === 'github.com') {
    if (segments.length >= 2) return `${segments[0]}/${segments[1]}`
    if (segments.length === 1) return `${segments[0]} (GitHub)`
    return 'GitHub'
  }
  if (host === 'drive.google.com') return u.pathname.includes('/folders/') ? 'Google Drive folder' : 'Google Drive file'
  if (host === 'docs.google.com') return 'Google Doc'
  if (host === 'instagram.com') {
    const handle = segments[segments.length - 1] || segments[0] || 'post'
    return segments[0] === 'reel' ? `Instagram reel — ${handle}` : `Instagram — ${handle}`
  }
  if (host === 'sites.google.com') {
    const last = segments[segments.length - 1]
    const pretty = last ? last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Site'
    return `${pretty} (Google Sites)`
  }
  return segments.length ? `${host}/${segments[0]}` : host
}

const messyWorksFlags: string[] = []

function parseWorks(raw: string | undefined, memberName: string): { name: string; url?: string }[] {
  if (!raw) return []
  const text = collapse(raw)
  if (!text) return []

  const urls = [...text.matchAll(URL_RE)].map((m) => m[0])

  if (urls.length === 0) {
    if (text.length < 15) return [] // too short to be a real project record ("Look Up.")
    const items = splitList(text).map((name) =>
      name.replace(/[.\s]*\b(?:github|link|url)\s*:?\s*$/i, '').trim()
    ).filter(Boolean)
    if (items.length > 1) messyWorksFlags.push(memberName)
    return items.map((name) => ({ name: truncate(name, 200) }))
  }

  if (urls.length === 1) {
    const label = collapse(text.replace(urls[0], '')).replace(/[\s\-–:]+$/, '').replace(/^[\s\-–:]+/, '').trim()
    const url = normalizeUrl(urls[0])
    if (label.length >= 3) return [{ name: truncate(label, 200), url }]
    return [{ name: nameFromUrl(urls[0]), url }]
  }

  messyWorksFlags.push(memberName)
  return urls.map((u) => ({ name: nameFromUrl(u), url: normalizeUrl(u) }))
}

// ── Achievements ─────────────────────────────────────────────

const bundledAchievementFlags: string[] = []
const externalAchievementDocFlags: { name: string; url: string }[] = []

function parseAchievements(row: Record<string, string>, memberName: string) {
  const title = collapse(row['Title'] ?? '')
  const docLink = normalizeUrl(
    row['If you have multiple achievements, then compile all of them in a google docs and upload it here!']
  )
  if (docLink) externalAchievementDocFlags.push({ name: memberName, url: docLink })

  if (!title) return undefined

  // Several respondents crammed more than one award into this single field,
  // with no consistent delimiter to split on reliably — kept whole rather
  // than guessed apart, flagged for a manual split in the CMS.
  const commaCount = (title.match(/,/g) ?? []).length
  if (commaCount >= 3 || title.length > 100) bundledAchievementFlags.push(memberName)

  const years = allYears(row['Year'])
  const achievementText = collapse(row['Detail'] ?? '')

  return [
    {
      title: truncate(title, 300),
      year: years[0],
      achievement: achievementText || undefined,
    },
  ]
}

// ── Row → Member transform ─────────────────────────────────────

function transform(row: Record<string, string>) {
  const name = collapse(row['Full name'])
  const slug = slugify(name)
  const joinedYear = parseJoinedYear(row['Year Joined the Team'])
  const graduationYearRaw = allYears(row['Graduation Year'])[0]
  // The one validation the collection enforces: graduationYear >= joinedYear.
  const graduationYear =
    graduationYearRaw !== undefined && joinedYear !== undefined && graduationYearRaw < joinedYear
      ? undefined
      : graduationYearRaw

  const tagline = row['Tagline '] ? truncate(stripWrappingQuotes(row['Tagline ']), 120) : undefined
  const quote = row['Personal Quote / Motto']
    ? truncate(stripWrappingQuotes(row['Personal Quote / Motto']), 240)
    : undefined

  const isAlumni = parseIsAlumni(row['Is Alumni?'])
  const role = /co-team lead/i.test(row['Bio / About'] ?? '') ? 'Co-Team Lead' : undefined

  return {
    slug,
    data: {
      name,
      role,
      tagline,
      subTeam: mapSubTeam(row['Role / Sub Team']),
      joinedYear,
      graduationYear,
      yearsContributed: arrOrUndef(deriveYearsContributed(row['Mongol-Tori Team'])),
      isAlumni,
      currentOrg: textOrUndef(row['Current Organization (alumni only)']),
      isActive: parseIsActive(row['Currently Active Member']),
      bio: row['Bio / About']?.trim() || undefined,
      quote,
      focusAreas: arrOrUndef(splitList(row['Focus Areas'])),
      skills: arrOrUndef(splitList(row['Skills / Tools'])),
      achievements: parseAchievements(row, name),
      works: arrOrUndef(parseWorks(row['Works & Projects'], name)),
      linkedin: normalizeUrl(row['LinkedIn URL']),
      github: normalizeUrl(row['GitHub URL']),
      website: normalizeUrl(row['Personal Website / Portfolio']),
    },
  }
}

// ── Dedupe ────────────────────────────────────────────────────
// One respondent (sybeenabrarprohor@gmail.com) submitted the form twice;
// keep the later submission (per timestamp) and drop the earlier one.

function dedupeByEmail(rows: Record<string, string>[]): Record<string, string>[] {
  const byEmail = new Map<string, Record<string, string>>()
  for (const row of rows) {
    const email = row['Email Address']?.trim().toLowerCase()
    if (!email) continue
    const existing = byEmail.get(email)
    if (!existing || new Date(row['Timestamp']).getTime() > new Date(existing['Timestamp']).getTime()) {
      byEmail.set(email, row)
    }
  }
  return [...byEmail.values()]
}

// ── Main ──────────────────────────────────────────────────────

type Cms = Awaited<ReturnType<typeof getPayload>>
const counts = { created: 0, updated: 0, skipped: 0 }
const failures: string[] = []

async function upsertMember(cms: Cms, slug: string, data: Record<string, unknown>) {
  const { docs } = await cms.find({
    collection: 'members',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })

  if (DRY) {
    log(`  would ${docs[0] ? 'update' : 'create'} members: ${slug}`)
    return
  }

  try {
    if (docs[0]) {
      await cms.update({ collection: 'members', id: docs[0].id, data: data as never })
      counts.updated++
    } else {
      await cms.create({ collection: 'members', data: data as never })
      counts.created++
    }
  } catch (err) {
    const message = `${slug}: ${(err as Error).message}`
    log(`  ! ${message}`)
    failures.push(message)
    counts.skipped++
  }
}

async function main() {
  const cms = await getPayload({ config })
  const rows = dedupeByEmail(readRows())

  log(`Seeding members from data/team.csv${DRY ? ' (DRY RUN)' : ''} — ${rows.length} unique member(s)`)

  for (const row of rows) {
    const { slug, data } = transform(row)
    await upsertMember(cms, slug, data)
  }

  log('\n──────────────────────────────────────────')
  log(DRY ? 'DRY RUN — nothing was written' : 'Seed complete')
  log(`  members  created ${counts.created}  updated ${counts.updated}  skipped ${counts.skipped}`)
  log('──────────────────────────────────────────')

  if (unmappedSubTeams.size) {
    log(`\nSub-team values with no enum mapping (left blank on those members):`)
    for (const v of unmappedSubTeams) log(`  - "${v}"`)
  }
  if (bundledAchievementFlags.length) {
    log(`\nAchievement "Title" looks like several awards bundled into one string — worth splitting by hand:`)
    for (const n of bundledAchievementFlags) log(`  - ${n}`)
  }
  if (externalAchievementDocFlags.length) {
    log(`\nMembers who linked an external Google Doc of additional achievements (not fetched):`)
    for (const f of externalAchievementDocFlags) log(`  - ${f.name}: ${f.url}`)
  }
  if (messyWorksFlags.length) {
    log(`\nWorks & Projects had multiple items in one field — names were auto-derived, worth a manual pass:`)
    for (const n of [...new Set(messyWorksFlags)]) log(`  - ${n}`)
  }
  log(`\nAll ${rows.length} members were seeded without a photo — the CSV's Drive links require a BRACU sign-in and aren't fetchable. Upload headshots via the CMS.`)

  if (failures.length) {
    log(`\n${failures.length} member(s) were REJECTED:\n`)
    for (const f of failures) log(`  ✗ ${f}`)
  }

  process.exit(failures.length ? 2 : 0)
}

// `payload run` awaits the script module's own promise, so this has to be a
// genuine top-level await — a bare `main().catch(...)` lets the CLI consider
// the module "done" as soon as it's called and exit before any of it runs.
await main().catch((err) => {
  console.error('\nSeed failed:', err)
  process.exit(1)
})

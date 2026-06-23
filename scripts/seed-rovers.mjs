#!/usr/bin/env node
// ============================================================
// Seed BRACU Mongol-Tori rovers + competitions into Sanity.
//
//   node scripts/seed-rovers.mjs            # seed everything
//   node scripts/seed-rovers.mjs --dry      # build docs, don't write
//   node scripts/seed-rovers.mjs --no-images
//   node scripts/seed-rovers.mjs --no-crew
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET / SANITY_API_TOKEN from
// .env.local. The token needs "Editor" permissions.
//
// Idempotent: documents use deterministic _ids (createOrReplace) and image
// uploads are de-duplicated by Sanity's content hash, so re-running is safe.
// ============================================================
import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const SEED_DIR = path.join(__dirname, 'seed')
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')
const SKIP_IMAGES = args.has('--no-images')
const SKIP_CREW = args.has('--no-crew')

// ── env ───────────────────────────────────────────────────
function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim()
  }
  return out
}
const env = loadEnv()
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = env.SANITY_API_TOKEN

if (!projectId || projectId === 'replace-me') {
  console.error('✗ NEXT_PUBLIC_SANITY_PROJECT_ID is missing in .env.local')
  process.exit(1)
}
if (!token && !DRY) {
  console.error(`
✗ SANITY_API_TOKEN is empty in .env.local — cannot write to the CMS.

  1. Create an "Editor" token:  https://www.sanity.io/manage  →  project "${projectId}"  →  API  →  Tokens
  2. Paste it into .env.local:   SANITY_API_TOKEN=sk...
  3. Re-run:                      node scripts/seed-rovers.mjs

  (Run with --dry to preview the documents without a token.)
`)
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// ── helpers ───────────────────────────────────────────────
const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-')

const roverSlug = (name, year) => {
  const base = slugify(name)
  return base.includes(String(year)) ? base : `${base}-${year}`
}

let _k = 0
const key = (p = 'k') => `${p}${(_k++).toString(36)}${Date.now().toString(36).slice(-3)}`

// keySpecs[] -> structured specs object used by the fleet cards
function deriveSpecs(keySpecs = []) {
  const find = (re) => keySpecs.find((s) => re.test(s.label))?.value
  const dofRaw = find(/arm\s*dof|(^|\s)dof/i)
  const dofNum = dofRaw ? parseInt(String(dofRaw).match(/\d+/)?.[0] ?? '', 10) : NaN
  const specs = {}
  const weight = find(/weight|mass/i)
  const dims = find(/dimensions|footprint/i)
  const drive = find(/drive|suspension/i)
  const payload = find(/payload/i)
  const autonomy = find(/autonom/i)
  if (weight) specs.weight = weight
  if (dims) specs.dimensions = dims
  if (drive) specs.driveSystem = drive
  if (payload) specs.payload = payload
  if (Number.isFinite(dofNum)) specs.dof = dofNum
  if (autonomy) specs.autonomy = autonomy
  return Object.keys(specs).length ? specs : undefined
}

// Curated featured/gallery images extracted from the SAR PDFs.
const IMAGES = {
  'revolution-2018': { featured: 'revolution-2018/featured.jpg' },
  'mongol-tori-2019': { featured: 'mongol-tori-2019/featured.jpg' },
  'mongol-tori-2020': { featured: 'mongol-tori-2020/featured.jpg' },
  'encephalon-2022': { featured: 'encephalon-2022/featured.jpg', gallery: ['encephalon-2022/g1.jpg', 'encephalon-2022/g2.jpg'] },
  'encephalon-2023': { featured: 'encephalon-2023/featured.jpg', gallery: ['encephalon-2023/g1.jpg'] },
  'phoenix-2024': { featured: 'phoenix-2024/featured.jpg', gallery: ['phoenix-2024/g1.jpg'] },
  'hypersonic-2025': { featured: 'hypersonic-2025/featured.jpg' },
  'taurus-2026': { featured: 'taurus-2026/featured.jpg' },
}

const assetCache = new Map()
async function uploadImage(rel, label) {
  if (SKIP_IMAGES || DRY) return undefined
  if (assetCache.has(rel)) return assetCache.get(rel)
  const abs = path.join(SEED_DIR, 'images', rel)
  if (!fs.existsSync(abs)) {
    console.warn(`   ! image not found, skipping: ${rel}`)
    return undefined
  }
  const asset = await client.assets.upload('image', fs.createReadStream(abs), {
    filename: path.basename(abs),
    label,
  })
  const ref = { _type: 'image', asset: { _type: 'reference', _ref: asset._id } }
  assetCache.set(rel, ref)
  return ref
}
const withKey = (img) => (img ? { ...img, _key: key('img') } : undefined)

// ── main ──────────────────────────────────────────────────
async function main() {
  const records = JSON.parse(fs.readFileSync(path.join(SEED_DIR, 'rovers.json'), 'utf8'))
  const maxYear = Math.max(...records.map((r) => r.year))

  let members = []
  if (!SKIP_CREW) {
    members = DRY ? [] : await client.fetch('*[_type=="member"]{_id,name,subTeam}')
  }

  console.log(`\n▶ Seeding ${records.length} rovers into ${projectId}/${dataset}${DRY ? '  (DRY RUN)' : ''}\n`)
  const txns = []

  for (const r of records) {
    const name = r.roverName?.trim() || `Mongol-Tori ${r.year}`
    const slug = roverSlug(name, r.year)
    const isFlagship = r.year === maxYear
    console.log(`• ${r.year}  ${name}  (/${slug})${isFlagship ? '  ★ flagship' : ''}`)

    // Competition
    const compId = `competition.urc.${r.year}`
    const compDoc = {
      _id: compId,
      _type: 'competition',
      name: r.competition?.fullName || 'University Rover Challenge',
      shortName: r.competition?.shortName || 'URC',
      year: r.year,
      slug: { _type: 'slug', current: `urc-${r.year}` },
      ...(r.competition?.location ? { location: r.competition.location } : {}),
      ...(r.competition?.result ? { result: r.competition.result } : {}),
      rover: { _type: 'reference', _ref: `rover.${slug}` },
    }

    // Images
    const imgMap = IMAGES[slug] || {}
    const featured = withKey(imgMap.featured ? await uploadImage(imgMap.featured, `${name} featured`) : undefined)
    const gallery = []
    for (const g of imgMap.gallery || []) {
      const up = withKey(await uploadImage(g, `${name} gallery`))
      if (up) gallery.push(up)
    }

    // Crew (flagship only — a starter roster from existing members; re-curate in Sanity)
    let crew
    if (isFlagship && !SKIP_CREW && members.length) {
      crew = members.map((m) => ({
        _key: key('crew'),
        member: { _type: 'reference', _ref: m._id },
      }))
    }

    const roverDoc = {
      _id: `rover.${slug}`,
      _type: 'rover',
      name,
      slug: { _type: 'slug', current: slug },
      year: r.year,
      isFlagship,
      ...(r.tagline ? { tagline: r.tagline } : {}),
      ...(r.overview ? { overview: r.overview } : {}),
      ...(r.teamLead ? { teamLead: r.teamLead } : {}),
      competition: { _type: 'reference', _ref: compId },
      ...(featured ? { featuredImage: featured } : {}),
      ...(gallery.length ? { gallery } : {}),
      ...(deriveSpecs(r.specs) ? { specs: deriveSpecs(r.specs) } : {}),
      ...(r.specs?.length
        ? { keySpecs: r.specs.map((s) => ({ _key: key('spec'), label: s.label, value: s.value })) }
        : {}),
      ...(r.namedComponents?.length ? { namedComponents: r.namedComponents } : {}),
      ...(r.keyInnovations?.length
        ? { keyInnovations: r.keyInnovations.map((i) => ({ _key: key('inv'), title: i.title, description: i.description })) }
        : {}),
      ...(r.subsystems?.length
        ? {
            subsystems: r.subsystems.map((s) => ({
              _key: key('sub'),
              name: s.name,
              ...(s.subTeamKey ? { subTeam: s.subTeamKey } : {}),
              summary: s.summary,
              ...(s.highlights?.length ? { highlights: s.highlights } : {}),
            })),
          }
        : {}),
      ...(r.missions?.length
        ? { missions: r.missions.map((m) => ({ _key: key('mis'), name: m.name, summary: m.summary })) }
        : {}),
      ...(crew ? { crew } : {}),
    }

    txns.push(compDoc, roverDoc)
  }

  if (DRY) {
    fs.writeFileSync(path.join(SEED_DIR, 'preview.json'), JSON.stringify(txns, null, 2))
    console.log(`\n✓ DRY RUN — ${txns.length} docs written to scripts/seed/preview.json (nothing sent to Sanity)\n`)
    return
  }

  let tx = client.transaction()
  for (const doc of txns) tx = tx.createOrReplace(doc)
  await tx.commit()

  console.log(`\n✓ Seeded ${txns.length} documents (${records.length} rovers + ${records.length} competitions).`)
  if (!SKIP_CREW && members.length) {
    console.log(`  ★ Linked ${members.length} existing members as a starter crew on the flagship rover — re-assign per rover in Sanity → Rovers → Crew.`)
  }
  console.log(`  → Visit /rovers/taurus-2026 to see the flagship page.\n`)
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  if (err.responseBody) console.error(err.responseBody)
  process.exit(1)
})

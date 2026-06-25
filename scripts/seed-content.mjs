#!/usr/bin/env node
// ============================================================
// Seed placeholder CONTENT into the LIVE Sanity dataset for the
// BRACU Mongol-Tori website (news posts, SAR videos, research papers,
// member focus/skills, advisor testimonials).
//
//   node scripts/seed-content.mjs            # seed / patch everything
//   node scripts/seed-content.mjs --dry      # build docs & patches, write nothing
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET / SANITY_API_TOKEN from
// .env.local. The token needs "Editor" permissions.
//
// What it does:
//   • CREATES 6 news posts            (seed-post-1 … seed-post-6)
//   • CREATES 2 SAR videos            (seed-sar-1, seed-sar-2)
//   • CREATES 3 research papers       (seed-research-1 … seed-research-3)
//   • CREATES 2 advisor testimonials  (seed-testimonial-1, seed-testimonial-2)
//   • PATCHES the existing (empty) SAR video doc to make it valid
//   • PATCHES the existing research paper's null `year` -> 2023
//   • PATCHES every member to fill empty focusAreas / skills (+ role/subTeam
//     for the one stub member) derived from their sub-team
//
// Idempotent & non-destructive:
//   - New docs use deterministic `seed-*` _ids via createOrReplace, so
//     re-running overwrites the seeds in place (never duplicates).
//   - Patches ONLY fill fields that are currently empty (undefined / null /
//     empty array). Fields that already hold real content are left untouched,
//     so re-runs are effectively no-ops and your real data is never clobbered.
//
// HOW TO REMOVE the seeded docs later (all share the `seed-` _id prefix):
//   In Sanity Vision (or the CLI), query then delete:
//     *[_id in path("seed-**")]._id
//   e.g.  sanity documents query '*[_id in path("seed-**")]{_id}'
//         sanity documents delete <id1> <id2> ...
//   NOTE: deleting the `seed-*` docs does NOT undo the field-level patches
//   applied to the existing member / research / sarVideo documents (those
//   filled previously-empty fields with valid placeholder values).
// ============================================================
import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')

// ── env ───────────────────────────────────────────────────
function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    // strip surrounding single/double quotes if present
    out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
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
  3. Re-run:                      node scripts/seed-content.mjs

  (Run with --dry to preview the documents without a token.)
`)
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// ── helpers ───────────────────────────────────────────────
// Portable Text block with deterministic, array-unique keys (b0/s0, b1/s1 …).
const ptBlock = (i, text, style = 'normal') => ({
  _type: 'block',
  _key: `b${i}`,
  style,
  markDefs: [],
  children: [{ _type: 'span', _key: `s${i}`, text, marks: [] }],
})
const buildBody = (paras) => paras.map((p, i) => ptBlock(i, p.text, p.style || 'normal'))

// Round-robin a window of members into reference objects (array-keyed).
function memberRefs(members, start, count, prefix = 'a') {
  const refs = []
  const seen = new Set()
  for (let j = 0; j < count && members.length; j++) {
    const m = members[(start + j) % members.length]
    if (seen.has(m._id)) continue
    seen.add(m._id)
    refs.push({ _type: 'reference', _ref: m._id, _key: `${prefix}${refs.length}` })
  }
  return refs
}

// Decide, per field, whether to fill it. Real values are NEVER overwritten.
//   undefined (absent)            -> setIfMissing  (safe, normal case)
//   null / '' / [] (empty value)  -> set           (setIfMissing won't touch these)
//   anything else (real content)  -> skip
function planDoc(doc, desired) {
  const set = {}
  const ifMissing = {}
  for (const [k, val] of Object.entries(desired)) {
    const cur = doc?.[k]
    const isEmpty = cur === null || cur === '' || (Array.isArray(cur) && cur.length === 0)
    if (cur === undefined) ifMissing[k] = val
    else if (isEmpty) set[k] = val
    // else: leave the real value alone
  }
  return { set, ifMissing }
}
const hasKeys = (o) => Object.keys(o).length > 0

// ── content: sub-team → focus areas / skills ──────────────
const FALLBACK_SUBTEAM = 'controls'
const SUBTEAM_TRAITS = {
  management: {
    focusAreas: ['Project management', 'Sponsorship & outreach', 'Systems integration'],
    skills: ['Planning & scheduling', 'Budgeting', 'Technical documentation'],
  },
  controls: {
    focusAreas: ['Robotic arm control', 'Motion planning', 'Teleoperation'],
    skills: ['ROS 2', 'C++', 'PID & state machines'],
  },
  mechanical: {
    focusAreas: ['CAD / SolidWorks', 'Structural FEA', 'Rocker-bogie suspension'],
    skills: ['SolidWorks', 'CNC machining', '3D printing'],
  },
  electronics: {
    focusAreas: ['PCB design', 'Power distribution', 'Embedded firmware'],
    skills: ['Altium / KiCad', 'STM32', 'Soldering & bring-up'],
  },
  science: {
    focusAreas: ['Astrobiology assays', 'Soil & spectroscopy analysis', 'Sample handling'],
    skills: ['Lab analysis', 'Spectroscopy', 'Data interpretation'],
  },
  uav: {
    focusAreas: ['Aerial mapping', 'Flight control', 'Payload integration'],
    skills: ['PX4 / ArduPilot', 'Photogrammetry', 'Drone assembly'],
  },
  network: {
    focusAreas: ['Wireless communications', 'Telemetry links', 'Ground station software'],
    skills: ['RF & antennas', 'Networking', 'Linux'],
  },
  autonomous: {
    focusAreas: ['Path planning', 'Computer vision', 'SLAM & localisation'],
    skills: ['ROS 2', 'Python', 'OpenCV / PyTorch'],
  },
  rnd: {
    focusAreas: ['Rapid prototyping', 'Materials research', 'Concept validation'],
    skills: ['Prototyping', 'Simulation', 'Testing'],
  },
}

// ── content: 6 news posts ─────────────────────────────────
// publishedAt are hard-coded ISO strings, spread across 2024–2026.
const POSTS = [
  {
    _id: 'seed-post-1',
    title: 'Mongol-Tori Qualifies for the 2025 University Rover Challenge Finals',
    slug: 'mongol-tori-2025-urc-finals',
    category: 'competition-update',
    publishedAt: '2025-05-01T09:00:00.000Z',
    excerpt:
      'After clearing the System Acceptance Review, BRACU Mongol-Tori has secured a place among the finalists heading to the Mars Desert Research Station for URC 2025.',
    body: [
      { text: 'BRACU Mongol-Tori has officially qualified for the finals of the 2025 University Rover Challenge after passing the rigorous System Acceptance Review (SAR). Out of more than a hundred teams worldwide, our rover earned one of the coveted spots to compete on the red soil of the Mars Desert Research Station in Utah.' },
      { style: 'h2', text: 'What the Review Demanded' },
      { text: 'The SAR evaluates every subsystem against the demands of four mission tasks — autonomous traversal, the equipment-servicing mission, the extreme retrieval and delivery mission, and the science mission. Our team submitted a demonstration video alongside detailed technical documentation, showcasing a year of iterative design, testing, and field trials.' },
      { text: 'We are grateful to our advisors, sponsors, and the wider community whose support made this milestone possible. The road to the finals begins now, and the team is already deep into integration testing ahead of the competition.' },
    ],
  },
  {
    _id: 'seed-post-2',
    title: 'Meet Hypersonic: Unveiling Our 2025 Competition Rover',
    slug: 'hypersonic-2025-rover-reveal',
    category: 'rover-reveal',
    publishedAt: '2025-05-12T10:00:00.000Z',
    excerpt:
      'Hypersonic is the most capable rover Mongol-Tori has ever built — lighter, faster, and smarter, engineered from the ground up for the 2025 season.',
    body: [
      { text: 'Today we are proud to introduce Hypersonic, our 2025 competition rover and the culmination of months of design reviews, machining, and late-night debugging. Built around a refined rocker-bogie suspension and a six-degree-of-freedom manipulator, Hypersonic is engineered to take on the toughest terrain the University Rover Challenge can throw at it.' },
      { style: 'h2', text: 'Engineered for the Mission' },
      { text: 'The chassis sheds nearly four kilograms over last year’s platform while improving torsional rigidity, thanks to a redesigned aluminium space-frame and carbon-fibre panels. A new onboard compute stack runs our perception and autonomy software, enabling reliable GNSS-denied navigation across open desert.' },
      { text: 'Hypersonic carries a dedicated science payload with an onboard spectrometer and a soil-sampling auger, letting the team pursue astrobiological signatures in situ. We cannot wait to show you what it can do in the field.' },
    ],
  },
  {
    _id: 'seed-post-3',
    title: 'Research Spotlight: Vision-Based Autonomous Navigation for Martian Terrain',
    slug: 'research-spotlight-vision-based-navigation',
    category: 'research-highlight',
    publishedAt: '2025-02-18T08:30:00.000Z',
    excerpt:
      'A look inside the perception pipeline that lets our rover see, map, and traverse unstructured terrain without GPS — and the research behind it.',
    body: [
      { text: 'Autonomy is where competitions are won and lost. In this research highlight, our autonomous navigation team breaks down the vision-based pipeline that allows our rover to localise and plan paths across rocky, GNSS-denied terrain that mirrors the Martian surface.' },
      { style: 'h2', text: 'From Pixels to Paths' },
      { text: 'The system fuses stereo depth, visual-inertial odometry, and semantic segmentation to build a local traversability map in real time. A sampling-based planner then computes safe trajectories around obstacles, while a recovery behaviour handles the inevitable edge cases when the rover loses confidence in its position.' },
      { text: 'This work underpins a forthcoming paper from the team and continues to evolve with every field test. We believe sharing it openly strengthens the wider student-robotics community.' },
    ],
  },
  {
    _id: 'seed-post-4',
    title: "Sparking Curiosity: Mongol-Tori's STEM Outreach Reaches 500 Students",
    slug: 'stem-outreach-500-students',
    category: 'outreach',
    publishedAt: '2024-11-20T11:00:00.000Z',
    excerpt:
      'From hands-on robotics demos to mentorship sessions, our outreach programme brought space engineering to classrooms across Dhaka this season.',
    body: [
      { text: 'Over the past semester, Mongol-Tori volunteers visited schools and community centres across Dhaka to share the excitement of robotics and space exploration with more than five hundred students. We brought a rover, a pile of sensors, and a simple message: engineering is for everyone.' },
      { style: 'h2', text: 'Why Outreach Matters' },
      { text: 'Many of the students we met had never driven a robot or seen a 3D printer at work. Watching their curiosity turn into questions — and questions into ideas — is one of the most rewarding parts of what we do. Several participants have since expressed interest in joining university robotics teams of their own.' },
      { text: 'Our thanks go to the schools who hosted us and to the volunteers who gave their weekends to make these sessions happen.' },
    ],
  },
  {
    _id: 'seed-post-5',
    title: 'A New Chapter: Welcoming the 2026 Recruitment Cohort',
    slug: 'welcoming-2026-recruitment-cohort',
    category: 'team-news',
    publishedAt: '2026-02-05T09:30:00.000Z',
    excerpt:
      'Mongol-Tori opens its doors to a new generation of builders, coders, and scientists as we kick off the 2026 season.',
    body: [
      { text: 'Every season begins with new faces, and this year is no exception. We are thrilled to welcome our 2026 recruitment cohort to BRACU Mongol-Tori — a talented group of engineers, programmers, and scientists who will help shape our next competition rover.' },
      { style: 'h2', text: 'Building the Team Behind the Rover' },
      { text: 'Recruits join one of our sub-teams — mechanical, electronics, autonomous, science, or management — and are paired with experienced members for hands-on mentorship. Over the coming weeks they will move from onboarding workshops to real subsystem work, contributing to the rover from day one.' },
      { text: 'To everyone joining us: welcome aboard. The work ahead is hard, but the people make it worth it.' },
    ],
  },
  {
    _id: 'seed-post-6',
    title: 'Field Notes from the European Rover Challenge 2024',
    slug: 'field-notes-erc-2024',
    category: 'competition-update',
    publishedAt: '2024-09-18T14:00:00.000Z',
    excerpt:
      'Our team reflects on a demanding week at the European Rover Challenge in Poland — the tasks, the setbacks, and the lessons we are carrying forward.',
    body: [
      { text: 'The European Rover Challenge is one of the most demanding robotics competitions on the calendar, and ERC 2024 in Poland tested every part of our rover and our team. Across the science, navigation, and maintenance tasks, we learned as much from what went wrong as from what went right.' },
      { style: 'h2', text: 'Lessons We Are Carrying Forward' },
      { text: 'A communications dropout during the navigation task cost us valuable points and sent us back to the drawing board on our networking stack. On the other hand, our manipulator performed flawlessly during the maintenance task, validating a season of careful design work. Every result, good or bad, becomes data for next year.' },
      { text: 'We left Poland tired but motivated, with a clear list of priorities for the season ahead. Thank you to everyone who followed along and cheered us on from home.' },
    ],
  },
]

// ── content: research papers (seed-research-1..3) ─────────
const RESEARCH = [
  {
    _id: 'seed-research-1',
    title: 'Vision-Based Autonomous Navigation for Unstructured Planetary Analog Terrain',
    slug: 'vision-based-autonomous-navigation-planetary-analog',
    year: 2024,
    status: 'published',
    conference: 'IEEE International Conference on Robotics and Automation Engineering (ICRAE)',
    topics: ['Autonomous navigation', 'Computer vision', 'SLAM', 'Path planning', 'Field robotics'],
    abstract:
      'Autonomous traversal of unstructured, GNSS-denied terrain remains a central challenge for planetary rovers. We present a vision-centric navigation framework that fuses stereo depth estimation, visual-inertial odometry, and semantic terrain segmentation to construct a real-time traversability map. A sampling-based local planner generates dynamically feasible trajectories, while a confidence-aware recovery policy mitigates localisation drift over long traverses. Field trials on Mars-analog terrain demonstrate robust obstacle avoidance and reliable waypoint navigation without external positioning. The approach generalises across varied lighting and surface conditions, offering a practical autonomy stack for student-built competition rovers.',
    citation:
      'BRACU Mongol-Tori Autonomous Team, "Vision-Based Autonomous Navigation for Unstructured Planetary Analog Terrain," Proc. IEEE ICRAE, 2024.',
  },
  {
    _id: 'seed-research-2',
    title: 'Design and Control of a 6-DOF Robotic Manipulator for Rover Servicing Tasks',
    slug: 'design-control-6dof-manipulator-rover-servicing',
    year: 2024,
    status: 'preprint',
    conference: 'International Journal of Mechanical and Mechatronics Engineering',
    topics: ['Robotic manipulation', 'Control systems', 'Mechanical design', 'Inverse kinematics', 'Mechatronics'],
    abstract:
      'Equipment-servicing missions demand a manipulator that is both dexterous and lightweight enough for a mobile rover platform. We describe the mechanical design and control architecture of a six-degree-of-freedom robotic arm developed for university rover competitions. The design balances payload capacity, reach, and mass through a hybrid actuation scheme and a modular end-effector. A hierarchical controller combines inverse-kinematics-based trajectory generation with compliant force control for delicate panel and switch operations. Bench and field evaluations show repeatable manipulation of competition-representative interface boards.',
    citation:
      'BRACU Mongol-Tori Controls Team, "Design and Control of a 6-DOF Robotic Manipulator for Rover Servicing Tasks," preprint, 2024.',
  },
  {
    _id: 'seed-research-3',
    title: 'In-Situ Soil Spectroscopy for Detecting Astrobiological Signatures on Planetary Analog Surfaces',
    slug: 'in-situ-soil-spectroscopy-astrobiological-signatures',
    year: 2025,
    status: 'under-review',
    conference: 'Astrobiology Science Conference',
    topics: ['Astrobiology', 'Spectroscopy', 'Planetary science', 'Instrumentation', 'Soil analysis'],
    abstract:
      'Detecting potential biosignatures in planetary soils requires instrumentation that is compact, robust, and field-deployable on a mobile rover. This work presents an in-situ science payload integrating reflectance spectroscopy with onboard sample handling for the rapid characterisation of soil composition. We outline a measurement protocol for screening samples for organic and mineralogical indicators relevant to astrobiology. Results from terrestrial analog sites show the system can discriminate between sample classes with limited operator intervention. The payload was designed for the science mission of international rover challenges and is suitable for autonomous field operation.',
    citation:
      'BRACU Mongol-Tori Science Team, "In-Situ Soil Spectroscopy for Detecting Astrobiological Signatures on Planetary Analog Surfaces," under review, 2025.',
  },
]

// ── content: advisor testimonials (seed-testimonial-1..2) ─
// Both featured. The existing real testimonial keeps order 1; these follow.
const TESTIMONIALS = [
  {
    _id: 'seed-testimonial-1',
    name: 'Dr. Rezwan Ahmed',
    role: 'Faculty Advisor, Dept. of Computer Science & Engineering',
    organization: 'BRAC University',
    quote:
      'Mongol-Tori embodies the very best of student engineering — relentless curiosity paired with genuine technical rigour. Watching this team turn ideas into competition-ready rovers, year after year, is a privilege.',
    featured: true,
    order: 2,
  },
  {
    _id: 'seed-testimonial-2',
    name: 'Farhana Islam',
    role: 'Robotics Mentor & Industry Partner',
    organization: 'TechWorks Robotics',
    quote:
      "Few student teams operate with the discipline and ambition I see in Mongol-Tori. They don't just build rovers — they build engineers who are ready for the real world.",
    featured: true,
    order: 3,
  },
]

// ── content: SAR videos ───────────────────────────────────
// Real BRACU Mongol-Tori System Acceptance Review videos from the team's own
// YouTube channel (found & verified via search). `year` is matched to a real
// competition doc of the same year at runtime, falling back to the latest.
//   • `existing: true`  -> PATCH the existing empty sarVideo doc to be valid.
//   • the rest          -> CREATE new seed-* docs.
const SAR_VIDEOS = [
  {
    existing: true,
    year: 2025,
    title: 'Hypersonic — System Acceptance Review | URC 2025',
    youtubeUrl: 'https://www.youtube.com/watch?v=vdP5qrJQqGc',
    description:
      "BRACU Mongol-Tori's System Acceptance Review for the 2025 University Rover Challenge, walking judges through the Hypersonic rover and its performance across the URC mission set.",
  },
  {
    _id: 'seed-sar-1',
    year: 2023,
    title: 'System Acceptance Review | URC 2023',
    youtubeUrl: 'https://www.youtube.com/watch?v=LcXDMddb31I',
    description:
      "BRACU Mongol-Tori's System Acceptance Review submission for the 2023 University Rover Challenge, demonstrating the rover's mobility, manipulation, and autonomy.",
  },
  {
    _id: 'seed-sar-2',
    year: 2022,
    title: 'Encephalon — System Acceptance Review | URC 2022',
    youtubeUrl: 'https://www.youtube.com/watch?v=Yno4DN9ENTA',
    description:
      "BRACU Mongol-Tori's System Acceptance Review for the 2022 University Rover Challenge, featuring the Encephalon rover across the four URC missions.",
  },
]

// ── main ──────────────────────────────────────────────────
async function main() {
  console.log(`\n▶ Seeding content into ${projectId}/${dataset}${DRY ? '  (DRY RUN — nothing will be written)' : ''}\n`)

  // Read the real data we need to reference / patch. Reads are non-destructive.
  let members = []
  let comps = []
  let sarDocs = []
  let researchDocs = []
  try {
    ;[members, comps, sarDocs, researchDocs] = await Promise.all([
      // Only published members — a draft-only ref would dereference to null on the site.
      client.fetch('*[_type=="member" && !(_id in path("drafts.**"))]{_id,name,role,subTeam,focusAreas,skills} | order(name asc)'),
      client.fetch('*[_type=="competition" && !(_id in path("drafts.**"))]{_id,year,shortName,name} | order(year desc)'),
      // The existing real SAR video doc(s) — exclude our own seeds & drafts.
      client.fetch('*[_type=="sarVideo" && !(_id in path("seed-**")) && !(_id in path("drafts.**"))]{_id,title,year,youtubeUrl,competition,description} | order(_createdAt asc)'),
      // The existing real research paper(s) — exclude our own seeds & drafts.
      client.fetch('*[_type=="research" && !(_id in path("seed-**")) && !(_id in path("drafts.**"))]{_id,title,year}'),
    ])
  } catch (err) {
    if (!DRY) throw err
    console.warn('! Could not read from Sanity (missing token?). DRY preview will use placeholders where real _ids are needed.\n')
  }

  // year -> competition lookup (newest wins on ties), with a latest fallback.
  const byYear = new Map()
  for (const c of comps) if (typeof c.year === 'number' && !byYear.has(c.year)) byYear.set(c.year, c)
  const latestComp = comps[0]
  const compForYear = (y) => byYear.get(y) || latestComp
  const compRef = (y) => {
    const c = compForYear(y)
    return c ? { _type: 'reference', _ref: c._id } : undefined
  }

  if (!DRY && members.length === 0) console.warn('! No published members found — post/research author references will be omitted.')
  if (!DRY && comps.length === 0) console.warn('! No published competitions found — SAR video competition references will be omitted (required field will be blank).')

  // ── build documents to createOrReplace ──────────────────
  const newDocs = []

  // Posts (round-robin author across members)
  POSTS.forEach((p, i) => {
    const author = members.length ? { _type: 'reference', _ref: members[i % members.length]._id } : undefined
    newDocs.push({
      _id: p._id,
      _type: 'post',
      title: p.title,
      slug: { _type: 'slug', current: p.slug },
      publishedAt: p.publishedAt,
      category: p.category,
      excerpt: p.excerpt,
      body: buildBody(p.body),
      ...(author ? { author } : {}),
    })
  })

  // Research papers (2–3 round-robin author refs each)
  RESEARCH.forEach((r, i) => {
    const authors = memberRefs(members, i, 3, 'a')
    newDocs.push({
      _id: r._id,
      _type: 'research',
      title: r.title,
      slug: { _type: 'slug', current: r.slug },
      ...(authors.length ? { authors } : {}),
      year: r.year,
      abstract: r.abstract,
      topics: r.topics,
      status: r.status,
      conference: r.conference,
      citation: r.citation,
    })
  })

  // Testimonials
  TESTIMONIALS.forEach((t) => {
    newDocs.push({
      _id: t._id,
      _type: 'testimonial',
      name: t.name,
      role: t.role,
      organization: t.organization,
      quote: t.quote,
      featured: t.featured,
      order: t.order,
    })
  })

  // New SAR video docs
  SAR_VIDEOS.filter((v) => !v.existing).forEach((v) => {
    const ref = compRef(v.year)
    newDocs.push({
      _id: v._id,
      _type: 'sarVideo',
      title: v.title,
      year: v.year,
      youtubeUrl: v.youtubeUrl,
      description: v.description,
      ...(ref ? { competition: ref } : {}),
    })
  })

  // ── build patches (fill-empty-only, never overwrite) ────
  const patches = []
  const pushPatch = (id, label, set, ifMissing) => {
    if (hasKeys(set) || hasKeys(ifMissing)) patches.push({ id, label, set, ifMissing })
  }

  // Patch the existing empty SAR video doc -> valid
  const existingSar = sarDocs[0]
  if (existingSar) {
    const v = SAR_VIDEOS.find((x) => x.existing)
    const ref = compRef(v.year)
    const desired = {
      title: v.title,
      year: v.year,
      youtubeUrl: v.youtubeUrl,
      description: v.description,
      ...(ref ? { competition: ref } : {}),
    }
    const { set, ifMissing } = planDoc(existingSar, desired)
    pushPatch(existingSar._id, `SAR video (existing: ${existingSar._id})`, set, ifMissing)
  } else if (!DRY) {
    console.warn('! No existing empty SAR video doc found to patch (it may already be valid).')
  }
  if (sarDocs.length > 1) {
    console.warn(`! Found ${sarDocs.length} non-seed SAR video docs; only the first is being patched.`)
  }

  // Patch existing research paper(s) null year -> 2023 (only if currently empty)
  for (const r of researchDocs) {
    const { set, ifMissing } = planDoc(r, { year: 2023 })
    pushPatch(r._id, `research year (${r.title ?? r._id})`, set, ifMissing)
  }

  // Patch each member: fill empty focusAreas / skills (+ role/subTeam for stubs)
  for (const m of members) {
    const sub = m.subTeam || FALLBACK_SUBTEAM
    const traits = SUBTEAM_TRAITS[sub] || SUBTEAM_TRAITS[FALLBACK_SUBTEAM]
    const desired = { focusAreas: traits.focusAreas, skills: traits.skills }
    if (!m.role) desired.role = 'Member'
    if (!m.subTeam) desired.subTeam = FALLBACK_SUBTEAM
    const { set, ifMissing } = planDoc(m, desired)
    pushPatch(m._id, `member ${m.name} [${m.subTeam || 'no sub-team → ' + FALLBACK_SUBTEAM}]`, set, ifMissing)
  }

  // ── DRY RUN: report, write nothing ──────────────────────
  if (DRY) {
    console.log('— Documents that would be created (createOrReplace) —')
    for (const d of newDocs) console.log(`  + ${d._type.padEnd(11)} ${d._id}  ·  ${d.title || d.name}`)
    console.log('\n— Patches that would be applied (fill-empty-only) —')
    if (patches.length === 0) console.log('  (none — every targeted field already has content)')
    for (const p of patches) {
      const fields = [...Object.keys(p.ifMissing).map((k) => `${k} (setIfMissing)`), ...Object.keys(p.set).map((k) => `${k} (set)`)]
      console.log(`  ~ ${p.id}\n      ${p.label}\n      fields: ${fields.join(', ')}`)
    }
    console.log(`\n✓ DRY RUN — would create ${newDocs.length} docs and apply ${patches.length} patches. Nothing was sent to Sanity.\n`)
    console.log('  Full JSON of new docs:')
    console.log(JSON.stringify(newDocs, null, 2))
    return
  }

  // ── COMMIT ──────────────────────────────────────────────
  let tx = client.transaction()
  for (const d of newDocs) tx = tx.createOrReplace(d)
  for (const p of patches) {
    tx = tx.patch(p.id, (patch) => {
      let q = patch
      if (hasKeys(p.ifMissing)) q = q.setIfMissing(p.ifMissing)
      if (hasKeys(p.set)) q = q.set(p.set)
      return q
    })
  }
  await tx.commit({ visibility: 'sync' })

  // ── summary ─────────────────────────────────────────────
  const counts = newDocs.reduce((a, d) => ((a[d._type] = (a[d._type] || 0) + 1), a), {})
  console.log('✓ Seed complete.\n')
  console.log('  Created / replaced:')
  console.log(`    • ${counts.post || 0} news posts          (seed-post-*)`)
  console.log(`    • ${counts.research || 0} research papers      (seed-research-*)`)
  console.log(`    • ${counts.sarVideo || 0} SAR videos           (seed-sar-*)`)
  console.log(`    • ${counts.testimonial || 0} advisor testimonials (seed-testimonial-*)`)
  console.log('  Patched (empty fields filled only):')
  console.log(`    • ${patches.length} document(s) — incl. existing SAR video, research year, and member focus/skills`)
  console.log('\n  Remove the created seeds later with:  *[_id in path("seed-**")]\n')
}

main().catch((err) => {
  const msg = String(err.message || '')
  if (/Insufficient permissions|permission "create"|permission "update"|create.*required|update.*required/i.test(msg)) {
    console.error(`
✗ The token authenticated, but it is READ-ONLY (Viewer role) — it can't create or patch documents.

  Fix: create a token with the "Editor" role (not Viewer):
    https://www.sanity.io/manage  →  project "${projectId}"  →  API  →  Tokens  →  Add API token
    Name: "seed",  Permissions: Editor
  Replace SANITY_API_TOKEN in .env.local with the new token, then re-run:
    node scripts/seed-content.mjs
`)
    process.exit(1)
  }
  console.error('\n✗ Seed failed:', msg)
  if (err.responseBody) console.error(err.responseBody)
  process.exit(1)
})

#!/usr/bin/env node
// ============================================================
// Seed DEMO crowdfunding data into the LIVE Sanity dataset.
//
//   node scripts/seed-donations.mjs          # seed config + demo donations
//   node scripts/seed-donations.mjs --dry    # print documents, write nothing
//   node scripts/seed-donations.mjs --clean  # delete every seeded doc
//
// What it does:
//   • CREATES the crowdfunding-config singleton with placeholder payment
//     channels, IF it does not already exist (never overwrites real settings)
//   • CREATES 9 approved + 2 pending donations (seed-donation-*)
//
// The demo amounts deliberately include a TIE (two donors at 5000) so the
// approvedAt tie-break can be exercised, and one donor whose amount would put
// them 1st but who is anonymous — the case where a leak would be most damaging.
//
// Idempotent: deterministic `seed-donation-*` ids via createOrReplace, so
// re-running overwrites in place rather than duplicating.
//
// REMOVE the seeded docs with:  node scripts/seed-donations.mjs --clean
//
// ⚠️  These are FAKE donations. Remove them before the campaign goes live, or
//     the honour roll will credit people who never gave anything.
// ============================================================
import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')
const CLEAN = args.has('--clean')

// ── env ───────────────────────────────────────────────────
function loadEnv() {
  const file = path.join(ROOT, '.env.local')
  if (!fs.existsSync(file)) return {}
  const out = {}
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#') || !t.includes('=')) continue
    const i = t.indexOf('=')
    out[t.slice(0, i).trim()] = t
      .slice(i + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '')
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

  1. Create an "Editor" token:  https://www.sanity.io/manage → project "${projectId}" → API → Tokens
  2. Paste it into .env.local:  SANITY_API_TOKEN=sk...
  3. Re-run:                    node scripts/seed-donations.mjs

  (Run with --dry to preview the documents without a token.)
`)
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

// ── Documents ─────────────────────────────────────────────

const CONFIG = {
  _id: 'crowdfunding-config',
  _type: 'crowdfundingConfig',
  status: 'open',
  headline: 'Get Mongol-Tori to the Start Line',
  pitch:
    'Every competition season runs on parts, freight and visas. We build the rover ourselves — what we cannot manufacture is the plane ticket. Chip in what you can and take your place on the supporters roll.',
  closedMessage:
    'We are not collecting contributions right now. Thank you to everyone who backed the team — the roll below is yours.',
  verificationHours: 48,
  showSupporterCount: true,
  channels: [
    {
      _key: 'ch-bkash',
      method: 'bKash',
      accountNumber: '01700000000',
      accountName: 'BRACU Mongol-Tori',
      accountType: 'Merchant',
      note: 'Use “Payment”, not “Send Money”, so the reference reaches us.',
    },
    {
      _key: 'ch-nagad',
      method: 'Nagad',
      accountNumber: '01800000000',
      accountName: 'BRACU Mongol-Tori',
      accountType: 'Personal',
      note: 'Use “Send Money”.',
    },
    {
      _key: 'ch-bank',
      method: 'Bank Transfer',
      accountNumber: '1234567890123',
      accountName: 'BRAC University — Mongol Tori',
      accountType: 'Current',
      bankName: 'BRAC Bank Limited',
      branch: 'Gulshan',
      routingNumber: '060270246',
      note: 'Add “MONGOLTORI” as the transfer reference.',
    },
  ],
}

/** Days-ago helper so seeded dates are stable relative to the run. */
const daysAgo = (n) => new Date(Date.now() - n * 86_400_000).toISOString()

const DONATIONS = [
  // Rank 1 — anonymous, and the top contributor. The case where a leak of
  // either the amount or the real name would be most damaging.
  {
    id: 'seed-donation-1',
    status: 'approved',
    donorName: 'Ishrat Jahan Mim',
    isAnonymous: true,
    affiliation: 'BRACU EEE ’18',
    message: 'Bring it home.',
    amount: 50000,
    paymentMethod: 'bKash',
    senderAccount: '01711111111',
    transactionId: 'SEEDTRX001',
    contactEmail: 'seed-donor-1@example.com',
    days: 21,
  },
  {
    id: 'seed-donation-2',
    status: 'approved',
    donorName: 'Tanvir Rahman',
    isAnonymous: false,
    affiliation: 'BRACU CSE ’19',
    message: 'Watched you since 2013. Go get gold.',
    amount: 25000,
    paymentMethod: 'Bank Transfer',
    senderAccount: '9876543210987',
    transactionId: 'SEEDTRX002',
    contactEmail: 'seed-donor-2@example.com',
    days: 19,
  },
  {
    id: 'seed-donation-3',
    status: 'approved',
    donorName: 'Nusrat Jahan',
    isAnonymous: false,
    affiliation: 'Alumni, Batch 2016',
    amount: 15000,
    paymentMethod: 'Nagad',
    senderAccount: '01822222222',
    days: 17,
  },
  {
    id: 'seed-donation-4',
    status: 'approved',
    donorName: 'Rafid Hasan',
    isAnonymous: false,
    affiliation: 'BRACU ME ’21',
    message: 'For the arm team.',
    amount: 10000,
    paymentMethod: 'bKash',
    senderAccount: '01733333333',
    days: 15,
  },
  {
    id: 'seed-donation-5',
    status: 'approved',
    donorName: 'Farhana Akter',
    isAnonymous: true,
    amount: 8000,
    paymentMethod: 'Rocket',
    senderAccount: '01944444444',
    days: 13,
  },
  // Ranks 6 & 7 — a TIE at 5000. Earlier approvedAt must win.
  {
    id: 'seed-donation-6',
    status: 'approved',
    donorName: 'Shafiqul Islam',
    isAnonymous: false,
    affiliation: 'BRACU CSE ’23',
    amount: 5000,
    paymentMethod: 'bKash',
    senderAccount: '01755555555',
    days: 11,
  },
  {
    id: 'seed-donation-7',
    status: 'approved',
    donorName: 'Maliha Chowdhury',
    isAnonymous: false,
    message: 'Proud of you all.',
    amount: 5000,
    paymentMethod: 'Nagad',
    senderAccount: '01866666666',
    days: 9,
  },
  {
    id: 'seed-donation-8',
    status: 'approved',
    donorName: 'Arif Mahmud',
    isAnonymous: false,
    affiliation: 'Parent',
    amount: 3000,
    paymentMethod: 'bKash',
    senderAccount: '01777777777',
    days: 7,
  },
  {
    id: 'seed-donation-9',
    status: 'approved',
    donorName: 'Sadia Islam',
    isAnonymous: false,
    affiliation: 'BRACU BBA ’22',
    amount: 1500,
    paymentMethod: 'Upay',
    senderAccount: '01788888888',
    days: 5,
  },
  // Pending — must NOT appear on the public roll.
  {
    id: 'seed-donation-10',
    status: 'pending',
    donorName: 'Kamrul Hasan',
    isAnonymous: false,
    affiliation: 'BRACU CSE ’20',
    message: 'Should not be visible yet.',
    paymentMethod: 'bKash',
    senderAccount: '01799999999',
    transactionId: 'SEEDTRX010',
    days: 2,
  },
  {
    id: 'seed-donation-11',
    status: 'pending',
    donorName: 'Anonymous Pending Donor',
    isAnonymous: true,
    paymentMethod: 'Nagad',
    senderAccount: '01800000001',
    days: 1,
  },
]

function buildDonation(d) {
  const doc = {
    _id: d.id,
    _type: 'donation',
    status: d.status,
    donorName: d.donorName,
    isAnonymous: d.isAnonymous,
    paymentMethod: d.paymentMethod,
    senderAccount: d.senderAccount,
    donatedAt: daysAgo(d.days),
  }
  if (d.affiliation) doc.affiliation = d.affiliation
  if (d.message) doc.message = d.message
  if (d.transactionId) doc.transactionId = d.transactionId
  if (d.contactEmail) doc.contactEmail = d.contactEmail
  if (d.status === 'approved') {
    doc.amount = d.amount
    // Verified a day after it was declared — and for the 5000 tie, donation 6
    // (declared earlier) therefore also verifies earlier, so it outranks 7.
    doc.approvedAt = daysAgo(d.days - 1)
    doc.verifiedBy = 'seed script'
  }
  return doc
}

// ── Run ───────────────────────────────────────────────────
async function main() {
  console.log(`\nProject ${projectId} · dataset ${dataset}${DRY ? ' · DRY RUN' : ''}\n`)

  if (CLEAN) {
    const ids = DONATIONS.map((d) => d.id)
    if (DRY) {
      console.log(`Would delete ${ids.length} seeded donations:\n  ${ids.join('\n  ')}`)
      return
    }
    const tx = ids.reduce((t, id) => t.delete(id), client.transaction())
    await tx.commit()
    console.log(`✓ Deleted ${ids.length} seeded donations.`)
    console.log('  The crowdfunding-config singleton was left in place — edit or delete it by hand.')
    return
  }

  const docs = DONATIONS.map(buildDonation)

  if (DRY) {
    console.log('crowdfunding-config:')
    console.log(JSON.stringify(CONFIG, null, 2))
    console.log(`\n${docs.length} donations:`)
    for (const d of docs) {
      const money = d.amount ? `৳${d.amount.toLocaleString('en-US')}` : '—'
      console.log(`  ${d._id.padEnd(20)} ${d.status.padEnd(9)} ${money.padEnd(10)} ${d.donorName}${d.isAnonymous ? ' (anon)' : ''}`)
    }
    console.log('\nDry run — nothing written.')
    return
  }

  // Never clobber real campaign settings.
  const existing = await client.fetch('*[_id == "crowdfunding-config"][0]._id')
  if (existing) {
    console.log('• crowdfunding-config already exists — left untouched.')
  } else {
    await client.createOrReplace(CONFIG)
    console.log('✓ Created crowdfunding-config (status: open, 3 demo channels).')
  }

  const tx = docs.reduce((t, doc) => t.createOrReplace(doc), client.transaction())
  await tx.commit()

  const approved = docs.filter((d) => d.status === 'approved').length
  const pending = docs.length - approved
  console.log(`✓ Seeded ${docs.length} donations (${approved} approved, ${pending} pending).`)
  console.log('\n⚠️  These are FAKE. Remove before launch:  node scripts/seed-donations.mjs --clean\n')
}

main().catch((err) => {
  console.error('\n✗ Seed failed:', err.message)
  process.exit(1)
})

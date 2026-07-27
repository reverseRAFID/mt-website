#!/usr/bin/env node
// ============================================================
// Seed the merch shop into the LIVE Sanity dataset.
//
//   node scripts/seed-shop.mjs           # create/replace the seed catalogue
//   node scripts/seed-shop.mjs --dry     # build documents, write nothing
//   node scripts/seed-shop.mjs --open    # also set shop status to "open"
//   node scripts/seed-shop.mjs --clean   # delete every seed-shop-* document
//
// Reads NEXT_PUBLIC_SANITY_PROJECT_ID / _DATASET / SANITY_API_TOKEN from
// .env.local. The token needs "Editor" permissions.
//
// What it creates
//   • 4 categories        seed-shop-cat-*
//   • 6 products          seed-shop-product-*   (with size variants + stock)
//   • the shopConfig singleton at the fixed id `shop-config`
//
// Idempotent: deterministic `seed-shop-*` ids via createOrReplace, so a re-run
// overwrites in place and never duplicates.
//
// The shop is seeded CLOSED. Opening it is a deliberate act — pass --open, or
// flip it in Studio → Shop → Shop Settings — so that seeding a demo catalogue
// can never start taking real money-owing orders by accident.
//
// Images: the seed products have no images. `product.images` is required by the
// schema, so these documents are intentionally INVALID until someone uploads
// artwork in the Studio. That is the correct failure mode — a merch store
// showing grey placeholder boxes looks broken to a customer, and Studio will
// point at exactly what is missing.
//
// REMOVE later:  node scripts/seed-shop.mjs --clean
// ============================================================
import { createClient } from '@sanity/client'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const args = new Set(process.argv.slice(2))
const DRY = args.has('--dry')
const OPEN = args.has('--open')
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

const env = { ...loadEnv(), ...process.env }
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = env.SANITY_API_TOKEN

if (!projectId || !token) {
  console.error('✗ NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN must be set in .env.local')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// ── helpers ───────────────────────────────────────────────
let keyCounter = 0
/** Deterministic array keys, so a re-run does not churn every _key. */
const key = (prefix) => `${prefix}-${(keyCounter++).toString(36)}`

const slug = (s) => ({ _type: 'slug', current: s })

function variant(label, stock, extra = {}) {
  return {
    _key: key('v'),
    _type: 'variant',
    label,
    stock,
    lowStockThreshold: 3,
    isActive: true,
    ...extra,
  }
}

function para(text) {
  return {
    _key: key('b'),
    _type: 'block',
    style: 'normal',
    markDefs: [],
    children: [{ _key: key('s'), _type: 'span', text, marks: [] }],
  }
}

// ── categories ────────────────────────────────────────────
const categories = [
  { id: 'seed-shop-cat-apparel', title: 'Apparel', slug: 'apparel', order: 1, description: 'Wear the mission.' },
  { id: 'seed-shop-cat-accessories', title: 'Accessories', slug: 'accessories', order: 2, description: 'Carry it with you.' },
  { id: 'seed-shop-cat-stationery', title: 'Stationery', slug: 'stationery', order: 3, description: 'Desk kit for builders.' },
  { id: 'seed-shop-cat-collectibles', title: 'Collectibles', slug: 'collectibles', order: 4, description: 'Limited runs from the workshop.' },
].map((c) => ({
  _id: c.id,
  _type: 'productCategory',
  title: c.title,
  slug: slug(c.slug),
  description: c.description,
  order: c.order,
}))

const catRef = (id) => ({ _type: 'reference', _ref: id })

// ── products ──────────────────────────────────────────────
const products = [
  {
    _id: 'seed-shop-product-team-tee',
    _type: 'product',
    title: 'Mongol-Tori Team Tee',
    slug: slug('mongol-tori-team-tee'),
    category: catRef('seed-shop-cat-apparel'),
    tagline: 'The shirt the crew wears in the workshop.',
    basePrice: 650,
    compareAtPrice: 800,
    variantAxisLabel: 'Size',
    trackInventory: true,
    isActive: true,
    featured: true,
    order: 1,
    maxPerOrder: 3,
    variants: [
      variant('S', 12),
      variant('M', 20),
      variant('L', 18),
      variant('XL', 6),
      variant('XXL', 2, { priceOverride: 700 }),
    ],
    description: [
      para('Heavyweight cotton, screen-printed with the Mongol-Tori mark. Cut for long days in the lab and long nights before a competition deadline.'),
      para('Pre-shrunk, so the size you order is the size it stays.'),
    ],
    sizeGuide: 'S — chest 38"\nM — chest 40"\nL — chest 42"\nXL — chest 44"\nXXL — chest 46"',
    careInfo: 'Machine wash cold, inside out. Do not iron directly on the print.',
  },
  {
    _id: 'seed-shop-product-hoodie',
    _type: 'product',
    title: 'Rover Crew Hoodie',
    slug: slug('rover-crew-hoodie'),
    category: catRef('seed-shop-cat-apparel'),
    tagline: 'For 3am in the machine shop.',
    basePrice: 1650,
    variantAxisLabel: 'Size',
    trackInventory: true,
    isActive: true,
    featured: true,
    order: 2,
    variants: [variant('M', 8), variant('L', 10), variant('XL', 4), variant('XXL', 0)],
    description: [
      para('Brushed fleece inside, embroidered mark on the chest, and a kangaroo pocket big enough for a multimeter.'),
    ],
    sizeGuide: 'M — chest 42"\nL — chest 44"\nXL — chest 46"\nXXL — chest 48"',
    careInfo: 'Machine wash cold. Tumble dry low.',
  },
  {
    _id: 'seed-shop-product-cap',
    _type: 'product',
    title: 'Field Cap',
    slug: slug('field-cap'),
    category: catRef('seed-shop-cat-apparel'),
    tagline: 'Utah desert tested.',
    basePrice: 550,
    variantAxisLabel: 'Size',
    trackInventory: true,
    isActive: true,
    featured: false,
    order: 3,
    variants: [variant('One size', 25)],
    description: [para('Six-panel cotton cap with an adjustable strap. The one the field crew actually wears.')],
  },
  {
    _id: 'seed-shop-product-mug',
    _type: 'product',
    title: 'Telemetry Mug',
    slug: slug('telemetry-mug'),
    category: catRef('seed-shop-cat-accessories'),
    tagline: '350ml of thermal mass.',
    basePrice: 450,
    variantAxisLabel: 'Option',
    trackInventory: true,
    isActive: true,
    featured: true,
    order: 4,
    // Single-option product: one "Standard" variant holds the stock, exactly
    // like every other product. See SINGLE_VARIANT_LABEL in src/lib/shop.ts.
    variants: [variant('Standard', 30)],
    description: [para('Ceramic mug printed with a rover telemetry readout. Dishwasher safe, which is more than can be said for the rover.')],
    careInfo: 'Dishwasher and microwave safe.',
  },
  {
    _id: 'seed-shop-product-sticker-pack',
    _type: 'product',
    title: 'Sticker Pack',
    slug: slug('sticker-pack'),
    category: catRef('seed-shop-cat-stationery'),
    tagline: 'Eight vinyl decals. Laptop, toolbox, helmet.',
    basePrice: 200,
    variantAxisLabel: 'Option',
    trackInventory: true,
    isActive: true,
    featured: false,
    order: 5,
    variants: [variant('Standard', 60)],
    description: [para('Weatherproof vinyl, die-cut. Subsystem marks, the team logo, and a couple of in-jokes.')],
  },
  {
    _id: 'seed-shop-product-patch',
    _type: 'product',
    title: 'Mission Patch — URC 2026',
    slug: slug('mission-patch-urc-2026'),
    category: catRef('seed-shop-cat-collectibles'),
    tagline: 'Embroidered. Made to order.',
    basePrice: 350,
    variantAxisLabel: 'Option',
    // Made to order — no shelf, so nothing to run out of. Exercises the
    // untracked-inventory path end to end.
    trackInventory: false,
    isActive: true,
    featured: false,
    order: 6,
    variants: [variant('Standard', 0)],
    description: [para('Iron-on embroidered patch for the 2026 University Rover Challenge campaign. Produced in batches — allow a little longer than the usual delivery window.')],
  },
]

// ── shop config singleton ─────────────────────────────────
const shopConfig = {
  _id: 'shop-config',
  _type: 'shopConfig',
  // Seeded CLOSED on purpose — see the header.
  status: OPEN ? 'open' : 'closed',
  closedMessage:
    'The store is closed while we restock. Follow us for the next drop — it usually lands right before a competition.',
  announcement: 'Free handover on BRAC University campus.',
  standardDeliveryFee: 120,
  campusDeliveryEnabled: true,
  campusHandoverPoints: ['UB Ground Floor', 'Robotics Lab (UB 7th floor)', 'Main Gate'],
  requireBracuEmailForCampus: false,
  estimatedDeliveryDays: '3–5 working days',
  minOrderValue: 0,
  maxQtyPerItem: 5,
  maxItemsPerOrder: 20,
  orderPrefix: 'MT',
  supportEmail: 'shop@bracumongoltori.com',
  supportPhone: '+880 1700 000000',
  adminNotifyEmails: [],
  shippingPolicy:
    'We dispatch within two working days of confirming your order. Home delivery is by courier anywhere in Bangladesh at a flat rate. Campus handover is free — we will message you when your order is ready to collect.',
  returnPolicy:
    'Unworn items in original condition can be exchanged for a different size within 7 days of delivery. Printed and made-to-order items cannot be returned unless they arrived faulty. Contact us with your tracking reference to arrange it.',
}

// ── run ───────────────────────────────────────────────────
async function clean() {
  const ids = await client.fetch('*[_id in path("seed-shop-**")]._id')
  if (ids.length === 0) {
    console.log('Nothing to clean.')
    return
  }
  console.log(`Deleting ${ids.length} seed document(s)…`)
  if (DRY) return console.log('[dry] would delete:', ids.join(', '))
  const txn = client.transaction()
  for (const id of ids) txn.delete(id)
  await txn.commit()
  console.log('✓ Cleaned. The shop-config singleton was left in place.')
}

async function seed() {
  const docs = [...categories, ...products, shopConfig]
  console.log(
    `Seeding ${categories.length} categories, ${products.length} products, and the shop config…`
  )

  if (DRY) {
    for (const doc of docs) console.log(`[dry] ${doc._type.padEnd(16)} ${doc._id}`)
    return
  }

  const txn = client.transaction()
  for (const doc of docs) txn.createOrReplace(doc)
  await txn.commit({ visibility: 'sync' })

  const totalStock = products
    .filter((p) => p.trackInventory !== false)
    .flatMap((p) => p.variants)
    .reduce((sum, v) => sum + v.stock, 0)

  console.log(`✓ Seeded. ${totalStock} units of stock across ${products.length} products.`)
  console.log(`  Shop status: ${shopConfig.status.toUpperCase()}${OPEN ? '' : '  (pass --open to open it)'}`)
  console.log('')
  console.log('  NEXT: upload an image for each product in Studio → Shop → Products.')
  console.log('  The schema requires at least one, so they are invalid until you do.')
}

const run = CLEAN ? clean : seed
run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗ Failed:', err.message)
    process.exit(1)
  })

#!/usr/bin/env node
/**
 * Merch shop end-to-end test.
 *
 * Drives the real API routes against the real dataset and asserts the
 * properties that actually matter for money and privacy — the things a unit
 * test cannot prove because they depend on Sanity's transaction semantics.
 *
 *   1. Cart hydration prices from Sanity, ignoring anything the client claims.
 *   2. A hostile cart yields valid state rather than throwing.
 *   3. Placing an order decrements stock by exactly the amount ordered.
 *   4. OVERSELL: N concurrent orders for 1 unit → exactly one wins.
 *   5. Idempotent replay creates one order and decrements once.
 *   6. Campus delivery forces the fee to 0 and stores no home address.
 *   7. expectedTotal mismatch is refused with the server's real figure.
 *   8. Cancellation restores stock exactly once, even on a replayed webhook.
 *   9. The track page renders without leaking unmasked PII.
 *  10. Unsigned and forged webhooks are rejected.
 *
 * Everything it creates is prefixed `seed-shop-test` / `e2e-` and removed at
 * the end, including on failure.
 *
 * Usage:
 *   npm run dev                       # in another terminal
 *   node scripts/test-shop-flow.mjs   # defaults to http://localhost:3000
 *   BASE_URL=http://localhost:3100 node scripts/test-shop-flow.mjs
 */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { createClient } from '@sanity/client'
import { encodeSignatureHeader, SIGNATURE_HEADER_NAME } from '@sanity/webhook'

const ROOT = new URL('..', import.meta.url).pathname
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')

// ── env ───────────────────────────────────────────────────────
function loadEnv() {
  const out = {}
  try {
    for (const line of readFileSync(join(ROOT, '.env.local'), 'utf8').split('\n')) {
      const t = line.trim()
      if (!t || t.startsWith('#') || !t.includes('=')) continue
      const i = t.indexOf('=')
      out[t.slice(0, i).trim()] = t.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')
    }
  } catch {
    /* no .env.local */
  }
  return out
}

const env = { ...loadEnv(), ...process.env }
const projectId = env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token = env.SANITY_API_TOKEN
const webhookSecret = env.SANITY_WEBHOOK_SECRET

if (!projectId || !token) {
  console.error('✗ NEXT_PUBLIC_SANITY_PROJECT_ID and SANITY_API_TOKEN must be set in .env.local')
  process.exit(1)
}

const client = createClient({ projectId, dataset, apiVersion: '2024-01-01', useCdn: false, token })

// ── harness ───────────────────────────────────────────────────
const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const yellow = (s) => `\x1b[33m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

let passed = 0
let failed = 0
let skipped = 0

function ok(label, detail) {
  passed++
  console.log(`  ${green('✓')} ${label}${detail ? dim(` — ${detail}`) : ''}`)
}
function no(label, detail) {
  failed++
  console.error(`  ${red('✗')} ${label}${detail ? `\n      ${detail}` : ''}`)
}
function skip(label, why) {
  skipped++
  console.warn(`  ${yellow('~')} ${label} ${dim(`— skipped: ${why}`)}`)
}
function assert(condition, label, detail) {
  condition ? ok(label, typeof condition === 'string' ? condition : undefined) : no(label, detail)
}
function section(title) {
  console.log(`\n${title}`)
}

async function post(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* non-JSON — surfaced by the caller */
  }
  // A 429 mid-suite is a real finding, not noise: this suite places roughly 25
  // orders, which is a fair stand-in for a merch drop behind campus NAT. Say so
  // loudly rather than letting an undefined trackId crash three lines later.
  if (res.status === 429) {
    throw new Error(
      `Rate limited at ${path}. The suite places ~25 orders from one address; if the ` +
        `per-IP order limit is below that, a real drop from BRACU's campus network ` +
        `would lock students out. Raise RATE in src/app/api/shop/order/route.ts.`
    )
  }
  return { status: res.status, json, text }
}

// ── fixtures ──────────────────────────────────────────────────
const PRODUCT_ID = 'seed-shop-test-product'
const CATEGORY_ID = 'seed-shop-test-category'
const VK_MAIN = 'tv-main'
const VK_SCARCE = 'tv-scarce'
const PRICE = 500
const RUN = Math.random().toString(36).slice(2, 8)

const customer = {
  customerName: 'E2E Test Buyer',
  customerEmail: 'e2e@example.com',
  customerPhone: '01712345678',
}
const homeDelivery = {
  deliveryMethod: 'standard',
  deliveryAddress: { line1: 'House 1, Road 2', area: 'Mirpur', city: 'Dhaka', postcode: '1216' },
}

const createdOrderIds = new Set()

async function setStock(main, scarce) {
  await client
    .patch(PRODUCT_ID)
    .set({
      [`variants[_key=="${VK_MAIN}"].stock`]: main,
      [`variants[_key=="${VK_SCARCE}"].stock`]: scarce,
    })
    .commit({ visibility: 'sync' })
}

const stockOf = (key) =>
  client.fetch(`*[_id=="${PRODUCT_ID}"][0].variants[_key=="${key}"][0].stock`)

async function setUp() {
  const config = await client.fetch('*[_id=="shop-config"][0]{status}')
  const wasOpen = config?.status === 'open'

  await client
    .transaction()
    .createOrReplace({
      _id: CATEGORY_ID,
      _type: 'productCategory',
      title: 'E2E Test',
      slug: { _type: 'slug', current: `e2e-test-${RUN}` },
      order: 999,
    })
    .createOrReplace({
      _id: PRODUCT_ID,
      _type: 'product',
      title: 'E2E Test Product',
      slug: { _type: 'slug', current: `e2e-test-product-${RUN}` },
      category: { _type: 'reference', _ref: CATEGORY_ID },
      basePrice: PRICE,
      isActive: true,
      trackInventory: true,
      variantAxisLabel: 'Size',
      variants: [
        { _key: VK_MAIN, _type: 'variant', label: 'Main', stock: 50, isActive: true },
        { _key: VK_SCARCE, _type: 'variant', label: 'Scarce', stock: 1, isActive: true },
      ],
    })
    .commit({ visibility: 'sync' })

  if (!wasOpen) {
    await client.patch('shop-config').set({ status: 'open' }).commit({ visibility: 'sync' })
  }
  return { wasOpen }
}

async function tearDown(state) {
  const orderIds = await client.fetch('*[_type=="order" && idempotencyKey match "e2e-*"]._id')
  const txn = client.transaction()
  for (const id of new Set([...orderIds, ...createdOrderIds])) txn.delete(id)
  txn.delete(PRODUCT_ID)
  txn.delete(CATEGORY_ID)
  await txn.commit({ visibility: 'sync' }).catch(() => {})

  if (state && !state.wasOpen) {
    await client.patch('shop-config').set({ status: 'closed' }).commit().catch(() => {})
  }
}

// ── the tests ─────────────────────────────────────────────────
async function run() {
  console.log(dim(`Base URL: ${BASE}`))
  console.log(dim(`Dataset:  ${projectId}/${dataset}`))

  // 1 ─ Cart hydration and price integrity
  section('1. Cart hydration ignores anything the client claims about money')
  {
    const { json } = await post('/api/shop/cart', {
      items: [
        // Every money field a hostile client might try to inject.
        { productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 2, unitPrice: 1, lineTotal: 2, price: 1 },
      ],
    })
    const line = json?.lines?.[0]
    assert(line?.unitPrice === PRICE, 'unit price comes from Sanity', `got ${line?.unitPrice}, expected ${PRICE}`)
    assert(json?.subtotal === PRICE * 2, 'subtotal recomputed', `got ${json?.subtotal}`)
    assert(json?.shop?.status === 'open', 'shop status reported')
  }

  // 2 ─ Hostile input
  section('2. A hostile cart yields valid state, not an error')
  {
    const { status, json } = await post('/api/shop/cart', {
      items: [
        { productId: 'drafts.evil', variantKey: VK_MAIN, quantity: 1 },
        { productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 99999 },
        { productId: PRODUCT_ID, variantKey: 'nope"]||true', quantity: 1 },
        { productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1.7 },
        { productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: -5 },
        'garbage',
        null,
        42,
      ],
    })
    assert(status === 200, 'responds 200', `got ${status}`)
    assert(Array.isArray(json?.lines), 'returns a line array')
    const bad = (json?.lines ?? []).find(
      (l) => !Number.isSafeInteger(l.quantity) || l.quantity < 1 || l.unitPrice !== PRICE
    )
    assert(!bad, 'every surviving line is valid', bad && JSON.stringify(bad))
  }

  // 3 ─ Stock decrement
  section('3. Placing an order decrements stock by exactly the amount ordered')
  await setStock(50, 1)
  {
    const before = await stockOf(VK_MAIN)
    const { status, json } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 3 }],
      ...customer,
      ...homeDelivery,
      idempotencyKey: `e2e-${RUN}-basic`,
      elapsedMs: 9000,
    })
    const after = await stockOf(VK_MAIN)
    assert(status === 200 && json?.ok, 'order accepted', json?.error)
    assert(before - after === 3, 'stock down by exactly 3', `${before} → ${after}`)
    assert(/^[A-Z]+-[0-9A-Z]{8}$/.test(json?.trackId ?? ''), 'track ID well-formed', json?.trackId)

    const stored = await client.fetch('*[_type=="order" && trackId==$t][0]{subtotal,deliveryFee,total,status,paymentStatus,stockReserved}', { t: json.trackId })
    assert(stored?.subtotal === PRICE * 3, 'subtotal stored correctly', JSON.stringify(stored))
    assert(stored?.total === stored?.subtotal + stored?.deliveryFee, 'total = subtotal + delivery')
    assert(stored?.status === 'placed' && stored?.paymentStatus === 'unpaid', 'starts placed/unpaid')
    assert(stored?.stockReserved === true, 'marked stockReserved')
  }

  // 4 ─ THE BIG ONE: overselling under concurrency
  section('4. Ten concurrent orders for one unit — exactly one may win')
  await setStock(50, 1)
  {
    const attempts = await Promise.all(
      Array.from({ length: 10 }, (_, i) =>
        post('/api/shop/order', {
          items: [{ productId: PRODUCT_ID, variantKey: VK_SCARCE, quantity: 1 }],
          ...customer,
          customerName: `Racer ${i}`,
          ...homeDelivery,
          idempotencyKey: `e2e-${RUN}-race-${i}`,
          elapsedMs: 9000,
        })
      )
    )
    const wins = attempts.filter((a) => a.status === 200 && a.json?.ok)
    const stock = await stockOf(VK_SCARCE)

    assert(wins.length === 1, 'exactly one order succeeded', `${wins.length} succeeded`)
    assert(stock === 0, 'stock landed on 0', `got ${stock}`)
    assert(stock >= 0, 'stock never went negative', `got ${stock}`)
    const rejected = attempts.filter((a) => !a.json?.ok)
    assert(
      rejected.every((a) => a.json?.code === 'cart_changed' || a.json?.code === 'busy'),
      'losers got a typed, explainable rejection',
      JSON.stringify(rejected.map((a) => a.json?.code))
    )
  }

  // 5 ─ Idempotency
  section('5. A replayed request creates one order and decrements once')
  await setStock(50, 1)
  {
    const key = `e2e-${RUN}-idem`
    const body = {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 2 }],
      ...customer,
      ...homeDelivery,
      idempotencyKey: key,
      elapsedMs: 9000,
    }
    const before = await stockOf(VK_MAIN)
    const first = await post('/api/shop/order', body)
    // Sequential replay (double-click) and concurrent replay (retried request).
    const second = await post('/api/shop/order', body)
    const [third, fourth] = await Promise.all([
      post('/api/shop/order', body),
      post('/api/shop/order', body),
    ])
    const after = await stockOf(VK_MAIN)
    const count = await client.fetch('count(*[_type=="order" && idempotencyKey==$k])', { k: key })

    assert(count === 1, 'exactly one order exists', `got ${count}`)
    assert(before - after === 2, 'stock decremented once', `${before} → ${after}`)
    assert(
      [second, third, fourth].every((r) => r.json?.trackId === first.json?.trackId),
      'every replay returned the original track ID'
    )
    assert(
      second.json?.total === first.json?.total && second.json?.total > 0,
      'replay reports the real total, not zero',
      `first ${first.json?.total}, replay ${second.json?.total}`
    )
  }

  // 6 ─ Campus delivery
  section('6. Campus handover is free and stores no home address')
  {
    const { json } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      deliveryMethod: 'campus',
      campusDetails: { handoverPoint: 'UB Ground Floor', bracuId: '20101234' },
      // A hostile payload trying to get free delivery AND a home drop-off.
      deliveryAddress: { line1: 'SNEAKY HOME ADDRESS', area: 'Gulshan', city: 'Dhaka' },
      deliveryFee: 999,
      idempotencyKey: `e2e-${RUN}-campus`,
      elapsedMs: 9000,
    })
    const stored = await client.fetch(
      '*[_type=="order" && trackId==$t][0]{deliveryFee,total,subtotal,deliveryAddress,campusDetails}',
      { t: json?.trackId }
    )
    assert(stored?.deliveryFee === 0, 'delivery fee forced to 0', `got ${stored?.deliveryFee}`)
    assert(stored?.total === stored?.subtotal, 'total equals subtotal')
    assert(!stored?.deliveryAddress, 'the smuggled home address was discarded', JSON.stringify(stored?.deliveryAddress))
    assert(stored?.campusDetails?.handoverPoint === 'UB Ground Floor', 'handover point stored')
  }

  // 7 ─ Price-change guard
  section('7. A total the customer never saw is refused')
  {
    const { status, json } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      deliveryMethod: 'campus',
      campusDetails: { handoverPoint: 'UB' },
      expectedTotal: 1,
      idempotencyKey: `e2e-${RUN}-total`,
      elapsedMs: 9000,
    })
    assert(status === 409, 'responds 409', `got ${status}`)
    assert(json?.code === 'total_changed', 'typed as total_changed', json?.code)
    assert(json?.totals?.total === PRICE, "reports the server's real total", `got ${json?.totals?.total}`)
  }

  // 8 ─ Validation
  section('8. Bad input is rejected before anything is written')
  {
    const cases = [
      [{ ...customer, customerEmail: 'not-an-email' }, 'invalid email'],
      [{ ...customer, customerPhone: '12345' }, 'invalid phone'],
      [{ ...customer, customerName: '' }, 'missing name'],
    ]
    for (const [overrides, label] of cases) {
      const { status } = await post('/api/shop/order', {
        items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
        ...customer,
        ...overrides,
        ...homeDelivery,
        idempotencyKey: `e2e-${RUN}-invalid-${label.replace(/\W/g, '')}`,
        elapsedMs: 9000,
      })
      assert(status === 400, `${label} → 400`, `got ${status}`)
    }

    // Missing address on a home delivery.
    const { status: addrStatus } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      deliveryMethod: 'standard',
      deliveryAddress: {},
      idempotencyKey: `e2e-${RUN}-noaddr`,
      elapsedMs: 9000,
    })
    assert(addrStatus === 400, 'missing address → 400', `got ${addrStatus}`)

    // Honeypot and fill-timer answer a decoy success and must not create an order.
    const honey = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      ...homeDelivery,
      website: 'http://spam.example',
      idempotencyKey: `e2e-${RUN}-honey`,
      elapsedMs: 9000,
    })
    const honeyCount = await client.fetch('count(*[_type=="order" && idempotencyKey==$k])', { k: `e2e-${RUN}-honey` })
    assert(honey.json?.ok === true && honeyCount === 0, 'honeypot: decoy success, no order written', `count ${honeyCount}`)

    const fast = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      ...homeDelivery,
      idempotencyKey: `e2e-${RUN}-fast`,
      elapsedMs: 200,
    })
    const fastCount = await client.fetch('count(*[_type=="order" && idempotencyKey==$k])', { k: `e2e-${RUN}-fast` })
    assert(fast.json?.ok === true && fastCount === 0, 'fill timer: decoy success, no order written', `count ${fastCount}`)
  }

  // 9 ─ Cancellation restore
  section('9. Cancelling restores stock exactly once')
  if (!webhookSecret) {
    skip('cancellation restore', 'SANITY_WEBHOOK_SECRET not set')
  } else {
    await setStock(50, 1)
    const { json } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 4 }],
      ...customer,
      ...homeDelivery,
      idempotencyKey: `e2e-${RUN}-cancel`,
      elapsedMs: 9000,
    })
    const order = await client.fetch('*[_type=="order" && trackId==$t][0]{_id,_type,trackId,status}', { t: json.trackId })
    const afterOrder = await stockOf(VK_MAIN)

    await client.patch(order._id).set({ status: 'cancelled', cancellationReason: 'E2E test' }).commit({ visibility: 'sync' })
    order.status = 'cancelled'

    async function fireWebhook() {
      const body = JSON.stringify(order)
      const sig = await encodeSignatureHeader(body, Date.now(), webhookSecret)
      const res = await fetch(`${BASE}/api/shop/webhook`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', [SIGNATURE_HEADER_NAME]: sig },
        body,
      })
      return { status: res.status, json: await res.json().catch(() => null) }
    }

    const first = await fireWebhook()
    const restored = await stockOf(VK_MAIN)
    const replay = await fireWebhook()
    const afterReplay = await stockOf(VK_MAIN)

    assert(first.status === 200, 'webhook accepted a signed request', `got ${first.status}`)
    assert(restored - afterOrder === 4, 'stock restored by exactly 4', `${afterOrder} → ${restored}`)
    assert(afterReplay === restored, 'a replayed webhook did NOT restore twice', `${restored} → ${afterReplay}`)
    assert(
      (replay.json?.actions ?? []).some((a) => String(a).includes('already_restored')),
      'replay reported already_restored',
      JSON.stringify(replay.json?.actions)
    )

    // 10 ─ Webhook auth
    section('10. Unsigned and forged webhooks are rejected')
    const unsigned = await fetch(`${BASE}/api/shop/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(order),
    })
    const forged = await fetch(`${BASE}/api/shop/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', [SIGNATURE_HEADER_NAME]: `t=${Date.now()}, v1=deadbeef` },
      body: JSON.stringify(order),
    })
    assert(unsigned.status === 401, 'unsigned → 401', `got ${unsigned.status}`)
    assert(forged.status === 401, 'forged signature → 401', `got ${forged.status}`)
  }

  // 11 ─ Track page masking
  section('11. The track page shows the order without leaking PII')
  {
    const { json } = await post('/api/shop/order', {
      items: [{ productId: PRODUCT_ID, variantKey: VK_MAIN, quantity: 1 }],
      ...customer,
      customerPhone: '01798765432',
      deliveryMethod: 'standard',
      deliveryAddress: { line1: 'SECRETHOUSE 42', area: 'Banani', city: 'Dhaka', postcode: '1213' },
      idempotencyKey: `e2e-${RUN}-track`,
      elapsedMs: 9000,
    })

    const res = await fetch(`${BASE}/shop/track/${json.trackId}`)
    const html = await res.text()

    assert(res.status === 200, 'track page renders', `got ${res.status}`)
    assert(html.includes(json.trackId), 'shows the track ID')
    assert(html.includes('E2E Test Buyer'), 'shows the customer name')
    assert(html.includes('Banani'), 'shows the coarse area')

    // The leak assertions — these are the point of the test.
    assert(!html.includes('SECRETHOUSE 42'), 'street line NOT in the HTML')
    assert(!html.includes('01798765432'), 'full phone NOT in the HTML')
    assert(!html.includes('1213'), 'postcode NOT in the HTML')
    assert(!html.includes('e2e@example.com'), 'email NOT in the HTML')
    assert(html.includes('765') || html.includes('••'), 'phone shown masked')
    assert(/name="robots"[^>]*noindex/i.test(html) || html.includes('noindex'), 'page is noindex')
  }

  // 12 ─ Unknown track ID
  section('12. An unknown track ID reveals nothing')
  {
    const res = await fetch(`${BASE}/shop/track/MT-ZZZZZZZZ`)
    const html = await res.text()
    assert(res.status === 200, 'renders a page rather than erroring', `got ${res.status}`)
    assert(html.includes('could not find that order'), 'shows the not-found panel')
  }
}

// ── main ──────────────────────────────────────────────────────
let state = null
try {
  console.log('Setting up fixtures…')
  state = await setUp()
  await run()
} catch (err) {
  failed++
  console.error(`\n${red('✗ Test run threw')}\n  ${err.stack || err.message}`)
} finally {
  console.log('\nCleaning up…')
  await tearDown(state).catch((err) => console.error('  cleanup failed:', err.message))
}

console.log('')
const summary = `${passed} passed, ${failed} failed${skipped ? `, ${skipped} skipped` : ''}`
if (failed > 0) {
  console.error(red(`✗ ${summary}`))
  process.exit(1)
}
console.log(green(`✓ ${summary}`))

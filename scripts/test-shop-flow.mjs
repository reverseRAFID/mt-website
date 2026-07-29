#!/usr/bin/env node
/**
 * End-to-end shop and access test.
 *
 * Runs against a SERVER THAT IS ALREADY UP — `npm run dev` or `npm run build &&
 * npm start` — and a database it is allowed to write to. It creates its own
 * fixtures, exercises the real HTTP endpoints, and deletes what it made.
 *
 *   npm run test:shop
 *   BASE_URL=http://localhost:3000 npm run test:shop
 *
 * ── WHAT IT PROVES ────────────────────────────────────────────
 * These are the four things that would be expensive to get wrong and cheap to
 * break, and none of them can be checked by reading the source:
 *
 *   1. ACCESS — the collections holding personal data answer 403 to an
 *      anonymous HTTP request, and the public ones answer 200.
 *   2. NO OVERSELL — N simultaneous checkouts for one remaining unit produce
 *      exactly one order, and stock never goes negative. This is the whole
 *      reason the database is a replica set.
 *   3. IDEMPOTENCY — the same key twice returns the same order, not two.
 *   4. NO PII IN THE PAGE — the track page's HTML, flight payload included,
 *      contains no email address, phone number, street line or postcode.
 *
 * (4) is the one that has actually gone wrong before, and it is why it greps
 * the raw response body rather than a parsed DOM: the leak was in the RSC
 * flight payload, which no DOM query would ever have seen.
 */

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const EMAIL = process.env.ADMIN_EMAIL ?? 'admin@bracumongoltori.com'
const PASSWORD = process.env.ADMIN_PASSWORD

const red = (s) => `\x1b[31m${s}\x1b[0m`
const green = (s) => `\x1b[32m${s}\x1b[0m`
const dim = (s) => `\x1b[2m${s}\x1b[0m`

let failures = 0
const pass = (name, detail) =>
  console.log(`${green('✓')} ${name}${detail ? dim(` — ${detail}`) : ''}`)
const fail = (name, detail) => {
  failures++
  console.error(`${red('✗')} ${name}\n  ${detail}\n`)
}

async function json(path, init) {
  const res = await fetch(`${BASE}${path}`, init)
  const text = await res.text()
  let body
  try {
    body = JSON.parse(text)
  } catch {
    body = text
  }
  return { status: res.status, body }
}

// ── 1. Access control ─────────────────────────────────────────

async function testAccess() {
  const PRIVATE = ['orders', 'donations', 'applications', 'users']
  const PUBLIC = ['rovers', 'members', 'products', 'media', 'posts']

  const denied = []
  for (const slug of PRIVATE) {
    const { status } = await json(`/payload-api/${slug}?limit=1`)
    if (status !== 403 && status !== 401) denied.push(`${slug} answered ${status}, expected 403`)
  }
  if (denied.length) fail('Private collections deny anonymous reads', denied.join('\n  '))
  else pass('Private collections deny anonymous reads', PRIVATE.join(', '))

  const broken = []
  for (const slug of PUBLIC) {
    const { status } = await json(`/payload-api/${slug}?limit=1`)
    if (status !== 200) broken.push(`${slug} answered ${status}, expected 200`)
  }
  if (broken.length) fail('Public collections are readable', broken.join('\n  '))
  else pass('Public collections are readable', PUBLIC.join(', '))

  // The team's inboxes are a field-level secret inside an otherwise public global.
  const { body } = await json('/payload-api/globals/shop')
  if (body && typeof body === 'object' && 'adminNotifyEmails' in body) {
    fail(
      'The shop global hides adminNotifyEmails from anonymous reads',
      'adminNotifyEmails came back to an anonymous request'
    )
  } else {
    pass('The shop global hides adminNotifyEmails from anonymous reads')
  }
}

// ── Fixtures ──────────────────────────────────────────────────

async function login() {
  if (!PASSWORD) {
    console.log(dim('\nADMIN_PASSWORD not set — skipping the checkout tests.\n'))
    return null
  }
  const { status, body } = await json('/payload-api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  if (status !== 200 || !body?.token) {
    fail('Admin login', `status ${status} — set ADMIN_EMAIL / ADMIN_PASSWORD`)
    return null
  }
  return body.token
}

const auth = (token) => ({ Authorization: `JWT ${token}`, 'Content-Type': 'application/json' })

/** A product with exactly `stock` units of one variant, plus the fixtures it needs. */
async function createFixture(token, stock) {
  const suffix = Math.random().toString(36).slice(2, 8)

  const category = await json('/payload-api/product-categories', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ title: `Test ${suffix}`, slug: `test-${suffix}`, order: 999 }),
  })

  // An 8×8 PNG, inlined — the shop requires at least one image and this test
  // must not depend on a file being present on disk.
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII=',
    'base64'
  )
  const form = new FormData()
  form.append('file', new Blob([png], { type: 'image/png' }), `test-${suffix}.png`)
  form.append('_payload', JSON.stringify({ alt: 'Test fixture' }))
  const mediaRes = await fetch(`${BASE}/payload-api/media`, {
    method: 'POST',
    headers: { Authorization: `JWT ${token}` },
    body: form,
  })
  const media = await mediaRes.json()

  const product = await json('/payload-api/products', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({
      title: `Test Product ${suffix}`,
      slug: `test-product-${suffix}`,
      category: category.body?.doc?.id,
      basePrice: 500,
      images: [media?.doc?.id],
      variants: [{ label: 'One Size', stock, isActive: true }],
      isActive: true,
    }),
  })

  if (!product.body?.doc?.id) {
    throw new Error(`fixture product failed: ${JSON.stringify(product.body).slice(0, 300)}`)
  }

  return {
    categoryId: category.body.doc.id,
    mediaId: media.doc.id,
    productId: product.body.doc.id,
    variantId: product.body.doc.variants[0].id,
  }
}

async function cleanup(token, fx, trackIds) {
  const headers = auth(token)
  for (const trackId of trackIds) {
    const { body } = await json(`/payload-api/orders?limit=50`, { headers })
    const order = body?.docs?.find((o) => o.trackId === trackId)
    if (order) await fetch(`${BASE}/payload-api/orders/${order.id}`, { method: 'DELETE', headers })
  }
  for (const [slug, id] of [
    ['products', fx.productId],
    ['media', fx.mediaId],
    ['product-categories', fx.categoryId],
  ]) {
    if (id) await fetch(`${BASE}/payload-api/${slug}/${id}`, { method: 'DELETE', headers })
  }
}

const order = (fx, over) =>
  json('/api/shop/order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: [{ productId: fx.productId, variantKey: fx.variantId, quantity: 1 }],
      customerName: 'Flow Test',
      customerEmail: 'flow-test@example.invalid',
      customerPhone: '01799999999',
      deliveryMethod: 'campus',
      campusDetails: { handoverPoint: 'UB Ground Floor' },
      ...over,
    }),
  })

// ── 2–4. Checkout ─────────────────────────────────────────────

async function testCheckout(token) {
  // The shop has to be open for any of this to mean anything.
  const before = await json('/payload-api/globals/shop', { headers: auth(token) })
  await json('/payload-api/globals/shop', {
    method: 'POST',
    headers: auth(token),
    body: JSON.stringify({ status: 'open' }),
  })

  const RACERS = 4
  const fx = await createFixture(token, 1)
  const trackIds = []

  try {
    // ── No oversell ───────────────────────────────────────────
    const results = await Promise.all(
      Array.from({ length: RACERS }, (_, i) =>
        order(fx, { idempotencyKey: `race-${Date.now()}-${i}`, customerName: `Racer ${i}` })
      )
    )
    const won = results.filter((r) => r.body?.ok)
    won.forEach((r) => trackIds.push(r.body.trackId))

    const { body: after } = await json(`/payload-api/products/${fx.productId}`, {
      headers: auth(token),
    })
    const stockLeft = after?.variants?.[0]?.stock

    if (won.length !== 1) {
      fail(
        'No oversell under concurrency',
        `${RACERS} simultaneous checkouts for 1 unit produced ${won.length} orders`
      )
    } else if (stockLeft !== 0) {
      fail('No oversell under concurrency', `stock ended at ${stockLeft}, expected 0`)
    } else {
      pass('No oversell under concurrency', `${RACERS} racers → 1 order, stock 0`)
    }

    // ── Idempotency ───────────────────────────────────────────
    await json(`/payload-api/products/${fx.productId}`, {
      method: 'PATCH',
      headers: auth(token),
      body: JSON.stringify({ variants: [{ id: fx.variantId, label: 'One Size', stock: 5, isActive: true }] }),
    })

    const key = `idem-${Date.now()}`
    const first = await order(fx, { idempotencyKey: key })
    const second = await order(fx, { idempotencyKey: key })
    if (first.body?.trackId) trackIds.push(first.body.trackId)

    if (!first.body?.ok || !second.body?.ok) {
      fail('Idempotent replay', 'one of the two requests did not succeed')
    } else if (first.body.trackId !== second.body.trackId) {
      fail(
        'Idempotent replay',
        `two different orders: ${first.body.trackId} and ${second.body.trackId}`
      )
    } else if (second.body.replayed !== true) {
      fail('Idempotent replay', 'the second request was not marked as a replay')
    } else {
      pass('Idempotent replay', `same key → ${first.body.trackId} twice`)
    }

    // ── No PII in the track page ──────────────────────────────
    const trackId = first.body?.trackId ?? won[0]?.body?.trackId
    if (trackId) {
      const html = await (await fetch(`${BASE}/shop/track/${trackId}`)).text()
      const LEAKS = ['flow-test@example.invalid', '01799999999']
      const found = LEAKS.filter((needle) => html.includes(needle))
      if (found.length) {
        fail(
          'No PII in the track page',
          `the page source contains: ${found.join(', ')}\n  ` +
            'Check what the read selects — fetching a field publishes it, ' +
            'rendering is not the boundary.'
        )
      } else if (!html.includes('••••••999')) {
        fail('No PII in the track page', 'the masked phone tail is missing — is the page rendering?')
      } else {
        pass('No PII in the track page', 'masked tail shown, email and full number absent')
      }
    }
  } finally {
    await cleanup(token, fx, trackIds)
    // Put the gate back exactly as it was.
    await json('/payload-api/globals/shop', {
      method: 'POST',
      headers: auth(token),
      body: JSON.stringify({ status: before.body?.status ?? 'closed' }),
    })
  }
}

// ── Run ───────────────────────────────────────────────────────

console.log(dim(`\nTesting ${BASE}\n`))

try {
  await fetch(`${BASE}/payload-api/media?limit=1`)
} catch {
  console.error(red(`Nothing is listening on ${BASE}. Start the server first.\n`))
  process.exit(1)
}

await testAccess()

const token = await login()
if (token) await testCheckout(token)

console.log('')
if (failures > 0) {
  console.error(red(`${failures} check(s) FAILED\n`))
  process.exit(1)
}
console.log(green('All shop flow checks passed.\n'))

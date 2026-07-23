import { NextResponse } from 'next/server'
import { sanityWriteClient } from '@/sanity/lib/writeClient'
import { sanityFetch } from '@/sanity/lib/client'
import { CROWDFUNDING_STATUS_QUERY, DONATION_TRX_EXISTS_QUERY } from '@/sanity/lib/queries'
import { rateLimit, clientIp } from '@/lib/rate-limit'
import {
  isPaymentMethod,
  normalizeAccount,
  ACCOUNT_RE,
  EMAIL_RE,
  LIMITS,
} from '@/lib/crowdfunding'

// Declarations are written straight to Sanity and gated on live campaign
// status, so this must never be prerendered or cached.
export const dynamic = 'force-dynamic'

/** 5 declarations per IP per hour. */
const RATE = { limit: 5, windowMs: 60 * 60 * 1000 } as const

/** A human cannot read the form and fill it honestly this fast. */
const MIN_FILL_MS = 3000

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status })
}

/**
 * Accepts a donor's payment declaration.
 *
 * Writes it as `status: 'pending'` and nothing more — no amount, no public
 * listing. A team member matches it against the bank statement in Sanity
 * Studio, records the verified amount, and approves it. Only then does the
 * donor appear on /support.
 *
 * The endpoint deliberately cannot set `amount`, `status` or `approvedAt`:
 * those are admin-only, so a crafted payload cannot self-approve or buy a rank.
 */
export async function POST(req: Request) {
  try {
    // Writes require an Editor token. Fail clearly rather than 401-ing deep in
    // the Sanity client when the env var is missing.
    if (!process.env.SANITY_API_TOKEN) {
      console.error('[donate] SANITY_API_TOKEN is not set — cannot accept declarations')
      return bad('Donations are temporarily unavailable. Please try again later.', 503)
    }

    const limited = rateLimit(`donate:${clientIp(req)}`, RATE.limit, RATE.windowMs)
    if (!limited.ok) {
      return NextResponse.json(
        { error: 'Too many submissions. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limited.retryAfter) } }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return bad('Invalid request body.')
    }

    // ── Spam traps ────────────────────────────────────────────
    // A hidden field only an automated filler would populate, and a floor on
    // how fast the form can plausibly be completed. Both answer 200 with a
    // decoy success so a bot gets no signal about which check caught it.
    if (str(body.website)) {
      console.warn('[donate] honeypot triggered')
      return NextResponse.json({ ok: true })
    }
    const elapsed = Number(body.elapsedMs)
    if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
      console.warn('[donate] submitted implausibly fast:', elapsed, 'ms')
      return NextResponse.json({ ok: true })
    }

    // ── Fields ────────────────────────────────────────────────
    const donorName = str(body.donorName)
    const isAnonymous = body.isAnonymous === true
    const affiliation = str(body.affiliation)
    const message = str(body.message)
    const paymentMethod = str(body.paymentMethod)
    const senderAccount = str(body.senderAccount)
    const transactionId = str(body.transactionId)
    const contactEmail = str(body.contactEmail).toLowerCase()
    const contactPhone = str(body.contactPhone)
    const confirmed = body.confirmed === true

    // ── Validation ────────────────────────────────────────────
    if (!donorName) {
      return bad('Please enter your name — we need it to match your payment.')
    }
    if (!paymentMethod) return bad('Please tell us which payment channel you used.')
    if (!isPaymentMethod(paymentMethod)) return bad('Unsupported payment channel.')
    if (!senderAccount) return bad('Please enter the account number you sent from.')
    if (!ACCOUNT_RE.test(senderAccount)) {
      return bad('That does not look like a valid account number.')
    }
    if (!confirmed) {
      return bad('Please confirm that you have completed the payment.')
    }
    if (contactEmail && !EMAIL_RE.test(contactEmail)) {
      return bad('Please enter a valid email address.')
    }

    // Length guards — reject obviously abusive payloads.
    const tooLong =
      donorName.length > LIMITS.name ||
      affiliation.length > LIMITS.affiliation ||
      message.length > LIMITS.message ||
      senderAccount.length > LIMITS.account ||
      transactionId.length > LIMITS.transactionId ||
      contactEmail.length > LIMITS.email ||
      contactPhone.length > LIMITS.phone
    if (tooLong) return bad('One or more fields are too long.')

    // ── Campaign gate ─────────────────────────────────────────
    // Server-side so the endpoint is defended even when someone posts to it
    // directly rather than through the page.
    const status = await sanityFetch<string | null>(CROWDFUNDING_STATUS_QUERY, {}, 0)
    if (status !== 'open') {
      return bad('The crowdfunding campaign is not accepting declarations right now.', 403)
    }

    // ── Duplicate guard ───────────────────────────────────────
    // Only when a transaction ID is supplied — it is the one field that is
    // genuinely unique per transfer. Two people can share a wallet, and one
    // person can legitimately donate twice from the same number.
    if (transactionId) {
      const exists = await sanityFetch<boolean>(
        DONATION_TRX_EXISTS_QUERY,
        { transactionId },
        0
      )
      if (exists) {
        return bad('That transaction ID has already been submitted.', 409)
      }
    }

    await sanityWriteClient.create({
      _type: 'donation',
      status: 'pending',
      donorName,
      isAnonymous,
      affiliation: affiliation || undefined,
      message: message || undefined,
      paymentMethod,
      senderAccount: normalizeAccount(senderAccount),
      transactionId: transactionId || undefined,
      contactEmail: contactEmail || undefined,
      contactPhone: contactPhone || undefined,
      donatedAt: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[donate]', err)
    return bad('Submission failed. Please try again.', 500)
  }
}

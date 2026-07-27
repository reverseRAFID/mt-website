// ============================================================
// Transactional email — SERVER ONLY.
//
// A thin, deliberately un-clever wrapper around Resend.
//
// ── THE RULE: SENDING MAIL MUST NEVER LOSE AN ORDER ───────────
// By the time anything here runs, the order is already committed and the stock
// is already reserved. If the mail fails, the customer's purchase is still
// real and the team can still ship it. So `safeSend()` never throws and never
// rejects — it returns an outcome, the caller records that outcome on the
// order, and the Studio surfaces it under Shop → Email Problems for a human to
// re-send.
//
// The opposite design — letting a send failure propagate — would turn a
// transient DNS blip at Resend into a 500 at checkout, after the money had
// already been committed to being owed.
// ============================================================

import { Resend } from 'resend'

/** What happened to a send. Recorded on the order as `emailStatus`. */
export type SendOutcome = 'sent' | 'failed' | 'skipped'

export interface MailMessage {
  to: string | string[]
  subject: string
  html: string
  text: string
  /** Where a customer's reply should land — the team's support address. */
  replyTo?: string
}

const DEFAULT_FROM = 'BRACU Mongol-Tori <onboarding@resend.dev>'

let client: Resend | null = null

/**
 * Lazily construct the client.
 *
 * Deferred so that importing this module never requires RESEND_API_KEY. Next
 * evaluates route modules while collecting page data at build time, and a
 * top-level `new Resend(undefined)` would break `next build` on a runner that
 * has no secrets yet — the same reasoning as src/lib/db.ts.
 */
function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!client) client = new Resend(key)
  return client
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function fromAddress(): string {
  return process.env.SHOP_FROM_EMAIL?.trim() || DEFAULT_FROM
}

/**
 * Escape a value for interpolation into HTML.
 *
 * This is the injection boundary for the whole email layer. Customer names,
 * delivery notes and cancellation reasons all end up inside markup, and every
 * one of them is attacker-supplied free text. Templates must pass every dynamic
 * value through here — see the `h` alias in templates.ts.
 *
 * Escapes quotes as well as angle brackets, because values are also
 * interpolated into attributes.
 */
export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validRecipients(to: string | string[]): string[] {
  const list = Array.isArray(to) ? to : [to]
  return [
    ...new Set(
      list
        .map((address) => (typeof address === 'string' ? address.trim() : ''))
        .filter((address) => EMAIL_RE.test(address))
    ),
  ]
}

/**
 * A subject line is a header, so it cannot contain line breaks.
 *
 * Resend takes JSON rather than raw SMTP, so this is not classic header
 * injection, but a subject is built partly from customer-influenced data and a
 * newline in it is malformed either way.
 */
function cleanSubject(subject: string): string {
  return subject.replace(/[\r\n]+/g, ' ').trim().slice(0, 200)
}

/**
 * Send, and report what happened. Never throws.
 *
 * - `skipped` — no API key configured. Expected in local development and on a
 *   deployment where email has not been set up yet.
 * - `failed`  — Resend rejected it, the network died, or there was no valid
 *   recipient. Logged with enough context to find the order.
 * - `sent`    — accepted by Resend.
 */
export async function safeSend(message: MailMessage): Promise<SendOutcome> {
  try {
    const recipients = validRecipients(message.to)
    if (recipients.length === 0) {
      console.error('[shop:email] no valid recipient for:', cleanSubject(message.subject))
      return 'failed'
    }

    const resend = getClient()
    if (!resend) {
      console.warn(
        '[shop:email] RESEND_API_KEY is not set — skipping:',
        cleanSubject(message.subject)
      )
      return 'skipped'
    }

    const { error } = await resend.emails.send({
      from: fromAddress(),
      to: recipients,
      subject: cleanSubject(message.subject),
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    })

    if (error) {
      console.error('[shop:email] send rejected:', error)
      return 'failed'
    }

    return 'sent'
  } catch (err) {
    // Deliberately swallowed. See the header comment: an order is already
    // committed by the time we get here, and losing it over a mail failure
    // would be strictly worse than a customer not receiving a receipt.
    console.error('[shop:email] send threw:', err)
    return 'failed'
  }
}

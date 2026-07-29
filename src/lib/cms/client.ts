// ============================================================
// The Payload client — SERVER ONLY.
//
// Never import this from a `'use client'` module. It pulls in the whole CMS,
// the database driver and every secret in payload.config.ts.
// `npm run check:privacy` fails the build if a client component reaches for it.
//
// ── On `overrideAccess` ───────────────────────────────────────
// Payload's Local API runs with `overrideAccess: true` by default, which means
// collection and field access rules DO NOT apply to anything read through here.
// That is correct — this is the site reading its own database, not a request
// from outside — but it has a consequence worth stating plainly:
//
//   Access control does not protect the website from itself.
//
// The thing that keeps a customer's address out of a page is the `select` on
// the query, not the `access` on the collection. Access control protects the
// REST API; `select` protects the rendered page. Both are needed, and neither
// substitutes for the other. See docs/privacy-runbook.md.
// ============================================================

import config from '@payload-config'
import { getPayload } from 'payload'

/**
 * The shared Payload instance.
 *
 * `getPayload` memoises on globalThis, so this is a cheap call after the first
 * one and safe to use per-request without pooling anything ourselves.
 */
export function getCms() {
  return getPayload({ config })
}

export type Cms = Awaited<ReturnType<typeof getCms>>

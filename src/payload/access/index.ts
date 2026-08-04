// ============================================================
// Named access-control predicates.
//
// Every collection in this project sets `access` EXPLICITLY, using one of the
// names below, and never relies on a framework default. That is a deliberate
// rule, not ceremony: three collections (`orders`, `donations`,
// `applications`) hold real personal data, and "what happens if I forget to
// write an access rule" must never be a question anybody has to look up.
//
// `scripts/check-access.mjs` fails the build if a collection is missing any of
// the four operations, and asserts at runtime that the private collections
// answer 403 to an anonymous REST request.
// ============================================================

import type { Access, FieldAccess } from 'payload'

export type Role = 'admin' | 'editor'

/**
 * Read the role off whatever Payload put on the request.
 *
 * Narrowed locally rather than imported from payload-types so this module
 * compiles before the first `generate:types` run — a bootstrapping problem that
 * would otherwise make the config unbuildable from a clean checkout.
 */
export function roleOf(user: unknown): Role | undefined {
  return (user as { role?: Role } | null | undefined)?.role
}

/** Public. Use for anything the website itself renders. */
export const anyone: Access = () => true

/**
 * Nobody, ever — including logged-in staff, and including the REST/GraphQL API.
 *
 * The Local API used by our own server code passes `overrideAccess: true` by
 * default, so this does not stop the site from reading its own data. What it
 * stops is the collection being readable over HTTP by anyone at all.
 */
export const nobody: Access = () => false

/** Any signed-in CMS user. */
export const authenticated: Access = ({ req: { user } }) => Boolean(user)

/** Editors and admins — the people who run the site day to day. */
export const staff: Access = ({ req: { user } }) => {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}

/** Admins only. Reserved for user management and anything financial. */
export const adminOnly: Access = ({ req: { user } }) => roleOf(user) === 'admin'

/** Field-level variant of {@link adminOnly}, for fields inside a staff-readable doc. */
export const adminFieldOnly: FieldAccess = ({ req: { user } }) => roleOf(user) === 'admin'

/** Field-level variant of {@link staff}. */
export const staffFieldOnly: FieldAccess = ({ req: { user } }) => {
  const role = roleOf(user)
  return role === 'admin' || role === 'editor'
}

/** A user may always read and update their own record. */
export const adminOrSelf: Access = ({ req: { user } }) => {
  if (roleOf(user) === 'admin') return true
  const id = (user as { id?: string } | null | undefined)?.id
  return id ? { id: { equals: id } } : false
}

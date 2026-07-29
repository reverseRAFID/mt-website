// ============================================================
// View types.
//
// Components import their prop types from here rather than from
// '@/payload-types' directly, for one reason: Payload generates a type per
// COLLECTION, but a rover's `subsystems` or a competition's `teamMembers` are
// anonymous inline shapes inside it. Without names for those, every component
// that renders one would have to spell out
// `NonNullable<Rover['subsystems']>[number]` in its props.
//
// So this module names them, derived from the generated types rather than
// duplicated — a field added to a collection flows through automatically, and a
// field removed becomes a compile error in the component that used it.
//
// Nothing here is hand-written data. If a shape looks wrong, fix the collection
// and re-run `npm run generate:types`.
// ============================================================

import type {
  Announcement,
  Competition,
  Media,
  Member,
  Post,
  Product,
  ProductCategory,
  Research,
  Rover,
  SarVideo,
  Sponsor,
  Testimonial,
  Document as UploadedFile,
} from '@/payload-types'

export type {
  Announcement,
  Competition,
  Media,
  Member,
  Post,
  Product,
  ProductCategory,
  Research,
  Rover,
  SarVideo,
  Sponsor,
  Testimonial,
  UploadedFile,
}

/** Helper: the element type of an optional array field. */
type Row<T> = NonNullable<T> extends readonly (infer E)[] ? E : never

// ── Rover ─────────────────────────────────────────────────────

export type RoverSpecs = NonNullable<Rover['specs']>
export type KeySpec = Row<Rover['keySpecs']>
export type RoverInnovation = Row<Rover['keyInnovations']>
export type RoverMission = Row<Rover['missions']>
export type RoverSubsystem = Row<Rover['subsystems']>
export type RoverCrewMember = Row<Rover['crew']>
export type DiagramAnnotation = Row<Rover['diagramAnnotations']>

// ── Competition ───────────────────────────────────────────────

export type RosterEntry = Row<Competition['teamMembers']>

// ── Member ────────────────────────────────────────────────────

export type MemberAchievement = Row<Member['achievements']>
export type MemberWork = Row<Member['works']>

/**
 * What points at a member, resolved separately.
 *
 * Sanity got these from `references(^._id)` inside the member projection, so
 * they arrived as fields on the member. Payload has no reverse-reference index,
 * so they are separate queries (see `getMemberConnections`) and therefore a
 * separate shape — the member dossier takes both.
 */
export interface MemberConnections {
  competitions: Array<{ competition: Competition; myRole: string | null }>
  papers: Research[]
  rovers: Rover[]
}

// ── Shop ──────────────────────────────────────────────────────

/**
 * One sellable option.
 *
 * `id` is what Sanity called `_key`. It is the value an order records as its
 * `variantKey` and what the stock reservation matches on, so it is a real
 * identifier and not an incidental array index.
 */
export type ProductVariant = Row<Product['variants']>

// ── Config ────────────────────────────────────────────────────

export type FaqItem = { question: string; answer: string; id?: string | null }
export type CrowdfundingStep = { title: string; body: string; id?: string | null }
export type PaymentChannel = Row<
  NonNullable<import('@/payload-types').Crowdfunding['channels']>
>

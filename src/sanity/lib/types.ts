// ============================================================
// Shared TypeScript types for Sanity documents
// ============================================================

import type {
  DeliveryMethod,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShopStatus,
} from '@/lib/shop'

export interface SanitySlug {
  current: string
}

export interface SanityImage {
  _type: 'image'
  asset: { _ref: string; _type: 'reference' }
  hotspot?: { x: number; y: number }
  caption?: string
}

export interface SanityFile {
  _type: 'file'
  asset: { _ref: string; _type: 'reference' }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PortableTextBlock = any[]

// ── Announcement ─────────────────────────────────────────────
export interface Announcement {
  _id: string
  title: string
  message: string
  link?: string
  linkLabel?: string
}

// ── Rover ─────────────────────────────────────────────────────
export interface RoverSpecs {
  weight?: string
  dimensions?: string
  driveSystem?: string
  payload?: string
  dof?: number
  autonomy?: string
}

export interface DiagramAnnotation {
  label: string
  description?: string
  xPercent: number
  yPercent: number
}

export interface KeySpec {
  label: string
  value: string
}

export interface RoverInnovation {
  title: string
  description: string
}

export interface RoverMission {
  name: string
  summary: string
}

export interface RoverSubsystem {
  name: string
  subTeam?: string
  summary: string
  highlights?: string[]
  image?: SanityImage
}

export interface RoverCrewMember {
  contribution?: string
  subTeamOverride?: string
  member: {
    _id: string
    name: string
    slug: SanitySlug
    photo?: SanityImage
    role?: string
    subTeam?: string
    isAlumni?: boolean
  }
}

export interface RoverSibling {
  _id: string
  name: string
  slug: SanitySlug
  year: number
  tagline?: string
  heroImage?: SanityImage
}

export interface RoverCard {
  _id: string
  name: string
  slug: SanitySlug
  year: number
  tagline?: string
  isFlagship?: boolean
  specs?: Pick<RoverSpecs, 'weight' | 'driveSystem' | 'dof' | 'autonomy'>
  galleryCount?: number
  heroImage?: SanityImage
  competition?: { shortName: string; year: number }
}

export interface RoverFull extends RoverCard {
  overview?: string
  description?: PortableTextBlock
  teamLead?: string
  sarVideoUrl?: string
  specs?: RoverSpecs
  keySpecs?: KeySpec[]
  namedComponents?: string[]
  featuredImage?: SanityImage
  cadModel?: SanityFile
  diagrams?: SanityImage[]
  diagramAnnotations?: DiagramAnnotation[]
  technicalPdf?: SanityFile
  gallery?: SanityImage[]
  keyInnovations?: RoverInnovation[]
  missions?: RoverMission[]
  subsystems?: RoverSubsystem[]
  crew?: RoverCrewMember[]
  siblings?: RoverSibling[]
  competition?: {
    _id: string
    name: string
    shortName: string
    year: number
    slug: SanitySlug
    location?: string
    result?: string
    rank?: number
    totalTeams?: number
  }
}

// ── Competition ───────────────────────────────────────────────
export interface CompetitionCard {
  _id: string
  name: string
  shortName: string
  year: number
  slug: SanitySlug
  location?: string
  result?: string
  rank?: number
  totalTeams?: number
  memberCount?: number
  rover?: { name: string; slug: SanitySlug }
}

export interface RosterEntry {
  competitionRole?: string
  member: {
    _id: string
    name: string
    slug: SanitySlug
    photo?: SanityImage
    role?: string
    subTeam?: string
  }
}

export interface CompetitionFull extends CompetitionCard {
  sarVideo?: string
  gallery?: SanityImage[]
  reportPdf?: SanityFile
  rover?: { _id: string; name: string; slug: SanitySlug; year: number }
  teamMembers?: RosterEntry[]
}

// ── Member ────────────────────────────────────────────────────
export interface MemberCard {
  _id: string
  name: string
  slug: SanitySlug
  photo?: SanityImage
  role?: string
  subTeam?: string
  isAlumni?: boolean
  currentOrg?: string
  isActive?: boolean
}

export interface MemberAchievement {
  title: string
  year?: number
  /** One-line summary of what was achieved. */
  achievement?: string
  /** Optional bullet points elaborating on the achievement. */
  details?: string[]
}

export interface MemberWork {
  name: string
  url?: string
}

export interface MemberFull extends MemberCard {
  tagline?: string
  yearOfStudy?: string
  joinedYear?: number
  graduationYear?: number
  /** Every year the member was active — drives the contribution timeline. */
  yearsContributed?: number[]
  bio?: string
  quote?: string
  focusAreas?: string[]
  skills?: string[]
  achievements?: MemberAchievement[]
  works?: MemberWork[]
  linkedin?: string
  github?: string
  website?: string
  competitions?: Array<{
    _id: string
    name: string
    shortName: string
    year: number
    slug: SanitySlug
    result?: string
    rank?: number
    myRole?: string
  }>
  papers?: Array<{
    _id: string
    title: string
    slug: SanitySlug
    year: number
    status: string
    conference?: string
    topics?: string[]
  }>
  rovers?: Array<{
    _id: string
    name: string
    slug: SanitySlug
    year: number
  }>
}

// ── Research ──────────────────────────────────────────────────
export interface ResearchCard {
  _id: string
  title: string
  slug: SanitySlug
  year: number
  status: string
  conference?: string
  topics?: string[]
  doi?: string
  authorNames?: string[]
}

export interface ResearchFull extends ResearchCard {
  abstract?: string
  pdfFile?: SanityFile
  citation?: string
  authors?: Array<{
    _id: string
    name: string
    slug: SanitySlug
    photo?: SanityImage
    role?: string
  }>
}

// ── Post ──────────────────────────────────────────────────────
export interface PostCard {
  _id: string
  title: string
  slug: SanitySlug
  publishedAt?: string
  category?: string
  featuredImage?: SanityImage
  excerpt?: string
  author?: { name: string; slug: SanitySlug; photo?: SanityImage }
}

export interface PostFull extends PostCard {
  body?: PortableTextBlock
}

// ── Sponsor ───────────────────────────────────────────────────
export interface Sponsor {
  _id: string
  name: string
  logo?: SanityImage
  logoLight?: SanityImage
  logoDark?: SanityImage
  website?: string
  tier: 'title' | 'gold' | 'silver' | 'bronze' | 'in-kind'
}

// ── Testimonial ───────────────────────────────────────────────
export interface Testimonial {
  _id: string
  name: string
  role?: string
  organization?: string
  quote: string
  link?: string
  photo?: SanityImage
}

// ── SAR Video ─────────────────────────────────────────────────
export interface SarVideo {
  _id: string
  title: string
  year: number
  youtubeUrl: string
  thumbnail?: SanityImage
  description?: string
  competition?: {
    _id: string
    name: string
    shortName: string
    year: number
    slug: SanitySlug
  }
}

// ── Recruitment ───────────────────────────────────────────────
export interface FaqItem {
  question: string
  answer: string
}

export interface RecruitmentConfig {
  status: 'open' | 'under-review' | 'closed'
  openingMessage?: string
  closingDate?: string
  faqItems?: FaqItem[]
}

// ── Application (recruitment form submission) ─────────────────
export interface Application {
  _id: string
  _type: 'application'
  status: 'new' | 'shortlisted' | 'interview' | 'accepted' | 'rejected'
  name: string
  email: string
  phone?: string
  studentId: string
  department: string
  year: string
  subteam1: string
  subteam2?: string
  whyJoin: string
  experience?: string
  portfolio?: string
  reviewerNotes?: string
  submittedAt: string
}

// ── Crowdfunding ──────────────────────────────────────────────
// PRIVACY: `PublicDonation` is the ONLY donation shape allowed to reach a
// browser. It has no `amount`, no `senderAccount`, no contact details, and no
// `donorName` — an anonymous donor's real name is swapped for "Anonymous"
// inside the GROQ projection, so it never leaves Sanity. Adding a private
// field to this interface is the mistake to watch for; `npm run check:privacy`
// fails the build if one shows up in a public query.

export interface PaymentChannel {
  _key: string
  method: string
  accountNumber: string
  accountName?: string
  accountType?: string
  note?: string
  bankName?: string
  branch?: string
  routingNumber?: string
}

export interface CrowdfundingStep {
  title: string
  body: string
}

export interface CrowdfundingConfig {
  status: 'open' | 'paused' | 'closed'
  headline?: string
  pitch?: string
  closedMessage?: string
  deadline?: string
  verificationHours?: number
  showSupporterCount?: boolean
  channels?: PaymentChannel[]
  steps?: CrowdfundingStep[]
  faqItems?: FaqItem[]
}

/** A single approved supporter as published. No monetary figure, by design. */
export interface PublicDonation {
  _id: string
  /** Already anonymised in GROQ — safe to render directly. */
  displayName: string
  /** Null for anonymous donors. */
  affiliation?: string | null
  message?: string | null
  approvedAt?: string | null
}

/** A `PublicDonation` with its 1-based position, derived from array index. */
export interface Supporter extends PublicDonation {
  rank: number
}

// ════════════════════════════════════════════════════════════════════════
// SHOP
//
// PRIVACY — `PublicOrder` below is the ONLY order shape allowed to reach a
// browser, and it is deliberately missing the customer's email, full phone
// number and street address. If you find yourself widening it, that is the
// moment to stop and read docs/shop-runbook.md instead.
// ════════════════════════════════════════════════════════════════════════

export interface ProductCategory {
  _id: string
  title: string
  slug: SanitySlug
  description?: string
}

/** A single sellable option. `stock` is meaningful only when the product tracks inventory. */
export interface ProductVariant {
  _key: string
  label: string
  sku?: string
  stock: number
  priceOverride?: number
  isActive?: boolean
}

/** The card-sized projection used by the grid and the homepage teaser. */
export interface ProductSummary {
  _id: string
  title: string
  slug: SanitySlug
  tagline?: string
  basePrice: number
  compareAtPrice?: number
  featured?: boolean
  trackInventory?: boolean
  image?: SanityImage
  imageCount?: number
  category?: ProductCategory
  variants?: ProductVariant[]
}

export interface Product extends ProductSummary {
  description?: PortableTextBlock
  variantAxisLabel?: string
  maxPerOrder?: number
  sizeGuide?: string
  careInfo?: string
  images?: (SanityImage & { _key: string; alt?: string })[]
}

/** PRODUCTS_BY_IDS_QUERY — carries `_rev` for the reservation compare-and-set. */
export interface ProductForCart {
  _id: string
  _rev: string
  title: string
  slug: SanitySlug
  basePrice: number
  trackInventory?: boolean
  isActive?: boolean
  maxPerOrder?: number
  image?: SanityImage
  variants?: ProductVariant[]
}

export interface ShopConfig {
  status: ShopStatus
  closedMessage?: string
  announcement?: string
  standardDeliveryFee: number
  campusDeliveryEnabled?: boolean
  campusHandoverPoints?: string[]
  requireBracuEmailForCampus?: boolean
  estimatedDeliveryDays?: string
  minOrderValue: number
  maxQtyPerItem: number
  maxItemsPerOrder: number
  orderPrefix: string
  supportEmail?: string
  supportPhone?: string
  shippingPolicy?: string
  returnPolicy?: string
}

/** SERVER ONLY — adds the team inboxes. Never hand this to a component. */
export interface ShopConfigInternal extends ShopConfig {
  adminNotifyEmails?: string[]
}

export interface OrderItem {
  productTitle: string
  variantLabel: string
  sku?: string
  quantity: number
  unitPrice: number
  lineTotal: number
  productId: string
  variantKey: string
  productSlug?: string
  imageUrl?: string
  /** Whether this line actually decremented inventory when the order was placed. */
  stockTaken?: boolean
}

export interface OrderStatusEvent {
  status: OrderStatus
  at: string
  note?: string
}

/** SERVER ONLY — the raw order, PII included. */
export interface OrderInternal {
  _id: string
  trackId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod?: PaymentMethod
  placedAt: string
  customerName: string
  customerEmail: string
  customerPhone: string
  deliveryMethod: DeliveryMethod
  deliveryAddress?: {
    line1?: string
    line2?: string
    area?: string
    city?: string
    postcode?: string
  }
  campusDetails?: { handoverPoint?: string; bracuId?: string }
  customerNote?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  statusHistory?: OrderStatusEvent[]
  notifiedStatuses?: string[]
  emailStatus?: 'sent' | 'failed' | 'skipped'
  /** Admin-set flag asking the webhook to re-send the confirmation. */
  resendEmail?: boolean
  stockReserved?: boolean
  stockRestoredAt?: string | null
  cancellationReason?: string
}

/**
 * The masked order the track page renders.
 *
 * `customerName` survives because the buyer needs to recognise their own
 * order; everything that could be used to find or contact them at home does
 * not. There is no email, no street address, no postcode, and the phone is
 * reduced to its last three digits.
 */
export interface PublicOrder {
  trackId: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  placedAt: string
  customerName: string
  /** Already masked, e.g. "••••••789". Safe to render directly. */
  maskedPhone: string
  deliveryMethod: DeliveryMethod
  /** Already coarsened to area + city, e.g. "Mirpur, Dhaka". */
  maskedAddress: string
  campusHandoverPoint?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  total: number
  statusHistory: OrderStatusEvent[]
  cancellationReason?: string
  estimatedDeliveryDays?: string
}

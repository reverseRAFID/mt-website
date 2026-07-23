// ============================================================
// Shared TypeScript types for Sanity documents
// ============================================================

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

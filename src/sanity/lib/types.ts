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

export interface RoverCard {
  _id: string
  name: string
  slug: SanitySlug
  year: number
  tagline?: string
  specs?: Pick<RoverSpecs, 'weight' | 'driveSystem' | 'dof'>
  galleryCount?: number
  heroImage?: SanityImage
  competition?: { shortName: string; year: number }
}

export interface RoverFull extends RoverCard {
  description?: PortableTextBlock
  specs?: RoverSpecs
  cadModel?: SanityFile
  diagrams?: SanityImage[]
  diagramAnnotations?: DiagramAnnotation[]
  technicalPdf?: SanityFile
  gallery?: SanityImage[]
  competition?: {
    _id: string
    name: string
    shortName: string
    year: number
    slug: SanitySlug
    result?: string
    rank?: number
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

export interface MemberFull extends MemberCard {
  yearOfStudy?: string
  graduationYear?: number
  skills?: string[]
  personalProjects?: PortableTextBlock
  linkedin?: string
  github?: string
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

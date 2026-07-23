import { groq } from 'next-sanity'

// ── Announcements ─────────────────────────────────────────────
export const ACTIVE_ANNOUNCEMENTS_QUERY = groq`
  *[_type == "announcement" && isActive == true
    && (!defined(startDate) || dateTime(startDate) <= dateTime(now()))
    && (!defined(endDate)   || dateTime(endDate)   >= dateTime(now()))
  ] | order(priority asc) {
    _id, title, message, link, linkLabel
  }
`

// ── Rovers ────────────────────────────────────────────────────
export const ROVERS_QUERY = groq`
  *[_type == "rover"] | order(year desc) {
    _id, name, slug, year, tagline, isFlagship,
    specs { weight, driveSystem, dof, autonomy },
    "heroImage": coalesce(featuredImage, gallery[0]),
    "galleryCount": count(gallery),
    competition-> { shortName, year }
  }
`

export const ROVER_BY_SLUG_QUERY = groq`
  *[_type == "rover" && slug.current == $slug][0] {
    _id, name, slug, year, tagline, overview, description, isFlagship, teamLead, sarVideoUrl,
    specs, keySpecs, namedComponents,
    featuredImage, gallery, diagrams, diagramAnnotations, cadModel, technicalPdf,
    keyInnovations, missions,
    subsystems[]{ name, subTeam, summary, highlights, image },
    crew[]{
      contribution, subTeamOverride,
      member-> { _id, name, slug, photo, role, subTeam, isAlumni }
    },
    competition-> { _id, name, shortName, year, slug, location, result, rank, totalTeams },
    "siblings": *[_type == "rover" && _id != ^._id] | order(year desc) {
      _id, name, slug, year, tagline, "heroImage": coalesce(featuredImage, gallery[0])
    }
  }
`

export const FEATURED_ROVER_QUERY = groq`
  *[_type == "rover"] | order(isFlagship desc, year desc)[0] {
    _id, name, slug, year, tagline,
    specs { weight, driveSystem, dof, autonomy },
    "heroImage": coalesce(featuredImage, gallery[0]),
    competition-> { shortName, year }
  }
`

// ── Competitions ──────────────────────────────────────────────
export const COMPETITIONS_QUERY = groq`
  *[_type == "competition"] | order(year desc) {
    _id, name, shortName, year, slug, location, result, rank, totalTeams,
    "memberCount": count(teamMembers),
    rover-> { name, slug }
  }
`

export const COMPETITION_BY_SLUG_QUERY = groq`
  *[_type == "competition" && slug.current == $slug][0] {
    _id, name, shortName, year, slug, location, result, rank, totalTeams,
    sarVideo, gallery, reportPdf,
    rover-> { _id, name, slug, year },
    teamMembers[] {
      competitionRole,
      member-> { _id, name, slug, photo, role, subTeam }
    }
  }
`

export const LATEST_COMPETITION_QUERY = groq`
  *[_type == "competition" && defined(rank)] | order(year desc)[0] {
    _id, name, shortName, year, slug, location, result, rank, totalTeams
  }
`

// ── Members ───────────────────────────────────────────────────
export const MEMBERS_QUERY = groq`
  *[_type == "member"] | order(isAlumni asc, name asc) {
    _id, name, slug, photo, role, subTeam, isAlumni, currentOrg, isActive
  }
`

export const MEMBER_BY_SLUG_QUERY = groq`
  *[_type == "member" && slug.current == $slug][0] {
    _id, name, slug, photo, role, tagline, subTeam, yearOfStudy, joinedYear, graduationYear,
    yearsContributed, isAlumni, currentOrg, bio, quote, focusAreas, skills,
    achievements[]{ title, year, achievement, details },
    works[]{ name, url },
    linkedin, github, website,
    "competitions": *[_type == "competition" && references(^._id)] | order(year desc) {
      _id, name, shortName, year, slug, result, rank,
      "myRole": teamMembers[member._ref == ^.^._id][0].competitionRole
    },
    "papers": *[_type == "research" && references(^._id)] | order(year desc) {
      _id, title, slug, year, status, conference, topics
    },
    "rovers": *[_type == "competition" && references(^._id)].rover-> {
      _id, name, slug, year
    }
  }
`

// ── Research ──────────────────────────────────────────────────
export const RESEARCH_QUERY = groq`
  *[_type == "research"] | order(year desc) {
    _id, title, slug, year, status, conference, topics, doi,
    "authorNames": authors[]->name
  }
`

export const RESEARCH_BY_SLUG_QUERY = groq`
  *[_type == "research" && slug.current == $slug][0] {
    _id, title, slug, year, abstract, doi, pdfFile, topics, status, conference, citation,
    authors[]-> { _id, name, slug, photo, role }
  }
`

// ── Posts / News ──────────────────────────────────────────────
export const POSTS_QUERY = groq`
  *[_type == "post"] | order(publishedAt desc) {
    _id, title, slug, publishedAt, category, featuredImage, excerpt,
    author-> { name, slug, photo }
  }
`

export const POST_BY_SLUG_QUERY = groq`
  *[_type == "post" && slug.current == $slug][0] {
    _id, title, slug, publishedAt, category, featuredImage, excerpt, body,
    author-> { _id, name, slug, photo, role }
  }
`

export const LATEST_POSTS_QUERY = groq`
  *[_type == "post"] | order(publishedAt desc)[0...3] {
    _id, title, slug, publishedAt, category, excerpt,
    author-> { name, slug }
  }
`

// ── Sponsors ──────────────────────────────────────────────────
export const ACTIVE_SPONSORS_QUERY = groq`
  *[_type == "sponsor" && isActive == true] | order(tier asc, name asc) {
    _id, name, logo, logoLight, logoDark, website, tier
  }
`

// ── Testimonials ──────────────────────────────────────────────
export const FEATURED_TESTIMONIALS_QUERY = groq`
  *[_type == "testimonial" && featured == true] | order(order asc, name asc) {
    _id, name, role, organization, quote, link, photo
  }
`

// ── SAR Videos ────────────────────────────────────────────────
export const SAR_VIDEOS_QUERY = groq`
  *[_type == "sarVideo"] | order(year desc) {
    _id, title, year, youtubeUrl, thumbnail, description,
    competition-> { _id, name, shortName, year, slug }
  }
`

export const LATEST_SAR_VIDEO_QUERY = groq`
  *[_type == "sarVideo"] | order(year desc)[0] {
    _id, title, year, youtubeUrl, thumbnail, description,
    competition-> { shortName, year }
  }
`

// ── Recruitment ───────────────────────────────────────────────
export const RECRUITMENT_CONFIG_QUERY = groq`
  *[_type == "recruitmentConfig" && _id == "recruitment-config"][0] {
    status, openingMessage, closingDate, faqItems
  }
`

// ── Gallery (aggregated from rovers) ─────────────────────────
export const GALLERY_QUERY = groq`
  *[_type == "rover" && defined(gallery) && count(gallery) > 0] | order(year desc) {
    _id, name, slug, year, gallery[]
  }
`

// ── Crowdfunding ──────────────────────────────────────────────
// ════════════════════════════════════════════════════════════════════════
// PRIVACY-CRITICAL. Everything these queries project is public.
//
// Two things are load-bearing:
//
//  1. `order(amount desc, ...)` sorts INSIDE Sanity, and the projection then
//     omits `amount`. The site receives rows already in rank order and derives
//     the rank from array position (see src/lib/donations.ts), so the figure
//     itself is never serialised into HTML or a JSON payload.
//
//  2. `select(isAnonymous == true => ...)` resolves anonymity here, not in
//     React. An anonymous donor's real `donorName` is never projected at all,
//     so it cannot be recovered by reading the page source.
//
// Never add `amount`, `senderAccount`, `transactionId`, `contactEmail`,
// `contactPhone`, `adminNotes`, `rejectionReason`, `verifiedBy` or a bare
// `donorName` to these projections. `npm run check:privacy` enforces this.
// ════════════════════════════════════════════════════════════════════════

export const CROWDFUNDING_CONFIG_QUERY = groq`
  *[_type == "crowdfundingConfig" && _id == "crowdfunding-config"][0] {
    status, headline, pitch, closedMessage, deadline, verificationHours, showSupporterCount,
    channels[] {
      _key, method, accountNumber, accountName, accountType, note,
      bankName, branch, routingNumber
    },
    steps[] { title, body },
    faqItems[] { question, answer }
  }
`

/** Just the gate — used by /api/donate, which has no use for page content. */
export const CROWDFUNDING_STATUS_QUERY = groq`
  *[_type == "crowdfundingConfig" && _id == "crowdfunding-config"][0].status
`

/** Approved supporters in rank order. Ties break on the earlier verification. */
export const APPROVED_DONATIONS_QUERY = groq`
  *[_type == "donation" && status == "approved"]
    | order(amount desc, approvedAt asc, _createdAt asc) {
      _id,
      "displayName": select(isAnonymous == true => "Anonymous", donorName),
      "affiliation": select(isAnonymous == true => null, affiliation),
      message,
      approvedAt
    }
`

/** Same ordering, capped — for the homepage top-5 strip. */
export const TOP_DONATIONS_QUERY = groq`
  *[_type == "donation" && status == "approved"]
    | order(amount desc, approvedAt asc, _createdAt asc)[0...$limit] {
      _id,
      "displayName": select(isAnonymous == true => "Anonymous", donorName),
      "affiliation": select(isAnonymous == true => null, affiliation),
      message,
      approvedAt
    }
`

export const APPROVED_DONATION_COUNT_QUERY = groq`
  count(*[_type == "donation" && status == "approved"])
`

/**
 * Duplicate guard for /api/donate. Returns only a boolean-ish count so a
 * probe cannot be used to enumerate transaction IDs.
 */
export const DONATION_TRX_EXISTS_QUERY = groq`
  count(*[_type == "donation" && transactionId == $transactionId]) > 0
`

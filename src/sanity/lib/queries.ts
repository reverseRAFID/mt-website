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
    _id, name, slug, year, tagline,
    specs { weight, driveSystem, dof, autonomy },
    "galleryCount": count(gallery),
    competition-> { shortName, year }
  }
`

export const ROVER_BY_SLUG_QUERY = groq`
  *[_type == "rover" && slug.current == $slug][0] {
    _id, name, slug, year, tagline, description,
    specs, cadModel, diagrams, diagramAnnotations, technicalPdf, gallery,
    competition-> { _id, name, shortName, year, slug, result, rank }
  }
`

export const FEATURED_ROVER_QUERY = groq`
  *[_type == "rover"] | order(year desc)[0] {
    _id, name, slug, year, tagline,
    specs { weight, driveSystem, dof, autonomy },
    "heroImage": gallery[0],
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
    isAlumni, currentOrg, bio, quote, focusAreas, skills, achievements, personalProjects,
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

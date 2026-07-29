// ============================================================
// Public content reads — SERVER ONLY.
//
// This file replaces src/sanity/lib/queries.ts. Every GROQ query has a function
// here, named for what it fetches rather than for the query it runs.
//
// ── Caching ───────────────────────────────────────────────────
// Everything here is wrapped in `cachedRead`, so it is served from Next's data
// cache until the underlying collection is saved. See src/lib/cms/cache.ts.
//
// ── Depth ─────────────────────────────────────────────────────
// `depth` decides how far Payload follows relationships. It is set explicitly
// on every call rather than left to the default, because the default is 2 and
// the difference between 1 and 2 on a listing query is the difference between
// fetching a rover card and fetching every crew member's full profile.
//
//   depth 0 — ids only
//   depth 1 — the related document (an uploaded image, a linked competition)
//   depth 2 — and its relationships in turn (a crew member's photo)
// ============================================================

import type { Competition, Member, Post, Rover, SarVideo, Sponsor, Testimonial } from '@/payload-types'

import { cachedRead } from './cache'
import { getCms } from './client'

// ── Announcements ─────────────────────────────────────────────

/**
 * Announcements that are switched on and inside their date window.
 *
 * The window is evaluated in MongoDB rather than in JavaScript so an expired
 * banner cannot be served from cache after its end date — the query itself
 * stops matching it. `exists: false` covers the open-ended cases: no start date
 * means "already running", no end date means "until switched off".
 *
 * NOT cached, deliberately. The result depends on the current time, and a
 * cached "no announcements" would outlive the moment one was due to appear.
 */
export async function getActiveAnnouncements() {
  const cms = await getCms()
  const now = new Date().toISOString()

  const { docs } = await cms.find({
    collection: 'announcements',
    depth: 0,
    limit: 5,
    sort: 'priority',
    where: {
      and: [
        { isActive: { equals: true } },
        { or: [{ startDate: { exists: false } }, { startDate: { less_than_equal: now } }] },
        { or: [{ endDate: { exists: false } }, { endDate: { greater_than_equal: now } }] },
      ],
    },
  })

  return docs
}

// ── Rovers ────────────────────────────────────────────────────

export const getRovers = cachedRead(
  'rovers:list',
  ['rovers', 'competitions', 'media'],
  async (): Promise<Rover[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'rovers',
      depth: 1,
      limit: 100,
      sort: '-year',
    })
    return docs
  }
)

export const getRoverBySlug = cachedRead(
  'rovers:bySlug',
  ['rovers', 'competitions', 'members', 'media', 'documents'],
  async (slug: string): Promise<Rover | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'rovers',
      // 2 so a crew member's own photo comes back with them — the crew rail
      // renders faces, and depth 1 would give it ids.
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ?? null
  }
)

/** Every other rover, for the "rest of the fleet" strip on a detail page. */
export const getSiblingRovers = cachedRead(
  'rovers:siblings',
  ['rovers', 'media'],
  async (excludeId: string): Promise<Rover[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'rovers',
      depth: 1,
      limit: 20,
      sort: '-year',
      where: { id: { not_equals: excludeId } },
    })
    return docs
  }
)

/** The flagship if one is marked, otherwise the newest. */
export const getFeaturedRover = cachedRead(
  'rovers:featured',
  ['rovers', 'competitions', 'media'],
  async (): Promise<Rover | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'rovers',
      depth: 1,
      limit: 1,
      sort: ['-isFlagship', '-year'],
    })
    return docs[0] ?? null
  }
)

export const getRoverSlugs = cachedRead('rovers:slugs', ['rovers'], async (): Promise<string[]> => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'rovers',
    depth: 0,
    limit: 200,
    select: { slug: true },
  })
  return docs.map((d) => d.slug).filter(Boolean)
})

// ── Competitions ──────────────────────────────────────────────

export const getCompetitions = cachedRead(
  'competitions:list',
  ['competitions', 'rovers'],
  async (): Promise<Competition[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'competitions',
      depth: 1,
      limit: 100,
      sort: '-year',
    })
    return docs
  }
)

export const getCompetitionBySlug = cachedRead(
  'competitions:bySlug',
  ['competitions', 'rovers', 'members', 'media', 'documents'],
  async (slug: string): Promise<Competition | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'competitions',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ?? null
  }
)

export const getCompetitionSlugs = cachedRead(
  'competitions:slugs',
  ['competitions'],
  async (): Promise<string[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'competitions',
      depth: 0,
      limit: 200,
      select: { slug: true },
    })
    return docs.map((d) => d.slug).filter(Boolean)
  }
)

/** The most recent competition that actually has a result. */
export const getLatestCompetition = cachedRead(
  'competitions:latest',
  ['competitions'],
  async (): Promise<Competition | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'competitions',
      depth: 0,
      limit: 1,
      sort: '-year',
      where: { rank: { exists: true } },
    })
    return docs[0] ?? null
  }
)

// ── Members ───────────────────────────────────────────────────

export const getMembers = cachedRead(
  'members:list',
  ['members', 'media'],
  async (): Promise<Member[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'members',
      depth: 1,
      limit: 300,
      sort: ['isAlumni', 'name'],
    })
    return docs
  }
)

export const getMemberSlugs = cachedRead('members:slugs', ['members'], async (): Promise<string[]> => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'members',
    depth: 0,
    limit: 500,
    select: { slug: true },
  })
  return docs.map((d) => d.slug).filter(Boolean)
})

export const getMemberBySlug = cachedRead(
  'members:bySlug',
  ['members', 'media'],
  async (slug: string): Promise<Member | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'members',
      depth: 1,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ?? null
  }
)

/**
 * Everything that points AT a member — the reverse lookups the dossier needs.
 *
 * Sanity did these with `references(^._id)`, which walks an index of every
 * reference in the dataset. Payload has no equivalent, so each one is an
 * explicit query against the field that holds the relationship. Three queries
 * instead of one projection, run in parallel.
 *
 * One deliberate difference: Sanity derived "rovers I worked on" from the
 * competitions the member attended. That misses anyone who built a rover
 * without travelling, and it credits anyone who travelled with a rover they
 * never touched. This unions that with the rover's own crew list, which is the
 * relationship that actually means "worked on it".
 */
export const getMemberConnections = cachedRead(
  'members:connections',
  ['members', 'competitions', 'research', 'rovers'],
  async (memberId: string) => {
    const cms = await getCms()

    const [competitions, papers, crewedRovers] = await Promise.all([
      cms.find({
        collection: 'competitions',
        depth: 0,
        limit: 50,
        sort: '-year',
        where: { 'teamMembers.member': { equals: memberId } },
      }),
      cms.find({
        collection: 'research',
        depth: 0,
        limit: 50,
        sort: '-year',
        where: { authors: { equals: memberId } },
      }),
      cms.find({
        collection: 'rovers',
        depth: 0,
        limit: 50,
        sort: '-year',
        where: { 'crew.member': { equals: memberId } },
      }),
    ])

    // Rovers reached via a competition roster, for members whose crew lists
    // predate the rover being filled in.
    const viaCompetition = competitions.docs
      .map((c) => c.rover)
      .filter((r): r is string => typeof r === 'string')

    const roverIds = [...new Set([...crewedRovers.docs.map((r) => r.id), ...viaCompetition])]

    const rovers = roverIds.length
      ? (
          await cms.find({
            collection: 'rovers',
            depth: 0,
            limit: 50,
            sort: '-year',
            where: { id: { in: roverIds } },
          })
        ).docs
      : []

    // The role a member held at each competition, which lives on the roster row
    // rather than on the member.
    const competitionsWithRole = competitions.docs.map((competition) => ({
      competition,
      myRole:
        competition.teamMembers?.find((row) =>
          typeof row.member === 'string' ? row.member === memberId : row.member?.id === memberId
        )?.competitionRole ?? null,
    }))

    return { competitions: competitionsWithRole, papers: papers.docs, rovers }
  }
)

// ── Research ──────────────────────────────────────────────────

export const getResearch = cachedRead('research:list', ['research', 'members'], async () => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'research',
    depth: 1,
    limit: 200,
    sort: '-year',
  })
  return docs
})

export const getResearchBySlug = cachedRead(
  'research:bySlug',
  ['research', 'members', 'media', 'documents'],
  async (slug: string) => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'research',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ?? null
  }
)

export const getResearchSlugs = cachedRead('research:slugs', ['research'], async (): Promise<string[]> => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'research',
    depth: 0,
    limit: 300,
    select: { slug: true },
  })
  return docs.map((d) => d.slug).filter(Boolean)
})

// ── Posts ─────────────────────────────────────────────────────

export const getPosts = cachedRead(
  'posts:list',
  ['posts', 'members', 'media'],
  async (): Promise<Post[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'posts',
      depth: 1,
      limit: 200,
      sort: '-publishedAt',
    })
    return docs
  }
)

export const getPostBySlug = cachedRead(
  'posts:bySlug',
  ['posts', 'members', 'media'],
  async (slug: string): Promise<Post | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'posts',
      depth: 2,
      limit: 1,
      where: { slug: { equals: slug } },
    })
    return docs[0] ?? null
  }
)

export const getPostSlugs = cachedRead('posts:slugs', ['posts'], async (): Promise<string[]> => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'posts',
    depth: 0,
    limit: 300,
    select: { slug: true },
  })
  return docs.map((d) => d.slug).filter(Boolean)
})

export const getLatestPosts = cachedRead(
  'posts:latest',
  ['posts', 'members', 'media'],
  async (limit: number = 3): Promise<Post[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'posts',
      depth: 1,
      limit,
      sort: '-publishedAt',
    })
    return docs
  }
)

// ── Sponsors ──────────────────────────────────────────────────

/**
 * Active sponsors, in tier order.
 *
 * Sorted in application code rather than by MongoDB: `tier` is a string, and a
 * lexical sort puts bronze above gold. The tier order is editorial, so it comes
 * from an explicit list.
 */
const TIER_ORDER: Record<string, number> = {
  title: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
  'in-kind': 4,
}

export const getActiveSponsors = cachedRead(
  'sponsors:active',
  ['sponsors', 'media'],
  async (): Promise<Sponsor[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'sponsors',
      depth: 1,
      limit: 200,
      where: { isActive: { equals: true } },
    })
    return docs.sort(
      (a, b) =>
        (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99) || a.name.localeCompare(b.name)
    )
  }
)

// ── Testimonials ──────────────────────────────────────────────

export const getFeaturedTestimonials = cachedRead(
  'testimonials:featured',
  ['testimonials', 'media'],
  async (): Promise<Testimonial[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'testimonials',
      depth: 1,
      limit: 20,
      sort: ['order', 'name'],
      where: { featured: { equals: true } },
    })
    return docs
  }
)

// ── SAR videos ────────────────────────────────────────────────

export const getSarVideos = cachedRead(
  'sar-videos:list',
  ['sar-videos', 'competitions', 'media'],
  async (): Promise<SarVideo[]> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'sar-videos',
      depth: 1,
      limit: 100,
      sort: '-year',
    })
    return docs
  }
)

export const getLatestSarVideo = cachedRead(
  'sar-videos:latest',
  ['sar-videos', 'competitions', 'media'],
  async (): Promise<SarVideo | null> => {
    const cms = await getCms()
    const { docs } = await cms.find({
      collection: 'sar-videos',
      depth: 1,
      limit: 1,
      sort: '-year',
    })
    return docs[0] ?? null
  }
)

// ── Gallery ───────────────────────────────────────────────────

/**
 * Every rover photo, grouped by rover.
 *
 * /gallery has no store of its own — it is a view over the rover galleries, so
 * adding a photo to a rover puts it on the gallery page automatically and there
 * is no second place to remember to update.
 */
export const getGallery = cachedRead('gallery', ['rovers', 'media'], async () => {
  const cms = await getCms()
  const { docs } = await cms.find({
    collection: 'rovers',
    depth: 1,
    limit: 100,
    sort: '-year',
  })

  return docs
    .filter((rover) => (rover.gallery?.length ?? 0) > 0)
    .map((rover) => ({
      id: rover.id,
      name: rover.name,
      slug: rover.slug,
      year: rover.year,
      gallery: rover.gallery ?? [],
    }))
})

// ── Globals ───────────────────────────────────────────────────

export const getRecruitmentConfig = cachedRead('global:recruitment', ['recruitment'], async () => {
  const cms = await getCms()
  return cms.findGlobal({ slug: 'recruitment', depth: 0 })
})

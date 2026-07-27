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

// ════════════════════════════════════════════════════════════════════════
// SHOP — PUBLIC PROJECTIONS
//
// Everything below this banner and above the SERVER-ONLY banner may reach a
// browser. Products carry no personal data, so they project freely.
//
// ORDERS DO NOT BELONG IN THIS SECTION. An order holds a real name, an email
// address, a mobile number and a home address. Any order projection lives
// below, is suffixed `_INTERNAL_QUERY`, and must be masked by
// `getOrderByTrackId()` before its result is rendered.
//
// `npm run check:privacy` enforces the split.
// ════════════════════════════════════════════════════════════════════════

/** Everything a shop page needs. Deliberately omits `adminNotifyEmails`. */
export const SHOP_CONFIG_QUERY = groq`
  *[_type == "shopConfig" && _id == "shop-config"][0] {
    status, closedMessage, announcement,
    standardDeliveryFee, campusDeliveryEnabled, campusHandoverPoints,
    requireBracuEmailForCampus, estimatedDeliveryDays,
    minOrderValue, maxQtyPerItem, maxItemsPerOrder, orderPrefix,
    supportEmail, supportPhone,
    shippingPolicy, returnPolicy
  }
`

/** Just the gate — used where page content is irrelevant. */
export const SHOP_STATUS_QUERY = groq`
  *[_type == "shopConfig" && _id == "shop-config"][0].status
`

export const PRODUCT_CATEGORIES_QUERY = groq`
  *[_type == "productCategory"] | order(order asc, title asc) {
    _id, title, slug, description
  }
`

/**
 * The shop grid. Featured products lead, then manual order, then title.
 *
 * `variants` is projected without `sku` — an internal code is noise on a
 * product card and there is no reason to ship it to every visitor.
 */
export const PRODUCTS_QUERY = groq`
  *[_type == "product" && isActive == true] | order(featured desc, order asc, title asc) {
    _id, title, slug, tagline, basePrice, compareAtPrice, featured, trackInventory,
    "image": images[0],
    "imageCount": count(images),
    category-> { _id, title, slug },
    variants[] { _key, label, stock, priceOverride, isActive }
  }
`

export const FEATURED_PRODUCTS_QUERY = groq`
  *[_type == "product" && isActive == true && featured == true]
    | order(order asc, title asc)[0...$limit] {
      _id, title, slug, tagline, basePrice, compareAtPrice, trackInventory,
      "image": images[0],
      category-> { _id, title, slug },
      variants[] { _key, label, stock, priceOverride, isActive }
    }
`

export const PRODUCT_BY_SLUG_QUERY = groq`
  *[_type == "product" && slug.current == $slug && isActive == true][0] {
    _id, title, slug, tagline, description, basePrice, compareAtPrice,
    variantAxisLabel, trackInventory, maxPerOrder, sizeGuide, careInfo, featured,
    images[] { _key, asset, hotspot, alt },
    category-> { _id, title, slug },
    variants[] { _key, label, sku, stock, priceOverride, isActive }
  }
`

/** Slugs for generateStaticParams(). */
export const PRODUCT_SLUGS_QUERY = groq`
  *[_type == "product" && isActive == true && defined(slug.current)].slug.current
`

/** Same category, excluding the product being viewed. */
export const RELATED_PRODUCTS_QUERY = groq`
  *[_type == "product" && isActive == true && _id != $id && category._ref == $categoryId]
    | order(featured desc, order asc)[0...$limit] {
      _id, title, slug, tagline, basePrice, compareAtPrice, trackInventory,
      "image": images[0],
      category-> { _id, title, slug },
      variants[] { _key, label, stock, priceOverride, isActive }
    }
`

/**
 * Resolve cart lines to live products.
 *
 * `_rev` comes back because the same shape feeds the stock reservation
 * transaction, which uses it as a compare-and-set token. `isActive` is NOT
 * filtered here: a withdrawn product must come back so the cart can say
 * "this is no longer available" instead of silently dropping the line.
 */
export const PRODUCTS_BY_IDS_QUERY = groq`
  *[_type == "product" && _id in $ids] {
    _id, _rev, title, slug, basePrice, trackInventory, isActive, maxPerOrder,
    "image": images[0],
    variants[] { _key, label, sku, stock, priceOverride, isActive }
  }
`

// ════════════════════════════════════════════════════════════════════════
// SHOP — SERVER-ONLY PROJECTIONS
//
// These select customer PII. They may be used ONLY from route handlers and
// server modules, and their results must be masked before rendering. Every
// name here ends in `_INTERNAL_QUERY` so the privacy checker can tell them
// apart from the public projections above.
// ════════════════════════════════════════════════════════════════════════

/**
 * Config including the team notification addresses.
 *
 * Split from SHOP_CONFIG_QUERY so a page cannot accidentally publish the
 * team's inboxes by reaching for the config it already had.
 */
export const SHOP_CONFIG_INTERNAL_QUERY = groq`
  *[_type == "shopConfig" && _id == "shop-config"][0] {
    status, closedMessage, announcement,
    standardDeliveryFee, campusDeliveryEnabled, campusHandoverPoints,
    requireBracuEmailForCampus, estimatedDeliveryDays,
    minOrderValue, maxQtyPerItem, maxItemsPerOrder, orderPrefix,
    supportEmail, supportPhone, adminNotifyEmails,
    shippingPolicy, returnPolicy
  }
`

/** The whole order. Mask via `getOrderByTrackId()` before it reaches a view. */
export const ORDER_BY_TRACK_ID_INTERNAL_QUERY = groq`
  *[_type == "order" && trackId == $trackId][0] {
    _id, trackId, status, paymentStatus, paymentMethod, placedAt,
    customerName, customerEmail, customerPhone,
    deliveryMethod, deliveryAddress, campusDetails, customerNote,
    items[] {
      productTitle, variantLabel, sku, quantity, unitPrice, lineTotal,
      productId, variantKey, productSlug, imageUrl
    },
    subtotal, deliveryFee, total,
    statusHistory[] { status, at, note },
    notifiedStatuses, emailStatus, resendEmail, stockReserved, stockRestoredAt,
    cancellationReason
  }
`

/** Uniqueness probe for a freshly generated track ID. */
export const TRACK_ID_EXISTS_QUERY = groq`
  count(*[_type == "order" && trackId == $trackId]) > 0
`

/**
 * Double-submit guard. Returns the existing order's track ID so a retried
 * request can be answered with the original order instead of a duplicate.
 */
export const ORDER_BY_IDEMPOTENCY_KEY_INTERNAL_QUERY = groq`
  *[_type == "order" && idempotencyKey == $key][0] { _id, trackId }
`

/** Everything the cancellation restore needs, and nothing more. */
export const ORDER_STOCK_STATE_INTERNAL_QUERY = groq`
  *[_type == "order" && _id == $id][0] {
    _id, _rev, status, stockReserved, stockRestoredAt,
    items[] { productId, variantKey, quantity, stockTaken }
  }
`

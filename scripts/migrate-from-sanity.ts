/**
 * Sanity → Payload content migration.
 *
 *   npm run migrate:sanity      # migrate everything
 *   npm run migrate:sanity:dry  # report what would happen, write nothing
 *
 * ── IDEMPOTENT ────────────────────────────────────────────────
 * Every migrated document carries `legacySanityId`. The script matches on it,
 * so a second run updates what it imported the first time rather than creating
 * a duplicate set. That matters more than it sounds: this reads a live dataset
 * over the network, and the first attempt WILL fail somewhere — a rate limit, a
 * missing asset, one malformed document — and it must be safe to fix and re-run.
 *
 * ── ORDER ─────────────────────────────────────────────────────
 * Assets first, then documents in dependency order, then a second pass for the
 * one genuine cycle: a rover points at a competition and a competition points
 * back at the rover, so competitions are written without their rover and
 * back-filled once the rovers exist.
 *
 * ── WHAT IT DOES NOT DO ───────────────────────────────────────
 * It does not touch Sanity. Nothing here writes, deletes or patches anything in
 * the old dataset — it stays exactly as it was, which is the whole safety net
 * if any of this turns out to be wrong.
 */

import { createClient } from '@sanity/client'
import { getPayload } from 'payload'

import config from '../payload.config'

import { portableTextToLexical } from './lib/portable-text-to-lexical.mjs'

// `payload run` does not forward extra argv to the script, so the dry-run
// switch is an env var rather than a flag.
const DRY = process.env.MIGRATE_DRY === '1'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const token = process.env.SANITY_API_READ_TOKEN ?? process.env.SANITY_API_TOKEN

if (!projectId) throw new Error('NEXT_PUBLIC_SANITY_PROJECT_ID is not set')

const sanity = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token,
  perspective: 'published',
})

// ── Logging ───────────────────────────────────────────────────

const counts: Record<string, { created: number; updated: number; skipped: number }> = {}

function tally(kind: string, what: 'created' | 'updated' | 'skipped') {
  counts[kind] ??= { created: 0, updated: 0, skipped: 0 }
  counts[kind][what] += 1
}

function log(...args: unknown[]) {
  console.log(...args)
}

/**
 * Documents the destination refused.
 *
 * Collected and reprinted at the end rather than only logged in place. A
 * rejection buried two hundred lines up in a successful-looking run is a
 * rejection nobody acts on, and every one of these is a document that exists in
 * Sanity and does not exist in Payload.
 */
const failures: string[] = []

// ── Asset handling ────────────────────────────────────────────

/**
 * Sanity asset refs encode everything needed to build their CDN URL.
 *
 *   image-<hash>-<width>x<height>-<ext>
 *   file-<id>-<ext>
 */
function assetUrl(ref: string): { url: string; filename: string; isImage: boolean } | null {
  const image = ref.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/)
  if (image) {
    const [, hash, dims, ext] = image
    return {
      url: `https://cdn.sanity.io/images/${projectId}/${dataset}/${hash}-${dims}.${ext}`,
      filename: `${hash}-${dims}.${ext}`,
      isImage: true,
    }
  }
  const file = ref.match(/^file-([a-f0-9]+)-(\w+)$/)
  if (file) {
    const [, id, ext] = file
    return {
      url: `https://cdn.sanity.io/files/${projectId}/${dataset}/${id}.${ext}`,
      filename: `${id}.${ext}`,
      isImage: false,
    }
  }
  return null
}

const MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  svg: 'image/svg+xml',
  pdf: 'application/pdf',
  glb: 'model/gltf-binary',
}

type Cms = Awaited<ReturnType<typeof getPayload>>

/** sanity asset ref → payload upload id, so one asset uploads once. */
const assetMap = new Map<string, string>()

/**
 * Download one Sanity asset and store it in Payload.
 *
 * Images go to `media` (which generates the stored sizes), everything else to
 * `documents`. Failures return null rather than throwing: one unreachable
 * photo must not abandon a migration of four hundred documents.
 */
async function importAsset(
  cms: Cms,
  ref: string | undefined,
  altHint: string
): Promise<string | null> {
  if (!ref) return null
  if (assetMap.has(ref)) return assetMap.get(ref)!

  const info = assetUrl(ref)
  if (!info) {
    log(`  ! unrecognised asset ref: ${ref}`)
    return null
  }

  const collection = info.isImage ? 'media' : 'documents'

  // Already imported by an earlier run?
  const { docs } = await cms.find({
    collection,
    where: { legacySanityId: { equals: ref } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) {
    assetMap.set(ref, String(docs[0].id))
    tally(collection, 'skipped')
    return String(docs[0].id)
  }

  if (DRY) {
    log(`  would upload ${collection}: ${info.filename}`)
    return null
  }

  try {
    const response = await fetch(info.url)
    if (!response.ok) throw new Error(`HTTP ${response.status}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const ext = info.filename.split('.').pop()?.toLowerCase() ?? ''

    const created = await cms.create({
      collection,
      data: (info.isImage
        ? { alt: altHint || info.filename, legacySanityId: ref }
        : { title: altHint || info.filename, legacySanityId: ref }) as never,
      file: {
        data: buffer,
        mimetype: MIME[ext] ?? 'application/octet-stream',
        name: info.filename,
        size: buffer.byteLength,
      },
    })

    assetMap.set(ref, String(created.id))
    tally(collection, 'created')
    return String(created.id)
  } catch (err) {
    log(`  ! failed to import asset ${ref}: ${(err as Error).message}`)
    return null
  }
}

type SanityImage = { asset?: { _ref?: string }; caption?: string } | undefined
type SanityFile = { asset?: { _ref?: string } } | undefined

const imageId = (cms: Cms, img: SanityImage, alt: string) =>
  importAsset(cms, img?.asset?._ref, img?.caption ?? alt)

const fileId = (cms: Cms, f: SanityFile, title: string) =>
  importAsset(cms, f?.asset?._ref, title)

async function imageIds(cms: Cms, list: SanityImage[] | undefined, alt: string) {
  const out: string[] = []
  for (const img of list ?? []) {
    const id = await imageId(cms, img, alt)
    if (id) out.push(id)
  }
  return out
}

// ── Document upsert ───────────────────────────────────────────

/** sanity _id → payload id, per collection. */
const idMap = new Map<string, string>()

async function upsert(
  cms: Cms,
  collection: string,
  sanityId: string,
  data: Record<string, unknown>
): Promise<string | null> {
  const { docs } = (await cms.find({
    collection: collection as never,
    where: { legacySanityId: { equals: sanityId } },
    limit: 1,
    depth: 0,
  })) as { docs: { id: string | number }[] }

  if (DRY) {
    log(`  would ${docs[0] ? 'update' : 'create'} ${collection}: ${sanityId}`)
    return null
  }

  try {
    if (docs[0]) {
      const updated = (await cms.update({
        collection: collection as never,
        id: docs[0].id,
        data: data as never,
        // The migration is not a user action; order emails and cache busts have
        // no business firing four hundred times during an import.
        context: { skipOrderEffects: true },
      })) as { id: string | number }
      tally(collection, 'updated')
      idMap.set(sanityId, String(updated.id))
      return String(updated.id)
    }

    const created = (await cms.create({
      collection: collection as never,
      data: { ...data, legacySanityId: sanityId } as never,
      context: { skipOrderEffects: true },
    })) as { id: string | number }
    tally(collection, 'created')
    idMap.set(sanityId, String(created.id))
    return String(created.id)
  } catch (err) {
    const message = `${collection} ${sanityId}: ${(err as Error).message}`
    log(`  ! ${message}`)
    failures.push(message)
    tally(collection, 'skipped')
    return null
  }
}

/** Resolve a Sanity reference to the Payload id it was imported as. */
const ref = (r: { _ref?: string } | undefined) => (r?._ref ? (idMap.get(r._ref) ?? null) : null)

// ── Fetch helper ──────────────────────────────────────────────

async function all<T>(type: string): Promise<T[]> {
  const docs = await sanity.fetch<T[]>(`*[_type == $type]`, { type })
  log(`\n── ${type}: ${docs.length} document(s)`)
  return docs
}

// ── The migration ─────────────────────────────────────────────

/* eslint-disable @typescript-eslint/no-explicit-any */
async function main() {
  const cms = await getPayload({ config })

  log(`Migrating from Sanity ${projectId}/${dataset}${DRY ? ' (DRY RUN)' : ''}`)

  // ── Members ─────────────────────────────────────────────────
  for (const m of await all<any>('member')) {
    await upsert(cms, 'members', m._id, {
      name: m.name,
      slug: m.slug?.current,
      photo: await imageId(cms, m.photo, m.name),
      role: m.role,
      tagline: m.tagline,
      subTeam: m.subTeam,
      yearOfStudy: m.yearOfStudy,
      joinedYear: m.joinedYear,
      graduationYear: m.graduationYear,
      yearsContributed: m.yearsContributed,
      isAlumni: m.isAlumni ?? false,
      currentOrg: m.currentOrg,
      isActive: m.isActive ?? true,
      bio: m.bio,
      quote: m.quote,
      focusAreas: m.focusAreas,
      skills: m.skills,
      achievements: (m.achievements ?? []).map((a: any) => ({
        title: a.title,
        year: a.year,
        achievement: a.achievement,
        details: a.details,
      })),
      works: (m.works ?? []).map((w: any) => ({ name: w.name, url: w.url })),
      linkedin: m.linkedin,
      github: m.github,
      website: m.website,
    })
  }

  // ── Competitions (without `rover` — see the back-fill below) ─
  const competitions = await all<any>('competition')
  for (const c of competitions) {
    await upsert(cms, 'competitions', c._id, {
      name: c.name,
      shortName: c.shortName,
      year: c.year,
      slug: c.slug?.current,
      location: c.location,
      result: c.result,
      rank: c.rank,
      totalTeams: c.totalTeams,
      sarVideo: c.sarVideo,
      gallery: await imageIds(cms, c.gallery, `${c.shortName} ${c.year}`),
      reportPdf: await fileId(cms, c.reportPdf, `${c.shortName} ${c.year} report`),
      teamMembers: (c.teamMembers ?? [])
        .map((row: any) => ({
          member: ref(row.member),
          competitionRole: row.competitionRole,
        }))
        .filter((row: any) => row.member),
    })
  }

  // ── Rovers ──────────────────────────────────────────────────
  const rovers = await all<any>('rover')
  for (const r of rovers) {
    await upsert(cms, 'rovers', r._id, {
      name: r.name,
      slug: r.slug?.current,
      year: r.year,
      isFlagship: r.isFlagship ?? false,
      tagline: r.tagline,
      overview: r.overview,
      teamLead: r.teamLead,
      competition: ref(r.competition),
      sarVideoUrl: r.sarVideoUrl,
      featuredImage: await imageId(cms, r.featuredImage, r.name),
      gallery: await imageIds(cms, r.gallery, r.name),
      diagrams: await imageIds(cms, r.diagrams, `${r.name} diagram`),
      diagramAnnotations: (r.diagramAnnotations ?? []).map((a: any) => ({
        label: a.label,
        description: a.description,
        xPercent: a.xPercent,
        yPercent: a.yPercent,
      })),
      cadModel: await fileId(cms, r.cadModel, `${r.name} CAD model`),
      technicalPdf: await fileId(cms, r.technicalPdf, `${r.name} technical PDF`),
      specs: r.specs,
      keySpecs: (r.keySpecs ?? []).map((s: any) => ({ label: s.label, value: s.value })),
      namedComponents: r.namedComponents,
      keyInnovations: (r.keyInnovations ?? []).map((k: any) => ({
        title: k.title,
        description: k.description,
      })),
      subsystems: await Promise.all(
        (r.subsystems ?? []).map(async (s: any) => ({
          name: s.name,
          subTeam: s.subTeam,
          summary: s.summary,
          highlights: s.highlights,
          image: await imageId(cms, s.image, s.name),
        }))
      ),
      missions: (r.missions ?? []).map((m: any) => ({ name: m.name, summary: m.summary })),
      crew: (r.crew ?? [])
        .map((c: any) => ({
          member: ref(c.member),
          contribution: c.contribution,
          subTeamOverride: c.subTeamOverride,
        }))
        .filter((c: any) => c.member),
      description: portableTextToLexical(r.description, (a: string) => assetMap.get(a) ?? null),
    })
  }

  // ── Back-fill competition → rover ───────────────────────────
  // The one genuine cycle in the graph. Competitions were written first so
  // rovers could point at them; now that rovers exist, the link goes back.
  log('\n── back-filling competition → rover')
  for (const c of competitions) {
    const roverId = ref(c.rover)
    const competitionId = idMap.get(c._id)
    if (!roverId || !competitionId || DRY) continue
    await cms.update({
      collection: 'competitions',
      id: competitionId,
      data: { rover: roverId },
    })
  }

  // ── Research ────────────────────────────────────────────────
  for (const p of await all<any>('research')) {
    await upsert(cms, 'research', p._id, {
      title: p.title,
      slug: p.slug?.current,
      authors: (p.authors ?? []).map(ref).filter(Boolean),
      year: p.year,
      abstract: p.abstract,
      doi: p.doi,
      pdfFile: await fileId(cms, p.pdfFile, p.title),
      topics: p.topics,
      status: p.status ?? 'published',
      conference: p.conference,
      citation: p.citation,
    })
  }

  // ── Posts ───────────────────────────────────────────────────
  for (const p of await all<any>('post')) {
    // Body images have to exist before the Lexical tree can point at them.
    for (const block of p.body ?? []) {
      if (block?._type === 'image') await imageId(cms, block, p.title)
    }
    await upsert(cms, 'posts', p._id, {
      title: p.title,
      slug: p.slug?.current,
      publishedAt: p.publishedAt,
      category: p.category,
      featuredImage: await imageId(cms, p.featuredImage, p.title),
      excerpt: p.excerpt,
      body: portableTextToLexical(p.body, (a: string) => assetMap.get(a) ?? null),
      author: ref(p.author),
    })
  }

  // ── Sponsors ────────────────────────────────────────────────
  for (const s of await all<any>('sponsor')) {
    await upsert(cms, 'sponsors', s._id, {
      name: s.name,
      tier: s.tier,
      logoLight: await imageId(cms, s.logoLight, `${s.name} logo`),
      logoDark: await imageId(cms, s.logoDark, `${s.name} logo`),
      logo: await imageId(cms, s.logo, `${s.name} logo`),
      website: s.website,
      startYear: s.startYear,
      isActive: s.isActive ?? true,
    })
  }

  // ── Testimonials ────────────────────────────────────────────
  for (const t of await all<any>('testimonial')) {
    await upsert(cms, 'testimonials', t._id, {
      name: t.name,
      role: t.role,
      organization: t.organization,
      quote: t.quote,
      photo: await imageId(cms, t.photo, t.name),
      link: t.link,
      featured: t.featured ?? false,
      order: t.order,
    })
  }

  // ── SAR videos ──────────────────────────────────────────────
  for (const v of await all<any>('sarVideo')) {
    await upsert(cms, 'sar-videos', v._id, {
      title: v.title,
      competition: ref(v.competition),
      year: v.year,
      youtubeUrl: v.youtubeUrl,
      thumbnail: await imageId(cms, v.thumbnail, v.title),
      description: v.description,
    })
  }

  // ── Announcements ───────────────────────────────────────────
  for (const a of await all<any>('announcement')) {
    await upsert(cms, 'announcements', a._id, {
      title: a.title,
      message: a.message,
      link: a.link,
      linkLabel: a.linkLabel,
      startDate: a.startDate,
      endDate: a.endDate,
      isActive: a.isActive ?? true,
      priority: a.priority ?? 10,
    })
  }

  // ── Shop catalogue ──────────────────────────────────────────
  for (const c of await all<any>('productCategory')) {
    await upsert(cms, 'product-categories', c._id, {
      title: c.title,
      slug: c.slug?.current,
      description: c.description,
      order: c.order ?? 0,
    })
  }

  for (const p of await all<any>('product')) {
    await upsert(cms, 'products', p._id, {
      title: p.title,
      slug: p.slug?.current,
      category: ref(p.category),
      tagline: p.tagline,
      basePrice: p.basePrice,
      compareAtPrice: p.compareAtPrice,
      isActive: p.isActive ?? true,
      featured: p.featured ?? false,
      order: p.order ?? 0,
      images: await imageIds(cms, p.images, p.title),
      variantAxisLabel: p.variantAxisLabel,
      trackInventory: p.trackInventory ?? true,
      // NOTE: variant ids are regenerated by Payload. Any order already placed
      // in Sanity keeps its own frozen copy of what was bought, so nothing on an
      // invoice changes — but its `variantKey` will no longer match a live
      // variant, which is why cancelling a MIGRATED order cannot return stock.
      // Those orders are historical; new orders are unaffected.
      variants: (p.variants ?? []).map((v: any) => ({
        label: v.label,
        sku: v.sku,
        stock: v.stock ?? 0,
        lowStockThreshold: v.lowStockThreshold,
        priceOverride: v.priceOverride,
        isActive: v.isActive ?? true,
      })),
      maxPerOrder: p.maxPerOrder,
      description: portableTextToLexical(p.description, (a: string) => assetMap.get(a) ?? null),
      sizeGuide: p.sizeGuide,
      careInfo: p.careInfo,
    })
  }

  // ── Form submissions ────────────────────────────────────────
  // Carried over so the team keeps its history. Nothing here is public.
  for (const a of await all<any>('application')) {
    await upsert(cms, 'applications', a._id, {
      status: a.status ?? 'new',
      name: a.name,
      email: a.email,
      phone: a.phone,
      studentId: a.studentId,
      department: a.department,
      year: a.year,
      subteam1: a.subteam1,
      subteam2: a.subteam2,
      whyJoin: a.whyJoin,
      experience: a.experience,
      portfolio: a.portfolio,
      reviewerNotes: a.reviewerNotes,
      submittedAt: a.submittedAt,
    })
  }

  for (const d of await all<any>('donation')) {
    await upsert(cms, 'donations', d._id, {
      status: d.status ?? 'pending',
      amount: d.amount,
      approvedAt: d.approvedAt,
      verifiedBy: d.verifiedBy,
      adminNotes: d.adminNotes,
      rejectionReason: d.rejectionReason,
      paymentMethod: d.paymentMethod,
      senderAccount: d.senderAccount,
      transactionId: d.transactionId,
      contactEmail: d.contactEmail,
      contactPhone: d.contactPhone,
      donatedAt: d.donatedAt,
      donorName: d.donorName,
      isAnonymous: d.isAnonymous ?? false,
      affiliation: d.affiliation,
      message: d.message,
    })
  }

  for (const o of await all<any>('order')) {
    await upsert(cms, 'orders', o._id, {
      trackId: o.trackId,
      status: o.status,
      paymentStatus: o.paymentStatus,
      paymentMethod: o.paymentMethod ?? 'cod',
      cancellationReason: o.cancellationReason,
      adminNotes: o.adminNotes,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      phoneLast3: o.phoneLast3 ?? String(o.customerPhone ?? '').replace(/\D/g, '').slice(-3),
      deliveryMethod: o.deliveryMethod,
      deliveryAddress: o.deliveryAddress,
      campusDetails: o.campusDetails,
      customerNote: o.customerNote,
      items: (o.items ?? []).map((i: any) => ({
        productTitle: i.productTitle,
        variantLabel: i.variantLabel,
        sku: i.sku,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        lineTotal: i.lineTotal,
        productId: idMap.get(i.productId) ?? i.productId,
        variantKey: i.variantKey,
        productSlug: i.productSlug,
        imageUrl: i.imageUrl,
        stockTaken: i.stockTaken,
      })),
      subtotal: o.subtotal,
      deliveryFee: o.deliveryFee,
      total: o.total,
      placedAt: o.placedAt,
      statusHistory: (o.statusHistory ?? []).map((h: any) => ({
        status: h.status,
        at: h.at,
        note: h.note,
      })),
      notifiedStatuses: o.notifiedStatuses,
      emailStatus: o.emailStatus,
      stockReserved: o.stockReserved,
      stockRestoredAt: o.stockRestoredAt,
      idempotencyKey: o.idempotencyKey,
    })
  }

  // ── Globals ─────────────────────────────────────────────────
  log('\n── globals')
  const [recruitment] = await sanity.fetch<any[]>(`*[_type == "recruitmentConfig"]`)
  if (recruitment && !DRY) {
    await cms.updateGlobal({
      slug: 'recruitment',
      data: {
        status: recruitment.status ?? 'closed',
        openingMessage: recruitment.openingMessage,
        closingDate: recruitment.closingDate,
        faqItems: (recruitment.faqItems ?? []).map((f: any) => ({
          question: f.question,
          answer: f.answer,
        })),
      },
    })
    log('  recruitment ✓')
  }

  const [crowdfunding] = await sanity.fetch<any[]>(`*[_type == "crowdfundingConfig"]`)
  if (crowdfunding && !DRY) {
    await cms.updateGlobal({
      slug: 'crowdfunding',
      data: {
        status: crowdfunding.status ?? 'closed',
        headline: crowdfunding.headline,
        pitch: crowdfunding.pitch,
        closedMessage: crowdfunding.closedMessage,
        deadline: crowdfunding.deadline,
        verificationHours: crowdfunding.verificationHours,
        showSupporterCount: crowdfunding.showSupporterCount ?? true,
        channels: (crowdfunding.channels ?? []).map((c: any) => ({
          method: c.method,
          accountNumber: c.accountNumber,
          accountName: c.accountName,
          accountType: c.accountType,
          note: c.note,
          bankName: c.bankName,
          branch: c.branch,
          routingNumber: c.routingNumber,
        })),
        steps: (crowdfunding.steps ?? []).map((s: any) => ({ title: s.title, body: s.body })),
        faqItems: (crowdfunding.faqItems ?? []).map((f: any) => ({
          question: f.question,
          answer: f.answer,
        })),
      },
    })
    log('  crowdfunding ✓')
  }

  const [shop] = await sanity.fetch<any[]>(`*[_type == "shopConfig"]`)
  if (shop && !DRY) {
    await cms.updateGlobal({
      slug: 'shop',
      data: {
        status: shop.status ?? 'closed',
        closedMessage: shop.closedMessage,
        announcement: shop.announcement,
        standardDeliveryFee: shop.standardDeliveryFee ?? 120,
        campusDeliveryEnabled: shop.campusDeliveryEnabled ?? true,
        campusHandoverPoints: shop.campusHandoverPoints,
        requireBracuEmailForCampus: shop.requireBracuEmailForCampus ?? false,
        estimatedDeliveryDays: shop.estimatedDeliveryDays,
        minOrderValue: shop.minOrderValue ?? 0,
        maxQtyPerItem: shop.maxQtyPerItem ?? 5,
        maxItemsPerOrder: shop.maxItemsPerOrder ?? 20,
        orderPrefix: shop.orderPrefix ?? 'MT',
        supportEmail: shop.supportEmail,
        supportPhone: shop.supportPhone,
        adminNotifyEmails: shop.adminNotifyEmails,
        shippingPolicy: shop.shippingPolicy,
        returnPolicy: shop.returnPolicy,
      },
    })
    log('  shop ✓')
  }

  // ── Report ──────────────────────────────────────────────────
  log('\n──────────────────────────────────────────')
  log(DRY ? 'DRY RUN — nothing was written' : 'Migration complete')
  for (const [kind, c] of Object.entries(counts).sort()) {
    log(`  ${kind.padEnd(20)} created ${c.created}  updated ${c.updated}  skipped ${c.skipped}`)
  }
  log('──────────────────────────────────────────')

  if (failures.length) {
    log(`\n${failures.length} document(s) were REJECTED and are not in Payload:\n`)
    for (const f of failures) log(`  ✗ ${f}`)
    log('\nFix the source data (or the collection) and re-run — this script is idempotent.\n')
  } else {
    log('')
  }

  process.exit(failures.length ? 2 : 0)
}

// Awaited at the top level, not fired and forgotten. `payload run` returns as
// soon as the module finishes evaluating, so a floating promise here would mean
// the process exits before the migration has done anything at all.
await main().catch((err) => {
  console.error('\nMigration failed:', err)
  process.exit(1)
})

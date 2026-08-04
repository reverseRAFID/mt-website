/**
 * Restore lost media by re-fetching from Sanity's CDN and uploading to Cloudinary.
 *
 *   node --env-file-if-exists=.env.local scripts/restore-media-from-sanity.mjs --dry
 *   node --env-file-if-exists=.env.local scripts/restore-media-from-sanity.mjs
 *
 * ── Why this exists ───────────────────────────────────────────
 * The Payload import ran before Cloudinary was configured, so every `media`
 * document was written with a local-disk URL (`/payload-api/media/file/…`).
 * The deploy that followed replaced the filesystem and the bytes went with it —
 * 69 documents pointing at files that no longer exist.
 *
 * Re-running the Sanity import is the wrong fix: media ids are referenced by
 * every rover, post, member, sponsor and product that uses the image, so
 * deleting and recreating them breaks all of it. This restores IN PLACE — same
 * document id, same relationships, only `url` changes.
 *
 * The source of truth for "which Sanity asset is this?" is `legacySanityId`,
 * written by the original migration. It encodes the CDN path exactly, which is
 * safer than parsing it back out of the filename Payload assigned.
 *
 * Idempotent: a document already on Cloudinary is skipped, so this is safe to
 * re-run after a partial failure. Pass --force to re-upload regardless.
 */

import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { v2 as cloudinary } from 'cloudinary'
import { MongoClient } from 'mongodb'

const DRY = process.argv.includes('--dry')
const FORCE = process.argv.includes('--force')
const ROOT = path.resolve(import.meta.dirname, '..')

const PROJECT = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

// Must match src/payload/storage/cloudinary.ts — if the public id this builds
// disagrees with the adapter's, every URL points at a file that is not there.
const FOLDER = 'mongol-tori/media'
const RAW_EXTENSIONS = new Set(['pdf', 'glb', 'gltf', 'zip', 'csv', 'txt', 'doc', 'docx'])
const VIDEO_EXTENSIONS = new Set(['mp4', 'webm', 'mov', 'm4v'])

const extensionOf = (filename) => filename.split('.').pop()?.toLowerCase() ?? ''

function resourceTypeFor(filename) {
  const ext = extensionOf(filename)
  if (VIDEO_EXTENSIONS.has(ext)) return 'video'
  if (RAW_EXTENSIONS.has(ext)) return 'raw'
  return 'image'
}

function publicIdFor(filename, type) {
  const base = type === 'raw' ? filename : filename.replace(/\.[^.]+$/, '')
  return `${FOLDER}/${base}`
}

/**
 * Sanity asset ref → CDN URL.
 *
 * Refs look like `image-<hash>-<width>x<height>-<ext>`; the CDN path is the
 * same parts with the extension as a real extension.
 */
function sanityUrl(ref) {
  const m = /^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/.exec(ref ?? '')
  if (!m) return null
  return `https://cdn.sanity.io/images/${PROJECT}/${DATASET}/${m[1]}-${m[2]}.${m[3]}`
}

function configureCloudinary() {
  if (process.env.CLOUDINARY_URL) {
    cloudinary.config({ secure: true })
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
  }
}

/**
 * Get the bytes for one document.
 *
 * Sanity first — it is the original upload and still serves them. Local disk is
 * the fallback for anything uploaded after the migration, which Sanity never had.
 */
async function fetchBytes(doc) {
  const url = sanityUrl(doc.legacySanityId)
  if (url) {
    const res = await fetch(url)
    if (res.ok) return { buffer: Buffer.from(await res.arrayBuffer()), from: 'sanity' }
    // Fall through to disk rather than giving up — a 404 here is recoverable if
    // the bytes happen to still be sitting in ./uploads.
  }

  const onDisk = path.join(ROOT, 'uploads/media', doc.filename ?? '')
  if (doc.filename && existsSync(onDisk)) {
    return { buffer: readFileSync(onDisk), from: 'disk' }
  }

  return null
}

async function upload(filename, buffer) {
  const type = resourceTypeFor(filename)
  const publicId = publicIdFor(filename, type)

  await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        public_id: publicId,
        resource_type: type,
        overwrite: true,
        invalidate: true,
        use_filename: false,
        unique_filename: false,
      },
      (error) => (error ? reject(error) : resolve())
    )
    stream.end(buffer)
  })

  return cloudinary.url(publicId, { resource_type: type, secure: true })
}

async function main() {
  const configured = Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  )
  if (!configured) {
    console.error('\nCloudinary is not configured — set CLOUDINARY_URL in .env.local.\n')
    process.exit(1)
  }
  if (!PROJECT) {
    console.error('\nNEXT_PUBLIC_SANITY_PROJECT_ID is not set — cannot build CDN URLs.\n')
    process.exit(1)
  }

  configureCloudinary()

  const client = new MongoClient(process.env.DATABASE_URI)
  await client.connect()
  const media = client.db().collection('media')

  const docs = await media.find({}).toArray()
  console.log(`\nRestoring ${docs.length} media document(s)${DRY ? ' (DRY RUN)' : ''}\n`)

  let restored = 0
  let skipped = 0
  const failed = []

  for (const doc of docs) {
    const label = doc.filename ?? String(doc._id)

    if (!FORCE && doc.url?.includes('res.cloudinary.com')) {
      skipped++
      continue
    }
    if (!doc.filename) {
      failed.push({ label, why: 'no filename' })
      continue
    }

    const bytes = await fetchBytes(doc)
    if (!bytes) {
      failed.push({ label, why: 'bytes unavailable from Sanity or disk' })
      console.log(`  ! ${label}: no source for the bytes`)
      continue
    }

    // The migration recorded the original byte count. A mismatch means the CDN
    // handed back something other than the original — worth saying out loud,
    // but not worth refusing an image the site is currently missing entirely.
    const sizeNote =
      doc.filesize && doc.filesize !== bytes.buffer.byteLength
        ? ` (size ${bytes.buffer.byteLength} ≠ recorded ${doc.filesize})`
        : ''

    if (DRY) {
      console.log(`  would restore ${label} from ${bytes.from}${sizeNote}`)
      restored++
      continue
    }

    try {
      const url = await upload(doc.filename, bytes.buffer)
      await media.updateOne(
        { _id: doc._id },
        { $set: { url, filesize: bytes.buffer.byteLength, updatedAt: new Date().toISOString() } }
      )
      console.log(`  ✓ ${label} ← ${bytes.from}${sizeNote}`)
      restored++
    } catch (err) {
      failed.push({ label, why: err.message })
      console.log(`  ! ${label}: ${err.message}`)
    }
  }

  await client.close()

  console.log(
    `\n${DRY ? 'Would restore' : 'Restored'} ${restored} · skipped ${skipped} (already on Cloudinary) · ` +
      `${failed.length} failed`
  )
  if (failed.length) {
    console.log('\nFailed:')
    for (const f of failed) console.log(`  – ${f.label}: ${f.why}`)
  }
  console.log()

  process.exit(failed.length ? 2 : 0)
}

main().catch((err) => {
  console.error('\nRestore failed:', err)
  process.exit(1)
})

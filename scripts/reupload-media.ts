/**
 * Push locally-stored uploads to the configured object storage.
 *
 *   npm run reupload:media
 *   MIGRATE_DRY=1 npm run reupload:media   # report, write nothing
 *
 * ── Why this exists ───────────────────────────────────────────
 * Files uploaded before Cloudinary was configured live on disk under
 * ./uploads, and their `url` points at this server. Switching storage does not
 * move them — Payload only talks to the adapter on write.
 *
 * The obvious fix, deleting the media and re-running the Sanity import, is
 * wrong: media ids are referenced by every rover, post, sponsor and product
 * that uses the image. Deleting them breaks all of it.
 *
 * So this re-uploads IN PLACE. It reads each document's file off disk and sends
 * it back through `payload.update({ file })`, which routes through the storage
 * adapter and rewrites `url` — keeping the document id, and therefore every
 * relationship pointing at it.
 *
 * Idempotent: a document whose URL is already on Cloudinary is skipped, so this
 * is safe to re-run after a partial failure.
 */

import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { getPayload } from 'payload'

import config from '../payload.config'

const DRY = process.env.MIGRATE_DRY === '1'
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')

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

const COLLECTIONS = [
  { slug: 'media' as const, dir: 'uploads/media' },
  { slug: 'documents' as const, dir: 'uploads/documents' },
]

async function main() {
  const cms = await getPayload({ config })

  const configured = Boolean(
    process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET)
  )

  if (!configured) {
    console.error(
      '\nCloudinary is not configured — there is nowhere to re-upload to.\n' +
        'Set CLOUDINARY_URL (or the three CLOUDINARY_* vars) in .env.local first.\n'
    )
    process.exit(1)
  }

  console.log(`\nRe-uploading local files to Cloudinary${DRY ? ' (DRY RUN)' : ''}\n`)

  let moved = 0
  let skipped = 0
  let missing = 0

  for (const { slug, dir } of COLLECTIONS) {
    const { docs } = await cms.find({ collection: slug, limit: 1000, depth: 0, pagination: false })
    console.log(`── ${slug}: ${docs.length} document(s)`)

    for (const doc of docs as Array<{ id: string | number; filename?: string | null; url?: string | null }>) {
      if (!doc.filename) {
        console.log(`  – ${doc.id}: no filename, nothing to move`)
        skipped++
        continue
      }

      if (doc.url?.includes('res.cloudinary.com')) {
        skipped++
        continue
      }

      const file = path.join(ROOT, dir, doc.filename)
      if (!existsSync(file)) {
        // The document survived but the bytes did not — a deploy replaced the
        // filesystem, which is the whole reason object storage is not optional.
        console.log(`  ! ${doc.filename}: not on disk, cannot re-upload`)
        missing++
        continue
      }

      if (DRY) {
        console.log(`  would re-upload ${doc.filename}`)
        moved++
        continue
      }

      const buffer = readFileSync(file)
      const ext = doc.filename.split('.').pop()?.toLowerCase() ?? ''

      try {
        await cms.update({
          collection: slug,
          id: doc.id,
          // Empty data: the point is the file, and everything else about the
          // document — alt text, captions, and crucially its id — stays put.
          data: {},
          file: {
            data: buffer,
            mimetype: MIME[ext] ?? 'application/octet-stream',
            name: doc.filename,
            size: buffer.byteLength,
          },
        })
        console.log(`  ✓ ${doc.filename}`)
        moved++
      } catch (err) {
        console.log(`  ! ${doc.filename}: ${(err as Error).message}`)
        missing++
      }
    }
  }

  console.log(
    `\n${DRY ? 'Would move' : 'Moved'} ${moved} · skipped ${skipped} (already remote) · ` +
      `${missing} failed or missing\n`
  )
  process.exit(missing ? 2 : 0)
}

await main().catch((err) => {
  console.error('\nRe-upload failed:', err)
  process.exit(1)
})

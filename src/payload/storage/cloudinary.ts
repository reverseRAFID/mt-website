import type { Adapter, GeneratedAdapter } from '@payloadcms/plugin-cloud-storage/types'

import { v2 as cloudinary } from 'cloudinary'

import { publicIdFor, resourceTypeFor } from '../../lib/cms/cloudinary-url'

/**
 * Cloudinary storage adapter.
 *
 * ── Why this is hand-written ──────────────────────────────────
 * Payload ships first-party adapters for S3, Azure, GCS, Vercel Blob and
 * UploadThing — but not Cloudinary. Two community packages exist; neither is
 * versioned against Payload 3.86, and this is the code path every uploaded file
 * passes through in an application that also stores customer addresses. The
 * official generic plugin (`@payloadcms/plugin-cloud-storage`) exists precisely
 * so a provider can be added without that risk, and the interface it asks for is
 * four functions.
 *
 * ── What is NOT here ──────────────────────────────────────────
 * URL construction. That lives in src/lib/cms/cloudinary-url.ts, because this
 * module imports the Cloudinary Node SDK — which needs `fs` — and the URL
 * helpers are used by the next/image loader in the browser.
 */

export interface CloudinaryAdapterArgs {
  /**
   * Cloudinary folder to upload into, e.g. `mongol-tori/media`.
   *
   * Worth setting per collection: it is the only thing separating rover photos
   * from technical PDFs when somebody opens the Cloudinary console looking for
   * a file.
   */
  folder?: string
}

let configured = false

/** Read credentials once, from either the URL form or the three-part form. */
function configure(): void {
  if (configured) return

  if (process.env.CLOUDINARY_URL) {
    // The SDK reads CLOUDINARY_URL by itself; calling config() with no argument
    // makes that explicit rather than implicit.
    cloudinary.config({ secure: true })
  } else {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    })
  }
  configured = true
}

export const cloudinaryAdapter =
  ({ folder = '' }: CloudinaryAdapterArgs = {}): Adapter =>
  (): GeneratedAdapter => ({
    name: 'cloudinary',

    onInit: configure,

    /**
     * Upload one file.
     *
     * Payload calls this once per file — the original, and once more for every
     * generated image size, each with its own filename. `overwrite: true` with a
     * deterministic public id means re-uploading the same filename replaces it
     * rather than accumulating `photo_1`, `photo_2`.
     *
     * `upload_stream` rather than `upload`, because Payload hands us a Buffer
     * and the alternative is writing it to a temp file first.
     */
    handleUpload: async ({ file }) => {
      configure()

      const type = resourceTypeFor(file.filename)
      const publicId = publicIdFor(folder, file.filename, type)

      await new Promise<void>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            resource_type: type,
            overwrite: true,
            invalidate: true,
            // Payload has already decided what this file is called and Payload's
            // database is the index. Letting Cloudinary invent a unique suffix
            // would break generateURL, which can only reconstruct the id.
            use_filename: false,
            unique_filename: false,
          },
          (error) => (error ? reject(error) : resolve())
        )
        stream.end(file.buffer)
      })
    },

    /**
     * Delete a file.
     *
     * Swallows a not-found: Payload is deleting its own record either way, and
     * an upload that failed halfway leaves a document with no Cloudinary asset
     * behind it. Refusing to delete the document because the file is already
     * gone would be the wrong way round.
     */
    handleDelete: async ({ filename }) => {
      configure()

      const type = resourceTypeFor(filename)
      try {
        await cloudinary.uploader.destroy(publicIdFor(folder, filename, type), {
          resource_type: type,
          invalidate: true,
        })
      } catch (err) {
        console.error(`[cloudinary] could not delete ${filename}:`, (err as Error).message)
      }
    },

    /**
     * The canonical delivery URL — the ORIGINAL, with no transformation.
     *
     * Deliberately untransformed. This is what lands in `media.url` and gets
     * stored in order snapshots, so it has to mean "the file", not "the file at
     * one particular size somebody wanted in 2026". Sizes are applied at render
     * time by `src/lib/cms/media.ts`.
     */
    generateURL: ({ filename }) => {
      configure()
      const type = resourceTypeFor(filename)
      return cloudinary.url(publicIdFor(folder, filename, type), {
        resource_type: type,
        secure: true,
      })
    },

    /**
     * Serve a file requested through Payload's own URL.
     *
     * Redirects rather than proxying. `media.url` is already an absolute
     * Cloudinary URL, so this path is only reached by something holding an old
     * link — and proxying would put every byte of every image through our
     * server for no benefit, while losing Cloudinary's CDN.
     */
    staticHandler: async (_req, { params }) => {
      configure()
      const type = resourceTypeFor(params.filename)
      const url = cloudinary.url(publicIdFor(folder, params.filename, type), {
        resource_type: type,
        secure: true,
      })
      return Response.redirect(url, 302)
    },
  })

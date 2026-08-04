import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { cldTransform } from '../../lib/cms/cloudinary-url'
import { legacySanityId } from '../fields/slug'

/**
 * Images.
 *
 * ── No generated sizes, on purpose ────────────────────────────
 * Files live on Cloudinary, which resizes on request, so nothing is generated
 * at upload. One stored original per image instead of five, any size available
 * without a re-upload, and a design change costs nothing — see
 * `cldUrl()` in src/lib/cms/media.ts.
 *
 * This is also why there is no focal point. Payload's focal point only means
 * something when Payload does the cropping; Cloudinary's `g_auto` picks the
 * region of interest itself, which is better than a centre crop and one less
 * thing for an editor to set on four hundred photos.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Media',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
    useAsTitle: 'alt',
  },
  access: {
    // Public: these are the images on the website.
    read: anyone,
    create: staff,
    update: staff,
    delete: staff,
  },
  upload: {
    // Only used when Cloudinary is not configured — see payload.config.ts.
    staticDir: 'uploads/media',
    mimeTypes: ['image/*'],
    // A Cloudinary transformation rather than a stored size. Falls back to the
    // original when Cloudinary is not configured, so the admin still shows
    // something in local development.
    adminThumbnail: ({ doc }) =>
      cldTransform(
        typeof doc?.url === 'string' ? doc.url : null,
        'f_auto,q_auto,w_320,h_320,c_fill,g_auto'
      ),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      admin: {
        description:
          'Describe the image for screen readers and for when it fails to load. Not a caption — say what is in it.',
      },
    },
    {
      name: 'caption',
      type: 'text',
      admin: {
        description:
          'Optional. Shown under the image in galleries. Sanity stored this on each usage; here it lives with the image, so one edit fixes it everywhere.',
      },
    },
    {
      name: 'credit',
      type: 'text',
      admin: { description: 'Photographer or source, where one needs crediting.' },
    },
    legacySanityId,
  ],
}

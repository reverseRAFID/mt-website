import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'

/**
 * Images.
 *
 * ── Why fixed sizes instead of Sanity's on-the-fly crops ──────
 * Sanity built a URL per call — `urlFor(img).width(440).height(550)` — and the
 * codebase had 27 distinct combinations. Payload resizes once, at upload.
 * Reproducing 27 fixed sizes would be absurd, so the site instead hands the
 * ORIGINAL to `next/image`, which does width resizing and srcset generation at
 * request time, and lets CSS `object-fit` handle the aspect ratios that used to
 * be baked into the crop.
 *
 * The four sizes below exist for the cases `next/image` cannot serve:
 *
 *   • `email`  — order confirmation emails. An email client cannot call the
 *                Next image optimiser, so this has to be a real stored file.
 *   • `og`     — Open Graph cards, for the same reason (scrapers do not run JS
 *                and want a stable absolute URL at exact dimensions).
 *   • `card`   — admin thumbnails and any non-`next/image` surface.
 *   • `hero`   — a sane upper bound so a 6000px phone photo is not the thing a
 *                page actually downloads if the optimiser is bypassed.
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
    staticDir: 'uploads/media',
    mimeTypes: ['image/*'],
    focalPoint: true,
    adminThumbnail: 'card',
    imageSizes: [
      { name: 'email', width: 160, height: 160, position: 'centre', fit: 'cover' },
      { name: 'card', width: 800, height: undefined, fit: 'inside', withoutEnlargement: true },
      { name: 'og', width: 1200, height: 630, position: 'centre', fit: 'cover' },
      { name: 'hero', width: 1920, height: undefined, fit: 'inside', withoutEnlargement: true },
    ],
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
  ],
}

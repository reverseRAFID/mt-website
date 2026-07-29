import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'

/**
 * Non-image uploads — technical PDFs, competition reports, research papers and
 * the occasional `.glb` CAD model.
 *
 * Separate from `media` because these have nothing in common with it
 * operationally: no alt text, no image sizes, no focal point, and an editor
 * looking for "the URC 2024 report" should not have to scroll past four hundred
 * rover photos to find it.
 */
export const Documents: CollectionConfig = {
  slug: 'documents',
  admin: {
    group: 'Media',
    defaultColumns: ['title', 'filename', 'updatedAt'],
    useAsTitle: 'title',
  },
  access: {
    read: anyone,
    create: staff,
    update: staff,
    delete: staff,
  },
  upload: {
    staticDir: 'uploads/documents',
    mimeTypes: ['application/pdf', 'model/gltf-binary', 'application/octet-stream'],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description:
          'What this file is, in words a person would search for — e.g. "Taurus SAR report 2024". Used as the download link label.',
      },
    },
  ],
}

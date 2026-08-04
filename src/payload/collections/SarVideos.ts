import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/** A System Acceptance Review video, as submitted to a competition. */
export const SarVideos: CollectionConfig = {
  slug: 'sar-videos',
  labels: { singular: 'SAR Video', plural: 'SAR Videos' },
  admin: {
    group: 'Rovers & Competitions',
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'competition'],
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('sar-videos'),
  defaultSort: '-year',
  fields: [
    { name: 'title', type: 'text', required: true },
    {
      name: 'competition',
      type: 'relationship',
      relationTo: 'competitions',
      required: true,
    },
    { name: 'year', type: 'number', required: true },
    {
      name: 'youtubeUrl',
      type: 'text',
      required: true,
      label: 'YouTube URL',
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      label: 'Custom Thumbnail',
      admin: { description: 'Optional — YouTube’s own thumbnail is used when empty.' },
    },
    { name: 'description', type: 'textarea' },
    legacySanityId,
  ],
}

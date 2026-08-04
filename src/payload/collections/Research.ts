import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId, slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/** A paper the team has published, pre-printed, or has under review. */
export const Research: CollectionConfig = {
  slug: 'research',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'status', 'conference'],
    description: 'Publications. Authors are team members, so profiles list them automatically.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('research'),
  defaultSort: '-year',
  fields: [
    slugField('title'),
    { name: 'title', type: 'text', required: true, label: 'Paper Title' },
    {
      name: 'authors',
      type: 'relationship',
      relationTo: 'members',
      hasMany: true,
      admin: { description: 'In citation order. Each author’s profile links back to this paper.' },
    },
    {
      type: 'row',
      fields: [
        { name: 'year', type: 'number', required: true, admin: { width: '30%' } },
        {
          name: 'status',
          type: 'select',
          required: true,
          defaultValue: 'published',
          label: 'Publication Status',
          options: [
            { label: 'Published', value: 'published' },
            { label: 'Pre-print', value: 'preprint' },
            { label: 'Under Review', value: 'under-review' },
          ],
          admin: { width: '35%' },
        },
        {
          name: 'conference',
          type: 'text',
          label: 'Conference / Journal',
          admin: { placeholder: 'e.g. IEEE ICRAE 2024', width: '35%' },
        },
      ],
    },
    { name: 'abstract', type: 'textarea', required: true },
    { name: 'doi', type: 'text', label: 'DOI / URL' },
    { name: 'pdfFile', type: 'upload', relationTo: 'documents', label: 'PDF' },
    {
      name: 'topics',
      type: 'text',
      hasMany: true,
      label: 'Topic Tags',
      admin: { description: 'Drives the filter on /research.' },
    },
    { name: 'citation', type: 'textarea', label: 'Citation String' },
    legacySanityId,
  ],
}

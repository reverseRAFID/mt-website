import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { bodyEditor } from '../fields/richText'
import { legacySanityId, slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/** News and blog posts. */
export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'publishedAt', 'author'],
    description: 'Everything on /news.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('posts'),
  defaultSort: '-publishedAt',
  fields: [
    slugField('title'),
    { name: 'title', type: 'text', required: true },
    {
      name: 'publishedAt',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
      defaultValue: () => new Date().toISOString(),
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      admin: { position: 'sidebar' },
      options: [
        { label: 'Competition Update', value: 'competition-update' },
        { label: 'Rover Reveal', value: 'rover-reveal' },
        { label: 'Research Highlight', value: 'research-highlight' },
        { label: 'Outreach', value: 'outreach' },
        { label: 'Team News', value: 'team-news' },
      ],
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'members',
      admin: { position: 'sidebar' },
    },
    { name: 'featuredImage', type: 'upload', relationTo: 'media' },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 300,
      admin: {
        description:
          'The summary on cards and in link previews. Written to stand alone — it is often all anyone reads.',
      },
    },
    { name: 'body', type: 'richText', editor: bodyEditor },
    legacySanityId,
  ],
}

import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * The site-wide announcement bar.
 *
 * A window (`startDate`/`endDate`) plus an on/off switch, because the common
 * case is "run this for the week of the competition" and nobody should have to
 * remember to come back and turn it off.
 */
export const Announcements: CollectionConfig = {
  slug: 'announcements',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'isActive', 'startDate', 'endDate', 'priority'],
    description: 'The strip across the top of every page. Only active, in-window rows show.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('announcements'),
  defaultSort: 'priority',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: { description: 'Internal label so you can tell rows apart. Never shown on the site.' },
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 160,
      admin: { description: 'What visitors read. One short sentence — it has to fit on a phone.' },
    },
    {
      name: 'link',
      type: 'text',
      admin: { description: 'Optional. Makes the bar clickable.' },
    },
    {
      name: 'linkLabel',
      type: 'text',
      admin: {
        description: 'The call to action, e.g. "Apply Now", "See Results".',
        condition: (_, siblingData) => Boolean(siblingData?.link),
      },
    },
    {
      name: 'startDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Leave empty to start immediately.',
      },
    },
    {
      name: 'endDate',
      type: 'date',
      admin: {
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Leave empty to run until switched off by hand.',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 10,
      admin: { position: 'sidebar', description: 'Lower numbers are shown first.' },
    },
    legacySanityId,
  ],
}

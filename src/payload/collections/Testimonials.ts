import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * An advisor testimonial.
 *
 * Nothing appears on the site until `featured` is ticked — the carousel on the
 * Home and About pages reads only featured rows. That is deliberate: a
 * testimonial is somebody else's words about the team, and it should not go
 * public the moment it is typed in.
 */
export const Testimonials: CollectionConfig = {
  slug: 'testimonials',
  admin: {
    group: 'Team',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'organization', 'featured', 'order'],
    description: 'Only featured testimonials are shown on the site.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('testimonials'),
  defaultSort: 'order',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Advisor Name' },
    {
      type: 'row',
      fields: [
        {
          name: 'role',
          type: 'text',
          label: 'Role / Title',
          admin: { placeholder: 'e.g. Faculty Advisor, Dept. of CSE', width: '50%' },
        },
        {
          name: 'organization',
          type: 'text',
          admin: { placeholder: 'e.g. BRAC University', width: '50%' },
        },
      ],
    },
    {
      name: 'quote',
      type: 'textarea',
      required: true,
      maxLength: 600,
      admin: { description: 'Keep it punchy — one to three sentences.' },
    },
    {
      name: 'photo',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'A square-ish headshot reads best.' },
    },
    {
      name: 'link',
      type: 'text',
      label: 'Profile Link',
      admin: { description: 'LinkedIn, faculty page or personal site. Makes the name clickable.' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Off means invisible. Tick to publish it to Home and About.',
      },
    },
    {
      name: 'order',
      type: 'number',
      label: 'Display Order',
      admin: { position: 'sidebar', description: 'Lower shows first. Ties fall back to name.' },
    },
    legacySanityId,
  ],
}

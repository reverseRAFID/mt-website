import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A sponsor or partner.
 *
 * Two logos, not one: a wordmark that reads on white and one that reads on
 * black. The site has a dark mode, and a single logo is always wrong in one of
 * them.
 */
export const Sponsors: CollectionConfig = {
  slug: 'sponsors',
  admin: {
    group: 'Content',
    useAsTitle: 'name',
    defaultColumns: ['name', 'tier', 'isActive', 'startYear'],
    description: 'Shown on /sponsors and in the strip across the site.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('sponsors'),
  defaultSort: 'tier',
  fields: [
    { name: 'name', type: 'text', required: true, label: 'Company Name' },
    {
      name: 'tier',
      type: 'select',
      required: true,
      label: 'Sponsorship Tier',
      options: [
        { label: '🏆 Title', value: 'title' },
        { label: '🥇 Gold', value: 'gold' },
        { label: '🥈 Silver', value: 'silver' },
        { label: '🥉 Bronze', value: 'bronze' },
        { label: '📦 In-Kind', value: 'in-kind' },
      ],
    },
    {
      name: 'logoLight',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo for Light Theme',
      admin: { description: 'The dark-mark version, which reads on white backgrounds.' },
    },
    {
      name: 'logoDark',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo for Dark Theme',
      admin: { description: 'The light-mark version, which reads on dark backgrounds.' },
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Legacy Logo',
      admin: {
        description: 'Fallback for older entries. Prefer the two theme-specific logos above.',
        condition: (data) => Boolean(data?.logo),
      },
    },
    { name: 'website', type: 'text', label: 'Website URL' },
    { name: 'startYear', type: 'number', label: 'Partnership Start Year' },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Currently Active',
      admin: { position: 'sidebar' },
    },
    legacySanityId,
  ],
}

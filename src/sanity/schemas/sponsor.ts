import { defineField, defineType } from 'sanity'

export const sponsor = defineType({
  name: 'sponsor',
  title: 'Sponsor',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Company Name', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'logoLight',
      title: 'Logo for Light Theme',
      type: 'image',
      options: { hotspot: true },
      description: 'Use the dark-mark version that reads well on white backgrounds.',
    }),
    defineField({
      name: 'logoDark',
      title: 'Logo for Dark Theme',
      type: 'image',
      options: { hotspot: true },
      description: 'Use the light-mark version that reads well on dark backgrounds.',
    }),
    defineField({
      name: 'logo',
      title: 'Legacy Logo',
      type: 'image',
      options: { hotspot: true },
      description: 'Fallback for older entries. Prefer uploading both theme-specific logos above.',
      hidden: () => true,
    }),
    defineField({ name: 'website', title: 'Website URL', type: 'url' }),
    defineField({
      name: 'tier',
      title: 'Sponsorship Tier',
      type: 'string',
      options: {
        list: [
          { title: '🏆 Title', value: 'title' },
          { title: '🥇 Gold', value: 'gold' },
          { title: '🥈 Silver', value: 'silver' },
          { title: '🥉 Bronze', value: 'bronze' },
          { title: '📦 In-Kind', value: 'in-kind' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'isActive', title: 'Currently Active', type: 'boolean', initialValue: true }),
    defineField({ name: 'startYear', title: 'Partnership Start Year', type: 'number' }),
  ],
  preview: {
    select: { title: 'name', tier: 'tier', media: 'logoDark', active: 'isActive' },
    prepare({ title, tier, media, active }) {
      return {
        title: `${active ? '' : '⏸️ '}${title}`,
        subtitle: tier,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Tier',
      name: 'tierOrder',
      by: [{ field: 'tier', direction: 'asc' }],
    },
  ],
})

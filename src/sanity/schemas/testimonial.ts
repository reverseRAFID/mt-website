import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Advisor Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Advisor Name',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'role',
      title: 'Role / Title',
      type: 'string',
      placeholder: 'e.g. Faculty Advisor, Dept. of CSE',
      description: 'Their title or relationship to the team.',
    }),
    defineField({
      name: 'organization',
      title: 'Organization',
      type: 'string',
      placeholder: 'e.g. BRAC University',
    }),
    defineField({
      name: 'photo',
      title: 'Photo',
      type: 'image',
      options: { hotspot: true },
      description: 'A square-ish headshot reads best.',
    }),
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      rows: 4,
      description: 'What the advisor says about the project. Keep it punchy — 1 to 3 sentences.',
      validation: (R) => R.required().max(600),
    }),
    defineField({
      name: 'link',
      title: 'Profile Link',
      type: 'url',
      description: 'Optional — LinkedIn, faculty page, or personal site. Makes the name clickable.',
      validation: (R) => R.uri({ scheme: ['http', 'https'] }),
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      description: 'Featured testimonials appear in the special section on the Home and About pages.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers show first. Ties fall back to name.',
    }),
  ],
  preview: {
    select: { title: 'name', role: 'role', org: 'organization', media: 'photo', featured: 'featured' },
    prepare({ title, role, org, media, featured }) {
      const subtitle = [role, org].filter(Boolean).join(' · ')
      return {
        title: `${featured ? '★ ' : ''}${title}`,
        subtitle: subtitle || undefined,
        media,
      }
    },
  },
  orderings: [
    {
      title: 'Display Order',
      name: 'displayOrder',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'name', direction: 'asc' },
      ],
    },
  ],
})

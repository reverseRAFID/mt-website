import { defineField, defineType } from 'sanity'

export const sarVideo = defineType({
  name: 'sarVideo',
  title: 'SAR Video',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({
      name: 'competition',
      title: 'Competition',
      type: 'reference',
      to: [{ type: 'competition' }],
      validation: (R) => R.required(),
    }),
    defineField({ name: 'year', title: 'Year', type: 'number', validation: (R) => R.required() }),
    defineField({
      name: 'youtubeUrl',
      title: 'YouTube URL',
      type: 'url',
      validation: (R) => R.required().uri({ scheme: ['https'] }),
    }),
    defineField({ name: 'thumbnail', title: 'Custom Thumbnail (optional)', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'description', title: 'Description', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'title', year: 'year', competition: 'competition.shortName', media: 'thumbnail' },
    prepare({ title, year, competition, media }) {
      return {
        title,
        subtitle: `${competition ?? ''} · ${year}`,
        media,
      }
    },
  },
  orderings: [{ title: 'Year (newest)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
})

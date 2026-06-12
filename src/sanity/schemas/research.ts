import { defineField, defineType, defineArrayMember } from 'sanity'

export const research = defineType({
  name: 'research',
  title: 'Research Paper',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Paper Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (R) => R.required() }),
    defineField({
      name: 'authors',
      title: 'Authors',
      type: 'array',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'member' }] })],
    }),
    defineField({ name: 'year', title: 'Year', type: 'number', validation: (R) => R.required() }),
    defineField({ name: 'abstract', title: 'Abstract', type: 'text', rows: 6, validation: (R) => R.required() }),
    defineField({ name: 'doi', title: 'DOI / URL', type: 'url' }),
    defineField({ name: 'pdfFile', title: 'PDF File', type: 'file', options: { accept: '.pdf' } }),
    defineField({
      name: 'topics',
      title: 'Topic Tags',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
    }),
    defineField({
      name: 'status',
      title: 'Publication Status',
      type: 'string',
      options: {
        list: [
          { title: 'Published', value: 'published' },
          { title: 'Pre-print', value: 'preprint' },
          { title: 'Under Review', value: 'under-review' },
        ],
        layout: 'radio',
      },
      initialValue: 'published',
      validation: (R) => R.required(),
    }),
    defineField({ name: 'conference', title: 'Conference / Journal', type: 'string', placeholder: 'e.g. IEEE ICRAE 2024' }),
    defineField({ name: 'citation', title: 'Citation String', type: 'text', rows: 3 }),
  ],
  preview: {
    select: { title: 'title', year: 'year', status: 'status', conference: 'conference' },
    prepare({ title, year, status, conference }) {
      const statusEmoji: Record<string, string> = { published: '✅', preprint: '📄', 'under-review': '🔄' }
      return {
        title: `${statusEmoji[status] ?? ''} ${title}`,
        subtitle: `${conference ?? ''} · ${year}`,
      }
    },
  },
  orderings: [{ title: 'Year (newest)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
})

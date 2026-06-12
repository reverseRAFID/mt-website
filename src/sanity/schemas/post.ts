import { defineField, defineType, defineArrayMember } from 'sanity'

export const post = defineType({
  name: 'post',
  title: 'Blog Post / News',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'title' }, validation: (R) => R.required() }),
    defineField({ name: 'publishedAt', title: 'Published At', type: 'datetime', initialValue: () => new Date().toISOString() }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Competition Update', value: 'competition-update' },
          { title: 'Rover Reveal', value: 'rover-reveal' },
          { title: 'Research Highlight', value: 'research-highlight' },
          { title: 'Outreach', value: 'outreach' },
          { title: 'Team News', value: 'team-news' },
        ],
        layout: 'radio',
      },
      validation: (R) => R.required(),
    }),
    defineField({ name: 'featuredImage', title: 'Featured Image', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'excerpt', title: 'Excerpt', type: 'text', rows: 3, validation: (R) => R.required().max(300) }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
              { title: 'Code', value: 'code' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  { name: 'href', type: 'url', title: 'URL' },
                  { name: 'openInNewTab', type: 'boolean', title: 'Open in new tab', initialValue: false },
                ],
              },
            ],
          },
        }),
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [defineField({ name: 'caption', title: 'Caption', type: 'string' })],
        }),
        defineArrayMember({
          type: 'object',
          name: 'youtube',
          title: 'YouTube Embed',
          fields: [defineField({ name: 'url', title: 'YouTube URL', type: 'url', validation: (R) => R.required() })],
          preview: { select: { title: 'url' } },
        }),
      ],
    }),
    defineField({ name: 'author', title: 'Author', type: 'reference', to: [{ type: 'member' }] }),
  ],
  preview: {
    select: { title: 'title', category: 'category', date: 'publishedAt', media: 'featuredImage' },
    prepare({ title, category, date, media }) {
      return {
        title,
        subtitle: `${category ?? 'Uncategorized'} · ${date ? new Date(date).toLocaleDateString() : 'Draft'}`,
        media,
      }
    },
  },
  orderings: [{ title: 'Published (newest)', name: 'publishedDesc', by: [{ field: 'publishedAt', direction: 'desc' }] }],
})

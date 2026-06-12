import { defineField, defineType } from 'sanity'

export const announcement = defineType({
  name: 'announcement',
  title: 'Announcement',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title (internal)',
      type: 'string',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'message',
      title: 'Message',
      type: 'text',
      rows: 2,
      validation: (R) => R.required().max(160),
    }),
    defineField({
      name: 'link',
      title: 'Link URL (optional)',
      type: 'url',
    }),
    defineField({
      name: 'linkLabel',
      title: 'Link Label',
      type: 'string',
      placeholder: 'e.g. "Apply Now", "See Results"',
    }),
    defineField({
      name: 'startDate',
      title: 'Start Date',
      type: 'datetime',
    }),
    defineField({
      name: 'endDate',
      title: 'End Date',
      type: 'datetime',
    }),
    defineField({
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    }),
    defineField({
      name: 'priority',
      title: 'Priority (lower = shown first)',
      type: 'number',
      initialValue: 10,
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'message', active: 'isActive' },
    prepare({ title, subtitle, active }) {
      return { title: `${active ? '✅' : '⏸️'} ${title}`, subtitle }
    },
  },
  orderings: [{ title: 'Priority', name: 'priorityAsc', by: [{ field: 'priority', direction: 'asc' }] }],
})

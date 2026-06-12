import { defineField, defineType, defineArrayMember } from 'sanity'

export const recruitmentConfig = defineType({
  name: 'recruitmentConfig',
  title: 'Recruitment Configuration',
  type: 'document',
  // Singleton — only one document of this type should exist
  fields: [
    defineField({
      name: 'status',
      title: 'Recruitment Status',
      type: 'string',
      options: {
        list: [
          { title: '🟢 Open', value: 'open' },
          { title: '🟡 Under Review', value: 'under-review' },
          { title: '🔴 Closed', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'closed',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'openingMessage',
      title: 'Opening / Closing Message',
      type: 'text',
      rows: 3,
      placeholder: 'e.g. "Applications for Spring 2025 are now open! Apply before March 15."',
    }),
    defineField({
      name: 'closingDate',
      title: 'Application Deadline',
      type: 'datetime',
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { status: 'status' },
    prepare({ status }) {
      return { title: 'Recruitment Configuration', subtitle: `Status: ${status}` }
    },
  },
})

import { defineField, defineType } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import { APPLY_SUBTEAMS } from '../../lib/subteams'

const subteamOptions = APPLY_SUBTEAMS.map((s) => ({ title: s, value: s }))

// Review pipeline states. `new` is set on submission by /api/apply; the rest
// are moved by recruiters inside the Studio.
const REVIEW_STATES = [
  { title: '🔵 New', value: 'new' },
  { title: '⭐ Shortlisted', value: 'shortlisted' },
  { title: '🗣️ Interview', value: 'interview' },
  { title: '🟢 Accepted', value: 'accepted' },
  { title: '🔴 Rejected', value: 'rejected' },
]

// Most fields are applicant-supplied and should not be hand-edited in the
// Studio — only the review `status` and `reviewerNotes` are editable.
const readOnly = true

export const application = defineType({
  name: 'application',
  title: 'Recruitment Application',
  type: 'document',
  fields: [
    defineField({
      name: 'status',
      title: 'Review Status',
      type: 'string',
      options: { list: REVIEW_STATES, layout: 'dropdown' },
      initialValue: 'new',
    }),
    defineField({ name: 'name', title: 'Full Name', type: 'string', readOnly }),
    defineField({ name: 'email', title: 'Email', type: 'string', readOnly }),
    defineField({ name: 'phone', title: 'Phone', type: 'string', readOnly }),
    defineField({ name: 'studentId', title: 'Student ID', type: 'string', readOnly }),
    defineField({ name: 'department', title: 'Department', type: 'string', readOnly }),
    defineField({ name: 'year', title: 'Academic Year', type: 'string', readOnly }),
    defineField({
      name: 'subteam1',
      title: 'First Sub-Team Choice',
      type: 'string',
      options: { list: subteamOptions },
      readOnly,
    }),
    defineField({
      name: 'subteam2',
      title: 'Second Sub-Team Choice',
      type: 'string',
      options: { list: subteamOptions },
      readOnly,
    }),
    defineField({ name: 'whyJoin', title: 'Why do you want to join?', type: 'text', rows: 4, readOnly }),
    defineField({ name: 'experience', title: 'Relevant experience / skills', type: 'text', rows: 3, readOnly }),
    defineField({ name: 'portfolio', title: 'Portfolio / Links', type: 'string', readOnly }),
    defineField({
      name: 'reviewerNotes',
      title: 'Reviewer Notes (internal)',
      type: 'text',
      rows: 3,
      description: 'Internal notes — not visible to the applicant.',
    }),
    defineField({ name: 'submittedAt', title: 'Submitted At', type: 'datetime', readOnly }),
  ],
  preview: {
    select: { title: 'name', subteam: 'subteam1', status: 'status', email: 'email' },
    prepare({ title, subteam, status, email }) {
      const dot = { new: '🔵', shortlisted: '⭐', interview: '🗣️', accepted: '🟢', rejected: '🔴' }[status as string] ?? '🔵'
      return {
        title: `${dot} ${title ?? 'Unnamed applicant'}`,
        subtitle: [subteam, email].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    { title: 'Newest first', name: 'submittedDesc', by: [{ field: 'submittedAt', direction: 'desc' }] },
    { title: 'Oldest first', name: 'submittedAsc', by: [{ field: 'submittedAt', direction: 'asc' }] },
    { title: 'Status', name: 'status', by: [{ field: 'status', direction: 'asc' }] },
  ],
})

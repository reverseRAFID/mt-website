import type { CollectionConfig } from 'payload'

import { APPLY_SUBTEAMS } from '../../lib/subteams'
import { adminOnly, nobody, staff } from '../access'
import { legacySanityId } from '../fields/slug'

/**
 * A recruitment application.
 *
 * ── PRIVATE ───────────────────────────────────────────────────
 * Holds a real name, an email address, a phone number and a student ID. It is
 * unreadable over the API to anyone who is not signed in, and nothing on the
 * public site reads it at all.
 *
 * `create` is `nobody` on purpose. The apply form posts to /api/apply, which
 * validates the payload, checks the recruitment gate, and writes through the
 * Local API — so there is no need for an anonymous write door on the REST API,
 * and every application that exists has been through the validator.
 *
 * Applicant-supplied fields are read-only in the admin UI. Rewriting what
 * somebody submitted destroys the record you are assessing them on; only
 * `status` and `reviewerNotes` are editable.
 */
export const Applications: CollectionConfig = {
  slug: 'applications',
  admin: {
    group: 'Recruitment',
    useAsTitle: 'name',
    defaultColumns: ['name', 'subteam1', 'status', 'submittedAt'],
    description: 'Submissions from /join/apply. Never shown on the website.',
  },
  access: {
    read: staff,
    create: nobody,
    update: staff,
    delete: adminOnly,
  },
  defaultSort: '-submittedAt',
  fields: [
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: 'Review Status',
      options: [
        { label: '🔵 New', value: 'new' },
        { label: '⭐ Shortlisted', value: 'shortlisted' },
        { label: '🗣️ Interview', value: 'interview' },
        { label: '🟢 Accepted', value: 'accepted' },
        { label: '🔴 Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'reviewerNotes',
      type: 'textarea',
      label: 'Reviewer Notes (internal)',
      admin: { position: 'sidebar', description: 'Never visible to the applicant.' },
    },

    // ── Applicant-supplied — read-only ────────────────────────
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', label: 'Full Name', admin: { readOnly: true, width: '50%' } },
        { name: 'email', type: 'text', admin: { readOnly: true, width: '50%' } },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text', admin: { readOnly: true, width: '33%' } },
        { name: 'studentId', type: 'text', admin: { readOnly: true, width: '33%' } },
        { name: 'year', type: 'text', label: 'Academic Year', admin: { readOnly: true, width: '34%' } },
      ],
    },
    { name: 'department', type: 'text', admin: { readOnly: true } },
    {
      type: 'row',
      fields: [
        {
          name: 'subteam1',
          type: 'select',
          options: [...APPLY_SUBTEAMS],
          label: 'First Sub-Team Choice',
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'subteam2',
          type: 'select',
          options: [...APPLY_SUBTEAMS],
          label: 'Second Sub-Team Choice',
          admin: { readOnly: true, width: '50%' },
        },
      ],
    },
    {
      name: 'whyJoin',
      type: 'textarea',
      label: 'Why do you want to join?',
      admin: { readOnly: true },
    },
    {
      name: 'experience',
      type: 'textarea',
      label: 'Relevant experience / skills',
      admin: { readOnly: true },
    },
    { name: 'portfolio', type: 'text', label: 'Portfolio / Links', admin: { readOnly: true } },
    {
      name: 'submittedAt',
      type: 'date',
      admin: { readOnly: true, position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    legacySanityId,
  ],
}

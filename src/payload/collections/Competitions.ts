import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId, slugField, slugify } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

const COMPETITION_ROLES = [
  'Driver',
  'Science Lead',
  'Systems Integrator',
  'Operator',
  'Arm Operator',
  'Autonomy Lead',
  'Team Lead',
  'Support',
]

/**
 * A competition entry — URC 2024, ERC 2025, and so on.
 *
 * Sits between rovers and members: a competition names the rover that was
 * taken and the roster that took it, which is how a member's profile can list
 * "the competitions I went to" and "the rovers I worked on" without either fact
 * being stored on the member.
 */
export const Competitions: CollectionConfig = {
  slug: 'competitions',
  admin: {
    group: 'Rovers & Competitions',
    useAsTitle: 'shortName',
    defaultColumns: ['shortName', 'year', 'rank', 'result', 'location'],
    description: 'Every competition the team has entered, with its result and roster.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('competitions'),
  defaultSort: '-year',
  fields: [
    // Slug is `shortName-year` (e.g. "urc-2024"), not a single source field,
    // so it gets its own generator rather than slugField's default.
    slugField('shortName', {
      hooks: {
        beforeValidate: [
          ({ data, value }) => {
            const typed = typeof value === 'string' ? value.trim() : ''
            if (typed) return slugify(typed)
            const d = data as { shortName?: string; year?: number } | undefined
            return slugify(`${d?.shortName ?? ''}-${d?.year ?? ''}`)
          },
        ],
      },
    }),
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Full Name',
      admin: { placeholder: 'University Rover Challenge' },
    },
    {
      name: 'shortName',
      type: 'text',
      required: true,
      admin: { placeholder: 'URC' },
    },
    { name: 'year', type: 'number', required: true },
    { name: 'location', type: 'text', admin: { placeholder: 'Hanksville, Utah, USA' } },
    {
      type: 'row',
      fields: [
        {
          name: 'result',
          type: 'text',
          label: 'Result Summary',
          admin: { placeholder: 'e.g. 11th Place', width: '50%' },
        },
        { name: 'rank', type: 'number', label: 'Final Rank', admin: { width: '25%' } },
        { name: 'totalTeams', type: 'number', admin: { width: '25%' } },
      ],
    },
    {
      name: 'rover',
      type: 'relationship',
      relationTo: 'rovers',
      label: 'Rover Used',
    },
    {
      name: 'teamMembers',
      type: 'array',
      label: 'Competition Roster',
      admin: { initCollapsed: true },
      fields: [
        { name: 'member', type: 'relationship', relationTo: 'members', required: true },
        {
          name: 'competitionRole',
          type: 'select',
          options: COMPETITION_ROLES,
          label: 'Role at Competition',
        },
      ],
    },
    {
      name: 'sarVideo',
      type: 'text',
      label: 'SAR Video (YouTube URL)',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'Competition Gallery',
    },
    {
      name: 'reportPdf',
      type: 'upload',
      relationTo: 'documents',
      label: 'Post-Competition Report (PDF)',
    },
    legacySanityId,
  ],
}

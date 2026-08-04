import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId, slugField } from '../fields/slug'
import { SUBTEAM_OPTIONS } from '../fields/subteam'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A team member.
 *
 * The most referenced document in the project: rovers list their crew,
 * competitions their roster, research papers their authors, and posts their
 * author. Deleting one leaves dangling references, so relationships pointing
 * here are configured to fail loudly rather than silently blank out.
 */
export const Members: CollectionConfig = {
  slug: 'members',
  admin: {
    group: 'Team',
    useAsTitle: 'name',
    defaultColumns: ['name', 'role', 'subTeam', 'isAlumni', 'isActive'],
    description: 'Everyone who has worked on the team, current and alumni.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('members'),
  defaultSort: 'name',
  fields: [
    slugField('name'),
    {
      type: 'tabs',
      tabs: [
        // ── Profile ───────────────────────────────────────────
        {
          label: 'Profile',
          fields: [
            { name: 'name', type: 'text', required: true, label: 'Full Name' },
            {
              name: 'photo',
              type: 'upload',
              relationTo: 'media',
              admin: { description: 'A square-ish headshot reads best.' },
            },
            {
              name: 'role',
              type: 'text',
              admin: { placeholder: 'e.g. Team Lead, Software Engineer' },
            },
            {
              name: 'tagline',
              type: 'text',
              maxLength: 120,
              admin: {
                description:
                  'One short line under the name, e.g. "Autonomy & perception, building rovers that think."',
              },
            },
            {
              name: 'subTeam',
              type: 'select',
              options: SUBTEAM_OPTIONS,
              admin: { description: 'Drives the badge colour and the filter on /team.' },
            },
            { name: 'yearOfStudy', type: 'text', admin: { placeholder: 'e.g. 3rd Year' } },
            { name: 'joinedYear', type: 'number', label: 'Year Joined the Team' },
            {
              name: 'graduationYear',
              type: 'number',
              validate: (value: unknown, { data }: { data: Record<string, unknown> }) => {
                const joined = data?.joinedYear
                if (typeof value === 'number' && typeof joined === 'number' && value < joined) {
                  return 'Graduation year must be on or after the year joined.'
                }
                return true
              },
            },
            {
              name: 'yearsContributed',
              type: 'number',
              hasMany: true,
              admin: {
                description:
                  'Every year this member was active, e.g. 2021, 2022, 2023. Drives the contribution timeline on their profile.',
              },
            },
            { name: 'isAlumni', type: 'checkbox', defaultValue: false, label: 'Is Alumni?' },
            {
              name: 'currentOrg',
              type: 'text',
              label: 'Current Organization',
              admin: { description: 'Where they work or study now.' },
            },
            {
              name: 'isActive',
              type: 'checkbox',
              defaultValue: true,
              label: 'Currently Active Member',
            },
          ],
        },

        // ── Story & work ──────────────────────────────────────
        {
          label: 'Story & Work',
          fields: [
            {
              name: 'bio',
              type: 'textarea',
              admin: { description: 'A few sentences on who they are and what they do here.' },
            },
            { name: 'quote', type: 'textarea', maxLength: 240, label: 'Personal Quote / Motto' },
            {
              name: 'focusAreas',
              type: 'text',
              hasMany: true,
              admin: {
                description: 'What they specialise in — "Path planning", "PCB design", "Structural FEA".',
              },
            },
            { name: 'skills', type: 'text', hasMany: true, label: 'Skills / Tools' },
            {
              name: 'achievements',
              type: 'array',
              label: 'Key Achievements',
              admin: { initCollapsed: true },
              fields: [
                {
                  name: 'title',
                  type: 'text',
                  required: true,
                  admin: {
                    description: 'The award, role or milestone, e.g. "URC 2023 — 5th Worldwide".',
                  },
                },
                { name: 'year', type: 'number' },
                {
                  name: 'achievement',
                  type: 'text',
                  admin: { description: 'One-line summary of what they achieved.' },
                },
                {
                  name: 'details',
                  type: 'text',
                  hasMany: true,
                  admin: { description: 'Optional bullet points elaborating on it.' },
                },
              ],
            },
            {
              name: 'works',
              type: 'array',
              label: 'Works & Projects',
              admin: {
                initCollapsed: true,
                description: 'Notable projects, repos or publications — a name and a link.',
              },
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'url', type: 'text' },
              ],
            },
          ],
        },

        // ── Links ─────────────────────────────────────────────
        {
          label: 'Links',
          fields: [
            { name: 'linkedin', type: 'text', label: 'LinkedIn URL' },
            { name: 'github', type: 'text', label: 'GitHub URL' },
            { name: 'website', type: 'text', label: 'Personal Website / Portfolio' },
          ],
        },
      ],
    },
    legacySanityId,
  ],
}

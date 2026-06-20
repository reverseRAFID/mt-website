import { defineField, defineType, defineArrayMember } from 'sanity'

export const member = defineType({
  name: 'member',
  title: 'Team Member',
  type: 'document',
  groups: [
    { name: 'profile', title: 'Profile', default: true },
    { name: 'story', title: 'Story & Work' },
    { name: 'links', title: 'Links' },
  ],
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', group: 'profile', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, group: 'profile', validation: (R) => R.required() }),
    defineField({ name: 'photo', title: 'Profile Photo', type: 'image', options: { hotspot: true }, group: 'profile' }),
    defineField({ name: 'role', title: 'Role / Title', type: 'string', placeholder: 'e.g. Team Lead, Software Engineer', group: 'profile' }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'One short line shown under the name. e.g. "Autonomy & perception, building rovers that think."',
      group: 'profile',
      validation: (R) => R.max(120),
    }),
    defineField({
      name: 'subTeam',
      title: 'Sub-Team',
      type: 'string',
      group: 'profile',
      options: {
        // Values must match the keys in SUBTEAM_COLORS in src/components/team/TeamDirectory.tsx,
        // which colour the sub-team badge on the team page.
        list: [
          { title: 'Management', value: 'management' },
          { title: 'Controls', value: 'controls' },
          { title: 'Mechanical', value: 'mechanical' },
          { title: 'Electronics', value: 'electronics' },
          { title: 'Science', value: 'science' },
          { title: 'UAV', value: 'uav' },
          { title: 'Network', value: 'network' },
          { title: 'Autonomous', value: 'autonomous' },
          { title: 'R&D', value: 'rnd' },
        ],
      },
    }),
    defineField({ name: 'yearOfStudy', title: 'Year of Study', type: 'string', placeholder: 'e.g. 3rd Year', group: 'profile' }),
    defineField({ name: 'joinedYear', title: 'Year Joined the Team', type: 'number', group: 'profile' }),
    defineField({
      name: 'graduationYear',
      title: 'Graduation Year',
      type: 'number',
      group: 'profile',
      validation: (R) =>
        R.custom((grad, ctx) => {
          const joined = (ctx.document as { joinedYear?: number } | undefined)?.joinedYear
          if (typeof grad === 'number' && typeof joined === 'number' && grad < joined) {
            return 'Graduation year must be on or after the year joined.'
          }
          return true
        }),
    }),
    defineField({
      name: 'yearsContributed',
      title: 'Years Contributed',
      type: 'array',
      of: [defineArrayMember({ type: 'number' })],
      options: { layout: 'tags', sortable: false },
      description:
        'Every year this member was active on the team, e.g. 2021, 2022, 2023. Drives the contribution timeline on their profile.',
      group: 'profile',
      validation: (R) => R.unique(),
    }),
    defineField({ name: 'isAlumni', title: 'Is Alumni?', type: 'boolean', initialValue: false, group: 'profile' }),
    defineField({ name: 'currentOrg', title: 'Current Organization', type: 'string', description: 'Where they work / study now (shown for alumni and current members).', group: 'profile' }),

    // ── Story & Work ─────────────────────────────────────────
    defineField({
      name: 'bio',
      title: 'Bio / About',
      type: 'text',
      rows: 5,
      description: 'A few sentences about who they are and what they do on the team.',
      group: 'story',
    }),
    defineField({
      name: 'quote',
      title: 'Personal Quote / Motto',
      type: 'text',
      rows: 2,
      group: 'story',
      validation: (R) => R.max(240),
    }),
    defineField({
      name: 'focusAreas',
      title: 'Focus Areas',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      description: 'What they specialise in. e.g. "Path planning", "PCB design", "Structural FEA".',
      group: 'story',
    }),
    defineField({
      name: 'skills',
      title: 'Skills / Tools',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      group: 'story',
    }),
    defineField({
      name: 'achievements',
      title: 'Key Achievements',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'achievement',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', description: 'The award, role or milestone. e.g. "URC 2023 — 5th Worldwide".', validation: (R) => R.required() }),
            defineField({ name: 'year', title: 'Year', type: 'number' }),
            defineField({ name: 'achievement', title: 'Achievement', type: 'string', description: 'One-line summary of what they achieved.' }),
            defineField({
              name: 'details',
              title: 'Details',
              type: 'array',
              of: [defineArrayMember({ type: 'string' })],
              description: 'Optional bullet points elaborating on the achievement.',
            }),
          ],
          preview: {
            select: { title: 'title', year: 'year', subtitle: 'achievement' },
            prepare({ title, year, subtitle }) {
              return { title: year ? `${title} · ${year}` : title, subtitle }
            },
          },
        }),
      ],
      group: 'story',
    }),
    defineField({
      name: 'works',
      title: 'Works & Projects',
      type: 'array',
      description: 'Notable projects, repos or publications — each with a name and a link.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'work',
          fields: [
            defineField({ name: 'name', title: 'Name', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'url', title: 'URL', type: 'url', validation: (R) => R.uri({ scheme: ['http', 'https'] }) }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'url' },
          },
        }),
      ],
      group: 'story',
    }),

    // ── Links ────────────────────────────────────────────────
    defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url', group: 'links' }),
    defineField({ name: 'github', title: 'GitHub URL', type: 'url', group: 'links' }),
    defineField({ name: 'website', title: 'Personal Website / Portfolio', type: 'url', group: 'links' }),
    defineField({ name: 'isActive', title: 'Currently Active Member', type: 'boolean', initialValue: true, group: 'profile' }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'role', media: 'photo', alumni: 'isAlumni' },
    prepare({ title, subtitle, media, alumni }) {
      return {
        title: alumni ? `${title} (Alumni)` : title,
        subtitle,
        media,
      }
    },
  },
  orderings: [
    { title: 'Name A–Z', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] },
    { title: 'Sub-Team', name: 'subTeam', by: [{ field: 'subTeam', direction: 'asc' }] },
  ],
})

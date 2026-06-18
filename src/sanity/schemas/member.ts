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
    defineField({ name: 'graduationYear', title: 'Graduation Year', type: 'number', group: 'profile' }),
    defineField({ name: 'isAlumni', title: 'Is Alumni?', type: 'boolean', initialValue: false, group: 'profile' }),
    defineField({ name: 'currentOrg', title: 'Current Organization (alumni only)', type: 'string', group: 'profile' }),

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
      title: 'Achievements & Milestones',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'achievement',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'year', title: 'Year', type: 'number' }),
            defineField({ name: 'detail', title: 'Detail', type: 'text', rows: 2 }),
          ],
          preview: {
            select: { title: 'title', year: 'year' },
            prepare({ title, year }) {
              return { title, subtitle: year ? String(year) : undefined }
            },
          },
        }),
      ],
      group: 'story',
    }),
    defineField({
      name: 'personalProjects',
      title: 'Works & Projects',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'image', options: { hotspot: true } }),
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

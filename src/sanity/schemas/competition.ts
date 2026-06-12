import { defineField, defineType, defineArrayMember } from 'sanity'

export const competition = defineType({
  name: 'competition',
  title: 'Competition',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', placeholder: 'University Rover Challenge', validation: (R) => R.required() }),
    defineField({ name: 'shortName', title: 'Short Name', type: 'string', placeholder: 'URC', validation: (R) => R.required() }),
    defineField({ name: 'year', title: 'Year', type: 'number', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: (doc) => `${(doc as {shortName?: string}).shortName?.toLowerCase()}-${(doc as {year?: number}).year}` }, validation: (R) => R.required() }),
    defineField({ name: 'location', title: 'Location', type: 'string', placeholder: 'Hanksville, Utah, USA' }),
    defineField({ name: 'result', title: 'Result Summary', type: 'string', placeholder: 'e.g. 11th Place' }),
    defineField({ name: 'rank', title: 'Final Rank', type: 'number' }),
    defineField({ name: 'totalTeams', title: 'Total Teams', type: 'number' }),
    defineField({
      name: 'teamMembers',
      title: 'Competition Roster',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'rosterEntry',
          fields: [
            defineField({ name: 'member', title: 'Member', type: 'reference', to: [{ type: 'member' }], validation: (R) => R.required() }),
            defineField({
              name: 'competitionRole',
              title: 'Role at Competition',
              type: 'string',
              options: {
                list: ['Driver', 'Science Lead', 'Systems Integrator', 'Operator', 'Arm Operator', 'Autonomy Lead', 'Team Lead', 'Support'],
              },
            }),
          ],
          preview: {
            select: { title: 'member.name', subtitle: 'competitionRole' },
          },
        }),
      ],
    }),
    defineField({ name: 'sarVideo', title: 'SAR Video (YouTube URL)', type: 'url' }),
    defineField({ name: 'rover', title: 'Rover Used', type: 'reference', to: [{ type: 'rover' }] }),
    defineField({
      name: 'gallery',
      title: 'Competition Gallery',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
    defineField({ name: 'reportPdf', title: 'Post-Competition Report (PDF)', type: 'file', options: { accept: '.pdf' } }),
  ],
  preview: {
    select: { shortName: 'shortName', year: 'year', rank: 'rank' },
    prepare({ shortName, year, rank }) {
      return {
        title: `${shortName} ${year}`,
        subtitle: rank ? `Rank #${rank}` : 'No result yet',
      }
    },
  },
  orderings: [{ title: 'Year (newest)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
})

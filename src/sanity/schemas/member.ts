import { defineField, defineType, defineArrayMember } from 'sanity'

export const member = defineType({
  name: 'member',
  title: 'Team Member',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (R) => R.required() }),
    defineField({ name: 'photo', title: 'Profile Photo', type: 'image', options: { hotspot: true } }),
    defineField({ name: 'role', title: 'Role / Title', type: 'string', placeholder: 'e.g. Team Lead, Software Engineer' }),
    defineField({
      name: 'subTeam',
      title: 'Sub-Team',
      type: 'string',
      options: {
        list: [
          { title: 'Mechanical', value: 'mechanical' },
          { title: 'Electrical', value: 'electrical' },
          { title: 'Software', value: 'software' },
          { title: 'Science', value: 'science' },
          { title: 'Drone', value: 'drone' },
          { title: 'Outreach', value: 'outreach' },
          { title: 'Management', value: 'management' },
        ],
      },
    }),
    defineField({ name: 'yearOfStudy', title: 'Year of Study', type: 'string', placeholder: 'e.g. 3rd Year' }),
    defineField({ name: 'graduationYear', title: 'Graduation Year', type: 'number' }),
    defineField({ name: 'isAlumni', title: 'Is Alumni?', type: 'boolean', initialValue: false }),
    defineField({ name: 'currentOrg', title: 'Current Organization (alumni only)', type: 'string' }),
    defineField({
      name: 'skills',
      title: 'Skills',
      type: 'array',
      of: [defineArrayMember({ type: 'string' })],
      options: {
        layout: 'tags',
      },
    }),
    defineField({
      name: 'personalProjects',
      title: 'Personal Projects',
      type: 'array',
      of: [
        defineArrayMember({ type: 'block' }),
        defineArrayMember({ type: 'image', options: { hotspot: true } }),
      ],
    }),
    defineField({ name: 'linkedin', title: 'LinkedIn URL', type: 'url' }),
    defineField({ name: 'github', title: 'GitHub URL', type: 'url' }),
    defineField({ name: 'isActive', title: 'Currently Active Member', type: 'boolean', initialValue: true }),
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

import { defineField, defineType, defineArrayMember } from 'sanity'

const portableTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' },
    { title: 'Quote', value: 'blockquote' },
  ],
  marks: {
    decorators: [
      { title: 'Bold', value: 'strong' },
      { title: 'Italic', value: 'em' },
      { title: 'Code', value: 'code' },
    ],
    annotations: [
      {
        name: 'link',
        type: 'object',
        title: 'Link',
        fields: [{ name: 'href', type: 'url', title: 'URL' }],
      },
    ],
  },
})

export const rover = defineType({
  name: 'rover',
  title: 'Rover',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Rover Name', type: 'string', validation: (R) => R.required() }),
    defineField({ name: 'slug', title: 'Slug', type: 'slug', options: { source: 'name' }, validation: (R) => R.required() }),
    defineField({ name: 'year', title: 'Year', type: 'number', validation: (R) => R.required().min(2000).max(2100) }),
    defineField({ name: 'tagline', title: 'Tagline', type: 'string' }),
    defineField({
      name: 'specs',
      title: 'Specifications',
      type: 'object',
      fields: [
        defineField({ name: 'weight', title: 'Weight', type: 'string', placeholder: 'e.g. 45 kg' }),
        defineField({ name: 'dimensions', title: 'Dimensions', type: 'string', placeholder: 'e.g. 120 × 90 × 60 cm' }),
        defineField({ name: 'driveSystem', title: 'Drive System', type: 'string', placeholder: 'e.g. 6-wheel rocker-bogie' }),
        defineField({ name: 'payload', title: 'Payload', type: 'string', placeholder: 'e.g. 5 kg' }),
        defineField({ name: 'dof', title: 'Arm DOF', type: 'number' }),
        defineField({ name: 'autonomy', title: 'Autonomy', type: 'string', placeholder: 'e.g. GPS + Visual Odometry' }),
      ],
    }),
    defineField({ name: 'cadModel', title: '3D Model (.glb)', type: 'file', options: { accept: '.glb' } }),
    defineField({
      name: 'diagrams',
      title: 'Technical Diagrams',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
    defineField({
      name: 'diagramAnnotations',
      title: 'Diagram Annotations',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'annotation',
          fields: [
            defineField({ name: 'label', title: 'Label', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'description', title: 'Description', type: 'text', rows: 2 }),
            defineField({ name: 'xPercent', title: 'X Position (%)', type: 'number', validation: (R) => R.required().min(0).max(100) }),
            defineField({ name: 'yPercent', title: 'Y Position (%)', type: 'number', validation: (R) => R.required().min(0).max(100) }),
          ],
          preview: { select: { title: 'label', subtitle: 'description' } },
        }),
      ],
    }),
    defineField({ name: 'technicalPdf', title: 'Technical PDF', type: 'file', options: { accept: '.pdf' } }),
    defineField({
      name: 'gallery',
      title: 'Photo Gallery',
      type: 'array',
      of: [defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
    defineField({ name: 'competition', title: 'Competition Used In', type: 'reference', to: [{ type: 'competition' }] }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [portableTextBlock, defineArrayMember({ type: 'image', options: { hotspot: true } })],
    }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'year' },
    prepare({ title, subtitle }) {
      return { title, subtitle: String(subtitle) }
    },
  },
  orderings: [{ title: 'Year (newest)', name: 'yearDesc', by: [{ field: 'year', direction: 'desc' }] }],
})

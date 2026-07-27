import { defineField, defineType } from 'sanity'

/**
 * A merch category — Apparel, Accessories, Stationery and so on.
 *
 * A document rather than a hardcoded enum so the team can add a category
 * without a code change and a deploy. The shop grid builds its filter from
 * whatever exists here.
 */
export const productCategory = defineType({
  name: 'productCategory',
  title: 'Product Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Category Name',
      type: 'string',
      placeholder: 'e.g. Apparel',
      validation: (R) => R.required().max(40),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 40 },
      description: 'Used in the /shop filter URL. Changing it breaks existing links.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'string',
      description: 'Optional one-liner shown under the category heading.',
      validation: (R) => R.max(120),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers come first in the filter bar.',
    }),
  ],
  preview: {
    select: { title: 'title', subtitle: 'description' },
  },
  orderings: [
    {
      title: 'Display order',
      name: 'displayOrder',
      by: [
        { field: 'order', direction: 'asc' },
        { field: 'title', direction: 'asc' },
      ],
    },
  ],
})

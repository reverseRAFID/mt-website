import type { CollectionConfig } from 'payload'

import { anyone, staff } from '../access'
import { legacySanityId, slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A merch category — Apparel, Accessories, Stationery.
 *
 * A collection rather than a hardcoded enum so the team can add one without a
 * code change and a deploy. The shop grid builds its filter bar from whatever
 * exists here, minus any category that ended up with no live products.
 */
export const ProductCategories: CollectionConfig = {
  slug: 'product-categories',
  labels: { singular: 'Category', plural: 'Categories' },
  admin: {
    group: 'Shop',
    useAsTitle: 'title',
    defaultColumns: ['title', 'order', 'description'],
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('product-categories'),
  defaultSort: 'order',
  fields: [
    slugField('title', {
      admin: {
        position: 'sidebar',
        description: 'Used in the /shop filter URL. Changing it breaks existing links.',
      },
    }),
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 40,
      label: 'Category Name',
      admin: { placeholder: 'e.g. Apparel' },
    },
    {
      name: 'description',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Optional one-liner under the category heading.' },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Display Order',
      admin: { position: 'sidebar', description: 'Lower numbers come first in the filter bar.' },
    },
    legacySanityId,
  ],
}

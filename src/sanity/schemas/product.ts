import { defineField, defineType, defineArrayMember } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_VARIANT_AXIS_LABEL,
  SINGLE_VARIANT_LABEL,
  formatMoney,
} from '../../lib/shop'

const portableTextBlock = defineArrayMember({
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 3', value: 'h3' },
  ],
  marks: {
    decorators: [
      { title: 'Bold', value: 'strong' },
      { title: 'Italic', value: 'em' },
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

/**
 * One sellable variant — a size, a colourway, or the lone `Standard` row that a
 * one-option product gets.
 *
 * `stock` lives here and nowhere else. A product-level stock field would create
 * two numbers that both claim to be authoritative, and the reservation
 * transaction in src/lib/orders.ts would have to pick one. Keeping inventory on
 * the variant means every product — even a single-size mug — decrements through
 * exactly one code path.
 */
const variant = defineArrayMember({
  type: 'object',
  name: 'variant',
  title: 'Variant',
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      description:
        'What the customer picks, e.g. "M" or "XL". For a product with no options, leave the default "Standard". Two axes can be written as one label, e.g. "M / Black".',
      validation: (R) => R.required().max(40),
    }),
    defineField({
      name: 'sku',
      title: 'SKU',
      type: 'string',
      description: 'Optional internal code. Printed on the invoice when set.',
      validation: (R) => R.max(40),
    }),
    defineField({
      name: 'stock',
      title: 'Stock',
      type: 'number',
      initialValue: 0,
      description:
        'Units on hand. Decremented automatically when an order is placed and returned automatically if that order is cancelled — so edit it only to reflect a real physical recount.',
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'lowStockThreshold',
      title: 'Low-stock Alert At',
      type: 'number',
      initialValue: DEFAULT_LOW_STOCK_THRESHOLD,
      description: 'This variant shows up in Shop → Low Stock at or below this count.',
      validation: (R) => R.integer().min(0),
    }),
    defineField({
      name: 'priceOverride',
      title: 'Price Override (BDT)',
      type: 'number',
      description:
        'Only if this variant costs more than the base price — e.g. XXL priced above M. Leave empty to use the product price.',
      validation: (R) => R.integer().min(0),
    }),
    defineField({
      name: 'isActive',
      title: 'Available',
      type: 'boolean',
      initialValue: true,
      description: 'Turn off to hide this variant without deleting it or losing its stock count.',
    }),
  ],
  preview: {
    select: {
      label: 'label',
      sku: 'sku',
      stock: 'stock',
      price: 'priceOverride',
      isActive: 'isActive',
    },
    prepare({ label, sku, stock, price, isActive }) {
      const count = typeof stock === 'number' ? stock : 0
      const state = !isActive ? '⏸️' : count === 0 ? '⛔' : count <= 3 ? '⚠️' : '✅'
      return {
        title: `${state} ${label ?? 'Unnamed variant'}`,
        subtitle: [
          `${count} in stock`,
          typeof price === 'number' ? formatMoney(price) : null,
          sku,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

/**
 * A merch product.
 *
 * PRICING — `basePrice` and `priceOverride` are whole taka. They are the only
 * authority on what anything costs: the browser never sends a price, and
 * /api/shop/order recomputes every line from this document at order time. See
 * src/lib/cart.ts for why.
 */
export const product = defineType({
  name: 'product',
  title: 'Product',
  type: 'document',
  groups: [
    { name: 'basics', title: 'Basics', default: true },
    { name: 'media', title: 'Images' },
    { name: 'variants', title: 'Variants & Stock' },
    { name: 'details', title: 'Details' },
  ],
  fields: [
    // ── Basics ────────────────────────────────────────────────
    defineField({
      name: 'title',
      title: 'Product Name',
      type: 'string',
      group: 'basics',
      placeholder: 'e.g. Mongol-Tori Team Tee',
      validation: (R) => R.required().max(80),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 80 },
      group: 'basics',
      description: 'The /shop/… URL. Changing it breaks any link already shared.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'reference',
      to: [{ type: 'productCategory' }],
      group: 'basics',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      group: 'basics',
      description: 'One line shown under the name on the product card.',
      validation: (R) => R.max(120),
    }),
    defineField({
      name: 'basePrice',
      title: 'Price (BDT)',
      type: 'number',
      group: 'basics',
      description: 'Whole taka. No decimals — this shop has no minor unit.',
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'compareAtPrice',
      title: 'Compare-at Price (BDT)',
      type: 'number',
      group: 'basics',
      description:
        'Optional. Shown struck through next to the price, so it must be HIGHER than the price to make sense.',
      validation: (R) =>
        R.integer()
          .min(0)
          .custom((compareAt, ctx) => {
            if (typeof compareAt !== 'number') return true
            const base = (ctx.document as { basePrice?: number } | undefined)?.basePrice
            if (typeof base !== 'number') return true
            return compareAt > base
              ? true
              : 'The compare-at price must be higher than the price, or the strikethrough reads as a price increase.'
          }),
    }),
    defineField({
      name: 'isActive',
      title: 'Listed in the shop',
      type: 'boolean',
      initialValue: true,
      group: 'basics',
      description:
        'Turn off to withdraw the product from sale. Existing orders keep their own copy of the details, so nothing in order history changes.',
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      initialValue: false,
      group: 'basics',
      description: 'Featured products lead the shop grid and appear in the homepage teaser.',
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      initialValue: 0,
      group: 'basics',
      description: 'Lower numbers come first within a category.',
    }),

    // ── Images ────────────────────────────────────────────────
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      group: 'media',
      of: [
        defineArrayMember({
          type: 'image',
          options: { hotspot: true },
          fields: [
            defineField({
              name: 'alt',
              title: 'Alt text',
              type: 'string',
              description:
                'Describe the item for screen readers and for when the image fails to load.',
              validation: (R) => R.required().max(120),
            }),
          ],
        }),
      ],
      description: 'The first image is the one used on cards and in the order email.',
      validation: (R) => R.required().min(1).max(8),
    }),

    // ── Variants & stock ──────────────────────────────────────
    defineField({
      name: 'variantAxisLabel',
      title: 'Variant Picker Label',
      type: 'string',
      group: 'variants',
      initialValue: DEFAULT_VARIANT_AXIS_LABEL,
      description: 'What the picker is called on the product page — "Size", "Colour", "Option".',
      validation: (R) => R.max(24),
    }),
    defineField({
      name: 'trackInventory',
      title: 'Track stock',
      type: 'boolean',
      initialValue: true,
      group: 'variants',
      description:
        'On: the shop refuses to oversell and stock counts down with each order. Off: unlimited — use for made-to-order or pre-order items.',
    }),
    defineField({
      name: 'variants',
      title: 'Variants',
      type: 'array',
      group: 'variants',
      of: [variant],
      initialValue: [{ label: SINGLE_VARIANT_LABEL, stock: 0, isActive: true }],
      description:
        'Every product has at least one. A product with no real options keeps the single "Standard" row — that is what holds its stock.',
      validation: (R) =>
        R.required()
          .min(1)
          .custom((variants) => {
            const rows = (variants ?? []) as { label?: string; sku?: string }[]

            // Two variants sharing a label make the picker ambiguous — the
            // customer cannot tell which "M" they chose, and neither can the
            // team packing the parcel.
            const labels = rows.map((v) => v.label?.trim().toLowerCase()).filter(Boolean)
            const dupLabel = labels.find((l, i) => labels.indexOf(l) !== i)
            if (dupLabel) return `Two variants share the label "${dupLabel}". Labels must be unique.`

            const skus = rows.map((v) => v.sku?.trim().toLowerCase()).filter(Boolean)
            const dupSku = skus.find((s, i) => skus.indexOf(s) !== i)
            if (dupSku) return `Two variants share the SKU "${dupSku}". SKUs must be unique.`

            return true
          }),
    }),
    defineField({
      name: 'maxPerOrder',
      title: 'Max per Order',
      type: 'number',
      group: 'variants',
      description:
        'Optional cap for this product specifically, on top of the shop-wide limit. Useful for scarce items.',
      validation: (R) => R.integer().min(1),
    }),

    // ── Details ───────────────────────────────────────────────
    defineField({
      name: 'description',
      title: 'Description',
      type: 'array',
      of: [portableTextBlock],
      group: 'details',
      description: 'The main product copy. Materials, fit, what it is.',
    }),
    defineField({
      name: 'sizeGuide',
      title: 'Size Guide',
      type: 'text',
      rows: 5,
      group: 'details',
      description:
        'Shown in an accordion on the product page. Plain text — one measurement per line reads best.',
    }),
    defineField({
      name: 'careInfo',
      title: 'Care Instructions',
      type: 'text',
      rows: 3,
      group: 'details',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'images.0',
      price: 'basePrice',
      isActive: 'isActive',
      featured: 'featured',
      category: 'category.title',
      variants: 'variants',
      trackInventory: 'trackInventory',
    },
    prepare({ title, media, price, isActive, featured, category, variants, trackInventory }) {
      const rows = (variants ?? []) as { stock?: number; isActive?: boolean }[]
      const stock = rows
        .filter((v) => v.isActive !== false)
        .reduce((sum, v) => sum + (typeof v.stock === 'number' ? v.stock : 0), 0)

      const stockLabel =
        trackInventory === false
          ? 'made to order'
          : stock === 0
            ? 'SOLD OUT'
            : `${stock} in stock`

      return {
        title: `${isActive === false ? '⏸️ ' : ''}${featured ? '⭐ ' : ''}${title ?? 'Untitled product'}`,
        subtitle: [category, typeof price === 'number' ? formatMoney(price) : null, stockLabel]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
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
    {
      title: 'Price — low to high',
      name: 'priceAsc',
      by: [{ field: 'basePrice', direction: 'asc' }],
    },
    {
      title: 'Recently added',
      name: 'createdDesc',
      by: [{ field: '_createdAt', direction: 'desc' }],
    },
  ],
})

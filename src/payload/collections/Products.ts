import type { CollectionConfig } from 'payload'

import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DEFAULT_VARIANT_AXIS_LABEL,
  SINGLE_VARIANT_LABEL,
} from '../../lib/shop'
import { anyone, staff } from '../access'
import { proseEditor } from '../fields/richText'
import { legacySanityId, slugField } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A merch product.
 *
 * ── PRICING ───────────────────────────────────────────────────
 * `basePrice` and `priceOverride` are whole taka and are the only authority on
 * what anything costs. The browser never sends a price: /api/shop/order
 * recomputes every line from this document at order time. See src/lib/cart.ts.
 *
 * ── STOCK ─────────────────────────────────────────────────────
 * `stock` lives on the variant and nowhere else. A product-level stock field
 * would create two numbers that both claim to be authoritative and force the
 * reservation transaction to pick one. Even a single-size mug keeps one
 * `Standard` variant, so every product decrements through exactly one code path.
 *
 * A variant's `id` is what an order records as its `variantKey`, and what the
 * reservation's conditional `$inc` matches on. Deleting a variant row therefore
 * orphans the stock accounting for any order that bought it — switch
 * `isActive` off instead, which is why that field exists.
 */
export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    group: 'Shop',
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'basePrice', 'isActive', 'featured'],
    description: 'The catalogue. Stock lives on each variant and moves by itself as orders come in.',
  },
  access: { read: anyone, create: staff, update: staff, delete: staff },
  hooks: revalidateCollection('products'),
  defaultSort: 'order',
  fields: [
    slugField('title', {
      admin: {
        position: 'sidebar',
        description: 'The /shop/… URL. Changing it breaks any link already shared.',
      },
    }),
    {
      type: 'tabs',
      tabs: [
        // ── Basics ────────────────────────────────────────────
        {
          label: 'Basics',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
              maxLength: 80,
              label: 'Product Name',
              admin: { placeholder: 'e.g. Mongol-Tori Team Tee' },
            },
            {
              name: 'category',
              type: 'relationship',
              relationTo: 'product-categories',
              required: true,
            },
            {
              name: 'tagline',
              type: 'text',
              maxLength: 120,
              admin: { description: 'One line under the name on the product card.' },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'basePrice',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Price (BDT)',
                  admin: { width: '50%', description: 'Whole taka — this shop has no minor unit.' },
                },
                {
                  name: 'compareAtPrice',
                  type: 'number',
                  min: 0,
                  label: 'Compare-at Price (BDT)',
                  admin: {
                    width: '50%',
                    description: 'Optional. Shown struck through, so it must be HIGHER than the price.',
                  },
                  validate: (value: unknown, { data }: { data: Record<string, unknown> }) => {
                    if (typeof value !== 'number') return true
                    const base = data?.basePrice
                    if (typeof base !== 'number') return true
                    return value > base
                      ? true
                      : 'The compare-at price must be higher than the price, or the strikethrough reads as a price increase.'
                  },
                },
              ],
            },
          ],
        },

        // ── Images ────────────────────────────────────────────
        {
          label: 'Images',
          fields: [
            {
              name: 'images',
              type: 'upload',
              relationTo: 'media',
              hasMany: true,
              maxRows: 8,
              admin: {
                description:
                  'The first image is used on cards and in the order email. Strongly recommended — a product card without one shows a placeholder.',
              },
              // NOT required, deliberately.
              //
              // The Sanity schema demanded at least one image, but Sanity does
              // not validate on write and six seeded products went in with none.
              // Enforcing it here meant those six could not be imported at all —
              // the CMS refused to hold data the team already had, which is a
              // worse failure than a product card with a placeholder on it.
              //
              // Both surfaces already degrade properly (ProductCard renders a
              // labelled placeholder, ProductGallery renders "No image"), so the
              // cost of allowing it is visible and small, and the team can fix
              // it by uploading an image rather than by re-running a script.
            },
          ],
        },

        // ── Variants & stock ──────────────────────────────────
        {
          label: 'Variants & Stock',
          fields: [
            {
              name: 'variantAxisLabel',
              type: 'text',
              maxLength: 24,
              defaultValue: DEFAULT_VARIANT_AXIS_LABEL,
              label: 'Variant Picker Label',
              admin: {
                description: 'What the picker is called on the product page — "Size", "Colour", "Option".',
              },
            },
            {
              name: 'trackInventory',
              type: 'checkbox',
              defaultValue: true,
              label: 'Track stock',
              admin: {
                description:
                  'On: the shop refuses to oversell and stock counts down with each order. Off: unlimited — for made-to-order or pre-order items.',
              },
            },
            {
              name: 'variants',
              type: 'array',
              required: true,
              minRows: 1,
              defaultValue: [{ label: SINGLE_VARIANT_LABEL, stock: 0, isActive: true }],
              admin: {
                description:
                  'Every product has at least one. A product with no real options keeps the single "Standard" row — that is what holds its stock.',
              },
              validate: (value: unknown) => {
                const rows = (value ?? []) as { label?: string; sku?: string }[]
                if (!Array.isArray(rows) || rows.length === 0) return 'Add at least one variant.'

                // Two variants sharing a label make the picker ambiguous — the
                // customer cannot tell which "M" they chose, and neither can the
                // person packing the parcel.
                const labels = rows.map((v) => v.label?.trim().toLowerCase()).filter(Boolean)
                const dupLabel = labels.find((l, i) => labels.indexOf(l) !== i)
                if (dupLabel) return `Two variants share the label "${dupLabel}". Labels must be unique.`

                const skus = rows.map((v) => v.sku?.trim().toLowerCase()).filter(Boolean)
                const dupSku = skus.find((s, i) => skus.indexOf(s) !== i)
                if (dupSku) return `Two variants share the SKU "${dupSku}". SKUs must be unique.`

                return true
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'label',
                      type: 'text',
                      required: true,
                      maxLength: 40,
                      admin: {
                        width: '50%',
                        description: 'What the customer picks, e.g. "M". Two axes can be one label: "M / Black".',
                      },
                    },
                    {
                      name: 'sku',
                      type: 'text',
                      maxLength: 40,
                      label: 'SKU',
                      admin: { width: '50%', description: 'Optional. Printed on the invoice when set.' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'stock',
                      type: 'number',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: {
                        width: '33%',
                        description:
                          'Moves by itself as orders are placed and cancelled. Edit only to record a real physical recount.',
                      },
                    },
                    {
                      name: 'lowStockThreshold',
                      type: 'number',
                      min: 0,
                      defaultValue: DEFAULT_LOW_STOCK_THRESHOLD,
                      label: 'Low-stock Alert At',
                      admin: { width: '33%', description: 'Flagged in Shop → Low Stock at or below this.' },
                    },
                    {
                      name: 'priceOverride',
                      type: 'number',
                      min: 0,
                      label: 'Price Override (BDT)',
                      admin: {
                        width: '34%',
                        description: 'Only if this variant costs more than the base price. Empty = product price.',
                      },
                    },
                  ],
                },
                {
                  name: 'isActive',
                  type: 'checkbox',
                  defaultValue: true,
                  label: 'Available',
                  admin: {
                    description:
                      'Turn off to hide this variant without deleting it. Deleting a row orphans the stock accounting of any order that bought it.',
                  },
                },
              ],
            },
            {
              name: 'maxPerOrder',
              type: 'number',
              min: 1,
              label: 'Max per Order',
              admin: {
                description: 'Optional cap for this product on top of the shop-wide limit. For scarce items.',
              },
            },
          ],
        },

        // ── Details ───────────────────────────────────────────
        {
          label: 'Details',
          fields: [
            {
              name: 'description',
              type: 'richText',
              editor: proseEditor,
              admin: { description: 'The main product copy. Materials, fit, what it is.' },
            },
            {
              name: 'sizeGuide',
              type: 'textarea',
              admin: {
                description: 'Shown in an accordion. Plain text — one measurement per line reads best.',
              },
            },
            { name: 'careInfo', type: 'textarea', label: 'Care Instructions' },
          ],
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      label: 'Listed in the shop',
      admin: {
        position: 'sidebar',
        description:
          'Off withdraws it from sale. Existing orders keep their own copy of the details, so order history does not change.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Featured products lead the shop grid and appear in the homepage teaser.',
      },
    },
    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      label: 'Display Order',
      admin: { position: 'sidebar', description: 'Lower numbers come first.' },
    },
    legacySanityId,
  ],
}

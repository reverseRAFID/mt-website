import type { CollectionConfig } from 'payload'

import {
  DELIVERY_METHODS,
  LIMITS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
} from '../../lib/shop'
import { adminOnly, nobody, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { orderEffectsGuarded } from '../hooks/orderEffects'

const statusOptions = ORDER_STATUSES.map((s) => ({ label: ORDER_STATUS_LABELS[s], value: s }))
const paymentStatusOptions = PAYMENT_STATUSES.map((s) => ({
  label: PAYMENT_STATUS_LABELS[s],
  value: s,
}))
const deliveryOptions = DELIVERY_METHODS.map((m) => ({
  label: m === 'campus' ? 'Campus handover (free)' : 'Home delivery',
  value: m,
}))

/**
 * A customer order.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PRIVACY — read before adding a field or writing a read function.
 *
 * This holds more personal data than anything else in the database: a real
 * name, an email address, a mobile number and a home address, all tied to a
 * purchase. None of it may reach a browser.
 *
 * The public surface is the track page, reachable by anyone holding the track
 * ID. It reads through `getOrderByTrackId()` in src/lib/orders.ts, which uses a
 * `select` that NEVER ASKS FOR the street address, postcode, email or full
 * phone number — rather than fetching them and dropping them afterwards.
 *
 * That distinction is the whole lesson of this collection. Masking in React was
 * the original bug: Next serialises fetched data into the page, so a street
 * address nothing rendered was still sitting in the page source. `phoneLast3`
 * exists for exactly this reason — it is computed once, when the order is
 * placed, so the track page can show a recognisable tail without the full
 * number ever being selected.
 *
 * See docs/shop-runbook.md. `npm run check:privacy` enforces it.
 * ─────────────────────────────────────────────────────────────────────────
 *
 * ── What an admin may edit ────────────────────────────────────
 * Only `status`, `paymentStatus`, `cancellationReason`, `adminNotes` and
 * `resendEmail`. Everything else is a frozen record of what the customer
 * submitted and what was invoiced; rewriting it would desynchronise the
 * document from the parcel and the receipt.
 */
export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    group: 'Shop',
    useAsTitle: 'trackId',
    defaultColumns: ['trackId', 'customerName', 'status', 'paymentStatus', 'total', 'placedAt'],
    description:
      'Work the queue oldest-first. Changing the status emails the customer once; cancelling returns the stock.',
  },
  access: {
    read: staff,
    // Orders are created by /api/shop/order, which prices every line from the
    // product documents and reserves stock in a transaction. An anonymous REST
    // create would let someone invent an order at a price of their choosing.
    create: nobody,
    update: staff,
    delete: adminOnly,
  },
  hooks: { afterChange: [orderEffectsGuarded] },
  defaultSort: '-placedAt',
  fields: [
    // ── Fulfilment — the only editable fields ─────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'placed',
      label: 'Order Status',
      options: statusOptions,
      admin: {
        position: 'sidebar',
        description:
          'Changing this emails the customer — once per status, however many times you save. Cancelling returns the reserved stock to inventory.',
        // Cancelled is the one irreversible move: the stock has already gone
        // back and may since have been sold to somebody else, so re-opening the
        // order could silently oversell. Place a new order instead.
        readOnly: false,
      },
    },
    {
      name: 'paymentStatus',
      type: 'select',
      required: true,
      defaultValue: 'unpaid',
      label: 'Payment',
      options: paymentStatusOptions,
      admin: {
        position: 'sidebar',
        description: 'Cash on delivery — mark Paid once the money is actually in hand.',
      },
    },
    {
      name: 'cancellationReason',
      type: 'text',
      maxLength: 200,
      admin: {
        position: 'sidebar',
        description: 'Included in the cancellation email, so write it for the customer to read.',
        condition: (data) => data?.status === 'cancelled',
      },
    },
    {
      name: 'resendEmail',
      type: 'checkbox',
      defaultValue: false,
      label: 'Re-send the confirmation email',
      admin: {
        position: 'sidebar',
        description:
          'Tick and save to send the order confirmation again — use when Email Status shows failed or skipped. Clears itself once sent.',
      },
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: {
        description: 'NEVER PUBLISHED and never emailed. Courier reference, who packed it, anything.',
      },
    },

    {
      type: 'tabs',
      tabs: [
        // ── Customer — admin only, frozen ─────────────────────
        {
          label: 'Customer',
          fields: [
            {
              name: 'customerName',
              type: 'text',
              required: true,
              maxLength: LIMITS.name,
              label: 'Name',
              admin: { readOnly: true },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'customerEmail',
                  type: 'text',
                  required: true,
                  maxLength: LIMITS.email,
                  label: 'Email',
                  admin: {
                    readOnly: true,
                    width: '50%',
                    description: 'NEVER PUBLISHED. Where every order email goes.',
                  },
                },
                {
                  name: 'customerPhone',
                  type: 'text',
                  required: true,
                  maxLength: LIMITS.phone,
                  label: 'Phone',
                  admin: {
                    readOnly: true,
                    width: '50%',
                    description: 'NEVER PUBLISHED — not even partially. See “Phone — last 3”.',
                  },
                },
              ],
            },
            {
              name: 'phoneLast3',
              type: 'text',
              label: 'Phone — last 3 digits',
              admin: {
                readOnly: true,
                description:
                  'Computed once, when the order is placed. The track page shows this so the buyer can confirm the order is theirs — which is what lets the public read avoid selecting customerPhone at all. Masking in React would be too late: the raw value would already have crossed into the page.',
              },
            },
          ],
        },

        // ── Delivery — admin only, frozen ─────────────────────
        {
          label: 'Delivery',
          fields: [
            {
              name: 'deliveryMethod',
              type: 'select',
              required: true,
              label: 'Method',
              options: deliveryOptions,
              admin: { readOnly: true },
            },
            {
              name: 'deliveryAddress',
              type: 'group',
              label: 'Delivery Address',
              admin: {
                description: 'NEVER PUBLISHED. Home delivery only — empty for campus handover.',
                condition: (data) => data?.deliveryMethod === 'standard',
              },
              fields: [
                { name: 'line1', type: 'text', label: 'Address Line 1', admin: { readOnly: true } },
                { name: 'line2', type: 'text', label: 'Address Line 2', admin: { readOnly: true } },
                { name: 'area', type: 'text', label: 'Area / Thana', admin: { readOnly: true } },
                { name: 'city', type: 'text', label: 'City / District', admin: { readOnly: true } },
                { name: 'postcode', type: 'text', admin: { readOnly: true } },
              ],
            },
            {
              name: 'campusDetails',
              type: 'group',
              label: 'Campus Handover',
              admin: { condition: (data) => data?.deliveryMethod === 'campus' },
              fields: [
                { name: 'handoverPoint', type: 'text', admin: { readOnly: true } },
                { name: 'bracuId', type: 'text', label: 'BRACU ID', admin: { readOnly: true } },
              ],
            },
            {
              name: 'customerNote',
              type: 'textarea',
              maxLength: LIMITS.note,
              admin: {
                readOnly: true,
                description: 'Anything they typed at checkout — landmarks, timing, sizing worries.',
              },
            },
          ],
        },

        // ── Items & totals — frozen ───────────────────────────
        {
          label: 'Items & Totals',
          fields: [
            {
              name: 'items',
              type: 'array',
              required: true,
              minRows: 1,
              admin: {
                readOnly: true,
                initCollapsed: true,
                description:
                  'A snapshot taken when the order was placed. Renaming, repricing or deleting a product never changes what is recorded here.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    { name: 'productTitle', type: 'text', label: 'Product', admin: { width: '50%' } },
                    { name: 'variantLabel', type: 'text', label: 'Variant', admin: { width: '25%' } },
                    { name: 'sku', type: 'text', label: 'SKU', admin: { width: '25%' } },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    { name: 'quantity', type: 'number', label: 'Qty', admin: { width: '33%' } },
                    { name: 'unitPrice', type: 'number', label: 'Unit Price (BDT)', admin: { width: '33%' } },
                    { name: 'lineTotal', type: 'number', label: 'Line Total (BDT)', admin: { width: '34%' } },
                  ],
                },
                // Raw ids kept as plain strings so they survive the product
                // being deleted — the invoice must stay readable either way.
                { name: 'productId', type: 'text', label: 'Product ID' },
                { name: 'variantKey', type: 'text', label: 'Variant Key' },
                { name: 'productSlug', type: 'text' },
                { name: 'imageUrl', type: 'text' },
                {
                  name: 'stockTaken',
                  type: 'checkbox',
                  label: 'Stock Was Deducted',
                  admin: {
                    description:
                      'Whether this line came off the shelf when the order was placed. Recorded per line because a cancellation must return exactly what was taken — if inventory tracking is switched on or off in between, asking the product what it does NOW would either strand the units or invent stock that never existed.',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'subtotal',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Subtotal (BDT)',
                  admin: { readOnly: true, width: '33%' },
                },
                {
                  name: 'deliveryFee',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Delivery Fee (BDT)',
                  admin: { readOnly: true, width: '33%', description: 'Always 0 for campus handover.' },
                },
                {
                  name: 'total',
                  type: 'number',
                  required: true,
                  min: 0,
                  label: 'Total (BDT)',
                  admin: {
                    readOnly: true,
                    width: '34%',
                    description: 'What the customer pays on delivery. It has been invoiced.',
                  },
                  validate: (value: unknown, { data }: { data: Record<string, unknown> }) => {
                    const sub = data?.subtotal
                    const fee = data?.deliveryFee
                    if (typeof sub !== 'number' || typeof fee !== 'number') return true
                    return value === sub + fee
                      ? true
                      : `Total must equal subtotal + delivery fee (${sub} + ${fee}).`
                  },
                },
              ],
            },
          ],
        },

        // ── System — machine-written ──────────────────────────
        {
          label: 'System',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'trackId',
                  type: 'text',
                  required: true,
                  unique: true,
                  index: true,
                  maxLength: LIMITS.trackId,
                  label: 'Track ID',
                  admin: {
                    readOnly: true,
                    width: '50%',
                    description: 'What the customer types into /shop/track.',
                  },
                },
                {
                  name: 'placedAt',
                  type: 'date',
                  required: true,
                  admin: {
                    readOnly: true,
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                  },
                },
              ],
            },
            {
              name: 'paymentMethod',
              type: 'text',
              defaultValue: 'cod',
              admin: { readOnly: true },
            },
            {
              name: 'statusHistory',
              type: 'array',
              admin: {
                readOnly: true,
                initCollapsed: true,
                description: 'Appended automatically each time the status changes.',
              },
              fields: [
                { name: 'status', type: 'text' },
                { name: 'at', type: 'date', admin: { date: { pickerAppearance: 'dayAndTime' } } },
                { name: 'note', type: 'text' },
              ],
            },
            {
              name: 'notifiedStatuses',
              type: 'text',
              hasMany: true,
              label: 'Statuses Already Emailed',
              admin: {
                readOnly: true,
                description:
                  'Guarantees one email per status. Saving the order five times cannot send five emails.',
              },
            },
            {
              name: 'emailStatus',
              type: 'select',
              label: 'Confirmation Email',
              options: [
                { label: '✅ Sent', value: 'sent' },
                { label: '⚠️ Failed — needs a re-send', value: 'failed' },
                { label: '➖ Skipped — email not configured', value: 'skipped' },
              ],
              admin: {
                readOnly: true,
                description: 'If this is not “Sent”, tick “Re-send the confirmation email”.',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'stockReserved',
                  type: 'checkbox',
                  defaultValue: true,
                  admin: {
                    readOnly: true,
                    width: '50%',
                    description: 'True once the order has taken its units out of inventory.',
                  },
                },
                {
                  name: 'stockRestoredAt',
                  type: 'date',
                  admin: {
                    readOnly: true,
                    width: '50%',
                    date: { pickerAppearance: 'dayAndTime' },
                    description:
                      'Set when a cancellation put the units back. Its presence is what stops a repeated hook restoring the same stock twice.',
                  },
                },
              ],
            },
            {
              name: 'idempotencyKey',
              type: 'text',
              unique: true,
              index: true,
              maxLength: LIMITS.idempotencyKey,
              admin: {
                readOnly: true,
                description:
                  'Sent by the checkout form. Stops a double-click or a retried request creating two orders.',
              },
            },
            legacySanityId,
          ],
        },
      ],
    },
  ],
}

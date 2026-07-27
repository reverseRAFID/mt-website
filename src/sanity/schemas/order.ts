import { defineField, defineType, defineArrayMember } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import {
  DELIVERY_METHODS,
  LIMITS,
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  formatMoney,
} from '../../lib/shop'

const statusOptions = ORDER_STATUSES.map((s) => ({ title: ORDER_STATUS_LABELS[s], value: s }))
const paymentStatusOptions = PAYMENT_STATUSES.map((s) => ({
  title: PAYMENT_STATUS_LABELS[s],
  value: s,
}))
const deliveryOptions = DELIVERY_METHODS.map((m) => ({
  title: m === 'campus' ? 'Campus handover (free)' : 'Home delivery',
  value: m,
}))

// Customer-supplied and system-computed fields are never hand-edited. Rewriting
// what someone submitted destroys the record the parcel and the invoice were
// built from — same convention as the `donation` and `application` schemas.
const readOnly = true

/** One purchased line — a frozen copy, not a live view of the product. */
const orderItem = defineArrayMember({
  type: 'object',
  name: 'orderItem',
  title: 'Item',
  readOnly,
  fields: [
    defineField({ name: 'productTitle', title: 'Product', type: 'string' }),
    defineField({ name: 'variantLabel', title: 'Variant', type: 'string' }),
    defineField({ name: 'sku', title: 'SKU', type: 'string' }),
    defineField({ name: 'quantity', title: 'Qty', type: 'number' }),
    defineField({ name: 'unitPrice', title: 'Unit Price (BDT)', type: 'number' }),
    defineField({ name: 'lineTotal', title: 'Line Total (BDT)', type: 'number' }),
    // Raw ids, kept as plain strings so they survive the product being deleted.
    defineField({ name: 'productId', title: 'Product ID', type: 'string' }),
    defineField({ name: 'variantKey', title: 'Variant Key', type: 'string' }),
    defineField({
      name: 'stockTaken',
      title: 'Stock Was Deducted',
      type: 'boolean',
      description:
        'Whether this line actually came off the shelf when the order was placed. Recorded per line because a cancellation must return exactly what was taken — if inventory tracking is switched on or off in between, asking the product what it does *now* would either strand the units or invent stock that never existed.',
    }),
    defineField({ name: 'productSlug', title: 'Product Slug', type: 'string' }),
    defineField({ name: 'imageUrl', title: 'Image URL', type: 'url' }),
    defineField({
      name: 'product',
      title: 'Product (link)',
      type: 'reference',
      to: [{ type: 'product' }],
      // Weak on purpose: a strong reference would make Sanity refuse to delete
      // a discontinued product while any order still mentions it. The snapshot
      // fields above are what the invoice was built from; this link is a
      // convenience for jumping to the product in the Studio.
      weak: true,
    }),
  ],
  preview: {
    select: {
      title: 'productTitle',
      variant: 'variantLabel',
      qty: 'quantity',
      unit: 'unitPrice',
      total: 'lineTotal',
    },
    prepare({ title, variant, qty, unit, total }) {
      return {
        title: `${qty ?? '?'} × ${title ?? 'Unknown product'}${variant ? ` (${variant})` : ''}`,
        subtitle: [
          typeof unit === 'number' ? `${formatMoney(unit)} each` : null,
          typeof total === 'number' ? `= ${formatMoney(total)}` : null,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

/** Automatic audit trail — written by /api/shop/webhook, never by hand. */
const statusEvent = defineArrayMember({
  type: 'object',
  name: 'statusEvent',
  title: 'Status Change',
  readOnly,
  fields: [
    defineField({ name: 'status', title: 'Status', type: 'string' }),
    defineField({ name: 'at', title: 'At', type: 'datetime' }),
    defineField({ name: 'note', title: 'Note', type: 'string' }),
  ],
  preview: {
    select: { status: 'status', at: 'at', note: 'note' },
    prepare({ status, at, note }) {
      return {
        title: ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status,
        subtitle: [at ? new Date(at as string).toLocaleString('en-GB') : null, note]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

/**
 * A customer order.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PRIVACY — read before adding a field or writing a GROQ projection.
 *
 * This document holds more personal data than anything else in the dataset: a
 * real name, an email address, a mobile number and a home address, all tied to
 * a purchase. None of it may appear in a projection that reaches a browser.
 *
 * The public surface is the track page, and it reads through
 * `getOrderByTrackId()` in src/lib/orders.ts, which masks the phone to its last
 * three digits and reduces the address to area and city. The street line, house
 * number, postcode, email and full phone number never leave the dataset.
 *
 * This only holds because the dataset is private. Run `npm run check:privacy`.
 * See docs/shop-runbook.md.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const order = defineType({
  name: 'order',
  title: 'Order',
  type: 'document',
  groups: [
    { name: 'fulfilment', title: 'Fulfilment', default: true },
    { name: 'customer', title: 'Customer' },
    { name: 'delivery', title: 'Delivery' },
    { name: 'items', title: 'Items & Totals' },
    { name: 'system', title: 'System' },
  ],
  fields: [
    // ── Fulfilment — the only fields an admin edits ───────────
    defineField({
      name: 'status',
      title: 'Order Status',
      type: 'string',
      group: 'fulfilment',
      options: { list: statusOptions, layout: 'radio' },
      initialValue: 'placed',
      description:
        'Changing this emails the customer — once per status, however many times you save. Cancelling returns the reserved stock to inventory.',
      // Cancelled is the one irreversible move: the stock has already gone back
      // to inventory and may since have been sold to somebody else, so
      // re-opening the order could silently oversell. Locking the field is a
      // cheap way to make that unreachable by accident. Place a new order
      // instead. (See ORDER_STATUS_TRANSITIONS in src/lib/shop.ts.)
      readOnly: ({ document }) => document?.status === 'cancelled',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'paymentStatus',
      title: 'Payment',
      type: 'string',
      group: 'fulfilment',
      options: { list: paymentStatusOptions, layout: 'radio' },
      initialValue: 'unpaid',
      description: 'Cash on delivery — mark Paid once the money is actually in hand.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'cancellationReason',
      title: 'Cancellation Reason',
      type: 'string',
      group: 'fulfilment',
      description:
        'Included in the cancellation email the customer receives, so write it for them to read.',
      hidden: ({ document }) => document?.status !== 'cancelled',
      validation: (R) => R.max(200),
    }),
    defineField({
      name: 'adminNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      group: 'fulfilment',
      description: 'NEVER PUBLISHED and never emailed. Courier reference, who packed it, anything.',
    }),
    defineField({
      name: 'resendEmail',
      title: 'Re-send the confirmation email',
      type: 'boolean',
      group: 'fulfilment',
      initialValue: false,
      description:
        'Tick and save to send the order confirmation again — use when Email Status below shows failed or skipped. Clears itself once sent.',
    }),

    // ── Customer — ADMIN ONLY ─────────────────────────────────
    defineField({
      name: 'customerName',
      title: 'Name',
      type: 'string',
      group: 'customer',
      readOnly,
      validation: (R) => R.required().max(LIMITS.name),
    }),
    defineField({
      name: 'customerEmail',
      title: 'Email',
      type: 'string',
      group: 'customer',
      description: 'NEVER PUBLISHED. Where every order email goes.',
      readOnly,
      validation: (R) => R.required().max(LIMITS.email),
    }),
    defineField({
      name: 'customerPhone',
      title: 'Phone',
      type: 'string',
      group: 'customer',
      description: 'NEVER PUBLISHED in full — the track page shows the last 3 digits only.',
      readOnly,
      validation: (R) => R.required().max(LIMITS.phone),
    }),

    // ── Delivery — ADMIN ONLY ─────────────────────────────────
    defineField({
      name: 'deliveryMethod',
      title: 'Method',
      type: 'string',
      group: 'delivery',
      options: { list: deliveryOptions, layout: 'radio' },
      readOnly,
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'deliveryAddress',
      title: 'Delivery Address',
      type: 'object',
      group: 'delivery',
      readOnly,
      description: 'NEVER PUBLISHED. Home delivery only — empty for campus handover.',
      hidden: ({ document }) => document?.deliveryMethod !== 'standard',
      fields: [
        defineField({ name: 'line1', title: 'Address Line 1', type: 'string' }),
        defineField({ name: 'line2', title: 'Address Line 2', type: 'string' }),
        defineField({ name: 'area', title: 'Area / Thana', type: 'string' }),
        defineField({ name: 'city', title: 'City / District', type: 'string' }),
        defineField({ name: 'postcode', title: 'Postcode', type: 'string' }),
      ],
    }),
    defineField({
      name: 'campusDetails',
      title: 'Campus Handover',
      type: 'object',
      group: 'delivery',
      readOnly,
      hidden: ({ document }) => document?.deliveryMethod !== 'campus',
      fields: [
        defineField({ name: 'handoverPoint', title: 'Handover Point', type: 'string' }),
        defineField({ name: 'bracuId', title: 'BRACU ID', type: 'string' }),
      ],
    }),
    defineField({
      name: 'customerNote',
      title: 'Customer Note',
      type: 'text',
      rows: 3,
      group: 'delivery',
      description: 'Anything they typed at checkout — landmarks, timing, sizing worries.',
      readOnly,
      validation: (R) => R.max(LIMITS.note),
    }),

    // ── Items & totals — ADMIN ONLY, frozen ───────────────────
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      group: 'items',
      of: [orderItem],
      readOnly,
      description:
        'A snapshot taken when the order was placed. Renaming, repricing or deleting a product never changes what is recorded here.',
      validation: (R) => R.required().min(1),
    }),
    defineField({
      name: 'subtotal',
      title: 'Subtotal (BDT)',
      type: 'number',
      group: 'items',
      readOnly,
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'deliveryFee',
      title: 'Delivery Fee (BDT)',
      type: 'number',
      group: 'items',
      readOnly,
      description: 'Always 0 for campus handover.',
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'total',
      title: 'Total (BDT)',
      type: 'number',
      group: 'items',
      readOnly,
      description: 'What the customer pays on delivery. Editing is disabled — it has been invoiced.',
      validation: (R) =>
        R.required()
          .integer()
          .min(0)
          .custom((total, ctx) => {
            const doc = ctx.document as { subtotal?: number; deliveryFee?: number } | undefined
            if (typeof doc?.subtotal !== 'number' || typeof doc?.deliveryFee !== 'number') return true
            return total === doc.subtotal + doc.deliveryFee
              ? true
              : `Total must equal subtotal + delivery fee (${doc.subtotal} + ${doc.deliveryFee}).`
          }),
    }),

    // ── System — ADMIN ONLY, machine-written ──────────────────
    defineField({
      name: 'trackId',
      title: 'Track ID',
      type: 'string',
      group: 'system',
      readOnly,
      description: 'What the customer types into /shop/track. Also the order reference on the phone.',
      validation: (R) => R.required().max(LIMITS.trackId),
    }),
    defineField({
      name: 'placedAt',
      title: 'Placed At',
      type: 'datetime',
      group: 'system',
      readOnly,
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'paymentMethod',
      title: 'Payment Method',
      type: 'string',
      group: 'system',
      readOnly,
      initialValue: 'cod',
    }),
    defineField({
      name: 'statusHistory',
      title: 'Status History',
      type: 'array',
      group: 'system',
      of: [statusEvent],
      readOnly,
      description: 'Appended automatically each time the status changes.',
    }),
    defineField({
      name: 'notifiedStatuses',
      title: 'Statuses Already Emailed',
      type: 'array',
      group: 'system',
      of: [defineArrayMember({ type: 'string' })],
      readOnly,
      description:
        'Guarantees one email per status. Saving the order five times cannot send five emails.',
    }),
    defineField({
      name: 'emailStatus',
      title: 'Confirmation Email',
      type: 'string',
      group: 'system',
      readOnly,
      options: {
        list: [
          { title: '✅ Sent', value: 'sent' },
          { title: '⚠️ Failed — needs a re-send', value: 'failed' },
          { title: '➖ Skipped — email not configured', value: 'skipped' },
        ],
      },
      description: 'If this is not "Sent", tick "Re-send the confirmation email" above.',
    }),
    defineField({
      name: 'stockReserved',
      title: 'Stock Reserved',
      type: 'boolean',
      group: 'system',
      readOnly,
      initialValue: true,
      description: 'True once the order has taken its units out of inventory.',
    }),
    defineField({
      name: 'stockRestoredAt',
      title: 'Stock Restored At',
      type: 'datetime',
      group: 'system',
      readOnly,
      description:
        'Set when a cancellation put the units back. Its presence is what stops a repeated webhook restoring the same stock twice.',
    }),
    defineField({
      name: 'idempotencyKey',
      title: 'Idempotency Key',
      type: 'string',
      group: 'system',
      readOnly,
      description:
        'Sent by the checkout form. Stops a double-click or a retried request from creating two orders.',
      validation: (R) => R.max(LIMITS.idempotencyKey),
    }),
  ],
  preview: {
    select: {
      trackId: 'trackId',
      name: 'customerName',
      status: 'status',
      total: 'total',
      method: 'deliveryMethod',
      at: 'placedAt',
      payment: 'paymentStatus',
    },
    prepare({ trackId, name, status, total, method, at, payment }) {
      const dot = ORDER_STATUS_LABELS[status as keyof typeof ORDER_STATUS_LABELS] ?? status
      const when = at ? new Date(at as string).toLocaleDateString('en-GB') : null
      return {
        // The Studio is an admin-only surface, so showing the money here is fine.
        title: `${dot?.split(' ')[0] ?? ''} ${trackId ?? 'No track ID'} — ${name ?? 'Unnamed'}`,
        subtitle: [
          typeof total === 'number' ? formatMoney(total) : null,
          payment === 'paid' ? 'paid' : 'COD',
          method === 'campus' ? 'campus' : 'home',
          when,
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Newest first',
      name: 'placedDesc',
      by: [{ field: 'placedAt', direction: 'desc' }],
    },
    {
      title: 'Oldest first (work the queue)',
      name: 'placedAsc',
      by: [{ field: 'placedAt', direction: 'asc' }],
    },
    {
      title: 'Largest first',
      name: 'totalDesc',
      by: [{ field: 'total', direction: 'desc' }],
    },
  ],
})

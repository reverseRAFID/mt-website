import { defineField, defineType, defineArrayMember } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import {
  DEFAULT_ESTIMATED_DELIVERY,
  DEFAULT_MAX_ITEMS_PER_ORDER,
  DEFAULT_MAX_QTY_PER_ITEM,
  DEFAULT_MIN_ORDER_VALUE,
  DEFAULT_ORDER_PREFIX,
  DEFAULT_STANDARD_DELIVERY_FEE,
  formatMoney,
} from '../../lib/shop'

/**
 * Shop-wide settings.
 *
 * Singleton — exactly one document, at the fixed id `shop-config`
 * (see sanity.config.ts). Every field here is read server-side at order time;
 * nothing the browser posts can override any of it.
 */
export const shopConfig = defineType({
  name: 'shopConfig',
  title: 'Shop Configuration',
  type: 'document',
  groups: [
    { name: 'gate', title: 'Open / Closed', default: true },
    { name: 'delivery', title: 'Delivery' },
    { name: 'limits', title: 'Order Limits' },
    { name: 'contact', title: 'Contact & Notifications' },
    { name: 'policies', title: 'Policies' },
  ],
  fields: [
    // ── Gate ──────────────────────────────────────────────────
    defineField({
      name: 'status',
      title: 'Shop Status',
      type: 'string',
      group: 'gate',
      options: {
        list: [
          { title: '🟢 Open — taking orders', value: 'open' },
          { title: '🟡 Paused — products visible, checkout closed', value: 'paused' },
          { title: '🔴 Closed — shop hidden', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'closed',
      description:
        'Enforced server-side by /api/shop/order — a paused or closed shop rejects orders even if someone posts to the endpoint directly.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'closedMessage',
      title: 'Paused / Closed Message',
      type: 'text',
      rows: 3,
      group: 'gate',
      description: 'Shown in place of the checkout button. Say when you expect to reopen.',
      placeholder: 'Restocking — new drop coming after the competition.',
    }),
    defineField({
      name: 'announcement',
      title: 'Shop Announcement',
      type: 'string',
      group: 'gate',
      description: 'Optional banner across the shop pages. Leave empty to hide it.',
      validation: (R) => R.max(160),
    }),

    // ── Delivery ──────────────────────────────────────────────
    defineField({
      name: 'standardDeliveryFee',
      title: 'Home Delivery Fee (BDT)',
      type: 'number',
      group: 'delivery',
      initialValue: DEFAULT_STANDARD_DELIVERY_FEE,
      description:
        'Flat courier charge added to home-delivery orders. Whole taka. Campus handover is always free and is not configurable.',
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'campusDeliveryEnabled',
      title: 'Offer free BRACU campus handover',
      type: 'boolean',
      group: 'delivery',
      initialValue: true,
      description: 'Turn off during holidays when nobody is on campus to hand parcels over.',
    }),
    defineField({
      name: 'campusHandoverPoints',
      title: 'Campus Handover Points',
      type: 'array',
      group: 'delivery',
      of: [defineArrayMember({ type: 'string' })],
      initialValue: ['UB Ground Floor', 'Robotics Lab'],
      description:
        'The pick-up spots offered at checkout. Leave empty and the customer types their own.',
      hidden: ({ document }) => document?.campusDeliveryEnabled === false,
    }),
    defineField({
      name: 'requireBracuEmailForCampus',
      title: 'Restrict campus handover to BRACU email addresses',
      type: 'boolean',
      group: 'delivery',
      initialValue: false,
      description:
        'OFF by design — free handover is open to anyone. Turn ON only if free delivery starts being abused: it then requires a @bracu.ac.bd or @g.bracu.ac.bd contact address, enforced server-side. Note this also locks out alumni and guests.',
      hidden: ({ document }) => document?.campusDeliveryEnabled === false,
    }),
    defineField({
      name: 'estimatedDeliveryDays',
      title: 'Estimated Delivery Window',
      type: 'string',
      group: 'delivery',
      initialValue: DEFAULT_ESTIMATED_DELIVERY,
      description: 'Free text shown at checkout and in the confirmation email.',
      validation: (R) => R.max(60),
    }),

    // ── Limits ────────────────────────────────────────────────
    defineField({
      name: 'minOrderValue',
      title: 'Minimum Order Value (BDT)',
      type: 'number',
      group: 'limits',
      initialValue: DEFAULT_MIN_ORDER_VALUE,
      description: 'Order subtotal, before delivery. 0 means no minimum.',
      validation: (R) => R.required().integer().min(0),
    }),
    defineField({
      name: 'maxQtyPerItem',
      title: 'Max Quantity per Item',
      type: 'number',
      group: 'limits',
      initialValue: DEFAULT_MAX_QTY_PER_ITEM,
      description: 'Stops one person clearing out a size in a single order.',
      validation: (R) => R.required().integer().min(1).max(99),
    }),
    defineField({
      name: 'maxItemsPerOrder',
      title: 'Max Items per Order',
      type: 'number',
      group: 'limits',
      initialValue: DEFAULT_MAX_ITEMS_PER_ORDER,
      description: 'Total units across the whole cart.',
      validation: (R) => R.required().integer().min(1).max(500),
    }),
    defineField({
      name: 'orderPrefix',
      title: 'Track ID Prefix',
      type: 'string',
      group: 'limits',
      initialValue: DEFAULT_ORDER_PREFIX,
      description:
        'Leads every track ID, e.g. "MT" gives MT-7K4QX2ZP. Letters and digits only. Changing it does not rewrite IDs already issued — old ones keep working.',
      validation: (R) =>
        R.required().custom((value) =>
          typeof value === 'string' && /^[A-Z][A-Z0-9]{0,5}$/.test(value)
            ? true
            : 'Use 1–6 characters — letters and digits only, starting with a letter, e.g. "MT".'
        ),
    }),

    // ── Contact ───────────────────────────────────────────────
    defineField({
      name: 'supportEmail',
      title: 'Support Email',
      type: 'string',
      group: 'contact',
      description: 'Published — shown to customers as the reply-to for order questions.',
      validation: (R) => R.email(),
    }),
    defineField({
      name: 'supportPhone',
      title: 'Support Phone',
      type: 'string',
      group: 'contact',
      description: 'Published — shown on the order confirmation.',
      validation: (R) => R.max(30),
    }),
    defineField({
      name: 'adminNotifyEmails',
      title: 'Notify These Addresses of New Orders',
      type: 'array',
      group: 'contact',
      of: [defineArrayMember({ type: 'string', validation: (R) => R.email() })],
      description:
        'NEVER PUBLISHED. Team inboxes that get an alert each time an order comes in. Leave empty to disable alerts.',
    }),

    // ── Policies ──────────────────────────────────────────────
    defineField({
      name: 'shippingPolicy',
      title: 'Shipping Policy',
      type: 'text',
      rows: 4,
      group: 'policies',
      description: 'Shown in an accordion on every product page and at checkout.',
    }),
    defineField({
      name: 'returnPolicy',
      title: 'Return Policy',
      type: 'text',
      rows: 4,
      group: 'policies',
      description: 'Be explicit about what can be returned and by when — it prevents disputes.',
    }),
  ],
  preview: {
    select: { status: 'status', fee: 'standardDeliveryFee', campus: 'campusDeliveryEnabled' },
    prepare({ status, fee, campus }) {
      const dot = { open: '🟢', paused: '🟡', closed: '🔴' }[status as string] ?? '🔴'
      return {
        title: `${dot} Shop — ${status ?? 'closed'}`,
        subtitle: [
          typeof fee === 'number' ? `Home ${formatMoney(fee)}` : null,
          campus === false ? 'campus handover off' : 'campus handover free',
        ]
          .filter(Boolean)
          .join(' · '),
      }
    },
  },
})

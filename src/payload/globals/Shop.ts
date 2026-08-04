import type { GlobalConfig } from 'payload'

import {
  EMAIL_RE,
  DEFAULT_ESTIMATED_DELIVERY,
  DEFAULT_MAX_ITEMS_PER_ORDER,
  DEFAULT_MAX_QTY_PER_ITEM,
  DEFAULT_MIN_ORDER_VALUE,
  DEFAULT_ORDER_PREFIX,
  DEFAULT_STANDARD_DELIVERY_FEE,
} from '../../lib/shop'
import { anyone, staff, staffFieldOnly } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * Shop-wide settings.
 *
 * Every field here is read server-side at order time; nothing the browser posts
 * can override any of it.
 *
 * ── One private field ─────────────────────────────────────────
 * `adminNotifyEmails` is the team's inboxes and must never be published. Sanity
 * handled that by having two queries — a public projection and an
 * `_INTERNAL_QUERY` — so a page physically could not select it.
 *
 * Payload gets both halves of that protection:
 *
 *   1. Field-level `read` access below, which stops the REST API returning it
 *      to anyone who is not signed in.
 *   2. `select` in src/lib/cms/shop.ts, which stops it being fetched into a
 *      page at all.
 *
 * (2) is the one that matters most, and it is not redundant: the site reads
 * through the Local API, which runs with `overrideAccess: true` and therefore
 * ignores (1) entirely. Fetching a field is enough to publish it — Next
 * serialises fetched data into the RSC flight payload whether or not anything
 * renders it. See docs/privacy-runbook.md.
 */
export const Shop: GlobalConfig = {
  slug: 'shop',
  label: 'Shop Settings',
  admin: {
    group: 'Settings',
    description: 'The shop gate, delivery, order limits and policies.',
  },
  access: { read: anyone, update: staff },
  hooks: revalidateGlobal('shop'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Open / Closed',
          fields: [
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'closed',
              label: 'Shop Status',
              options: [
                { label: '🟢 Open — taking orders', value: 'open' },
                { label: '🟡 Paused — products visible, checkout closed', value: 'paused' },
                { label: '🔴 Closed — shop hidden', value: 'closed' },
              ],
              admin: {
                description:
                  'Enforced server-side by /api/shop/order — a paused or closed shop rejects orders even when posted to directly.',
              },
            },
            {
              name: 'closedMessage',
              type: 'textarea',
              label: 'Paused / Closed Message',
              admin: {
                description: 'Shown in place of the checkout button. Say when you expect to reopen.',
                placeholder: 'Restocking — new drop coming after the competition.',
              },
            },
            {
              name: 'announcement',
              type: 'text',
              maxLength: 160,
              label: 'Shop Announcement',
              admin: { description: 'Optional banner across the shop pages. Empty hides it.' },
            },
          ],
        },
        {
          label: 'Delivery',
          fields: [
            {
              name: 'standardDeliveryFee',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: DEFAULT_STANDARD_DELIVERY_FEE,
              label: 'Home Delivery Fee (BDT)',
              admin: {
                description:
                  'Flat courier charge on home-delivery orders. Campus handover is always free and is not configurable.',
              },
            },
            {
              name: 'campusDeliveryEnabled',
              type: 'checkbox',
              defaultValue: true,
              label: 'Offer free BRACU campus handover',
              admin: { description: 'Turn off during holidays when nobody is on campus.' },
            },
            {
              name: 'campusHandoverPoints',
              type: 'text',
              hasMany: true,
              defaultValue: ['UB Ground Floor', 'Robotics Lab'],
              label: 'Campus Handover Points',
              admin: {
                description: 'The pick-up spots offered at checkout. Empty lets the customer type their own.',
                condition: (data) => data?.campusDeliveryEnabled !== false,
              },
            },
            {
              name: 'requireBracuEmailForCampus',
              type: 'checkbox',
              defaultValue: false,
              label: 'Restrict campus handover to BRACU email addresses',
              admin: {
                description:
                  'OFF by design — free handover is open to anyone. Turn ON only if it starts being abused: it then requires a @bracu.ac.bd address, enforced server-side, and locks out alumni and guests.',
                condition: (data) => data?.campusDeliveryEnabled !== false,
              },
            },
            {
              name: 'estimatedDeliveryDays',
              type: 'text',
              maxLength: 60,
              defaultValue: DEFAULT_ESTIMATED_DELIVERY,
              label: 'Estimated Delivery Window',
              admin: { description: 'Free text shown at checkout and in the confirmation email.' },
            },
          ],
        },
        {
          label: 'Order Limits',
          fields: [
            {
              name: 'minOrderValue',
              type: 'number',
              required: true,
              min: 0,
              defaultValue: DEFAULT_MIN_ORDER_VALUE,
              label: 'Minimum Order Value (BDT)',
              admin: { description: 'Subtotal before delivery. 0 means no minimum.' },
            },
            {
              name: 'maxQtyPerItem',
              type: 'number',
              required: true,
              min: 1,
              max: 99,
              defaultValue: DEFAULT_MAX_QTY_PER_ITEM,
              label: 'Max Quantity per Item',
              admin: { description: 'Stops one person clearing out a size in a single order.' },
            },
            {
              name: 'maxItemsPerOrder',
              type: 'number',
              required: true,
              min: 1,
              max: 500,
              defaultValue: DEFAULT_MAX_ITEMS_PER_ORDER,
              label: 'Max Items per Order',
              admin: { description: 'Total units across the whole cart.' },
            },
            {
              name: 'orderPrefix',
              type: 'text',
              required: true,
              defaultValue: DEFAULT_ORDER_PREFIX,
              label: 'Track ID Prefix',
              admin: {
                description:
                  'Leads every track ID, e.g. "MT" gives MT-7K4QX2ZP. Changing it does not rewrite IDs already issued — old ones keep working.',
              },
              validate: (value: unknown) =>
                typeof value === 'string' && /^[A-Z][A-Z0-9]{0,5}$/.test(value)
                  ? true
                  : 'Use 1–6 characters — letters and digits only, starting with a letter, e.g. "MT".',
            },
          ],
        },
        {
          label: 'Contact & Notifications',
          fields: [
            {
              name: 'supportEmail',
              type: 'email',
              admin: { description: 'PUBLISHED — the reply-to shown to customers for order questions.' },
            },
            {
              name: 'supportPhone',
              type: 'text',
              maxLength: 30,
              admin: { description: 'PUBLISHED — shown on the order confirmation.' },
            },
            {
              name: 'adminNotifyEmails',
              // `text` + hasMany rather than `email` + hasMany: Payload's email
              // field is single-value only. The format check is done here instead.
              type: 'text',
              hasMany: true,
              label: 'Notify These Addresses of New Orders',
              validate: (value: unknown) => {
                const rows = Array.isArray(value) ? value : []
                const bad = rows.find((e) => typeof e !== 'string' || !EMAIL_RE.test(e))
                return bad === undefined ? true : `"${String(bad)}" is not a valid email address.`
              },
              // Not readable over the API by anyone who is not staff. The site's
              // own reads bypass this (Local API, overrideAccess), which is why
              // src/lib/cms/shop.ts additionally never selects the field for a
              // page. Both halves are needed; see the note at the top.
              access: { read: staffFieldOnly },
              admin: {
                description:
                  'NEVER PUBLISHED. Team inboxes alerted on each new order. Leave empty to disable alerts.',
              },
            },
          ],
        },
        {
          label: 'Policies',
          fields: [
            {
              name: 'shippingPolicy',
              type: 'textarea',
              admin: { description: 'Shown in an accordion on every product page and at checkout.' },
            },
            {
              name: 'returnPolicy',
              type: 'textarea',
              admin: {
                description: 'Be explicit about what can be returned and by when — it prevents disputes.',
              },
            },
          ],
        },
      ],
    },
  ],
}

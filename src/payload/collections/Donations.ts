import type { CollectionConfig } from 'payload'

import { LIMITS, PAYMENT_METHODS } from '../../lib/crowdfunding'
import { adminOnly, nobody, staff } from '../access'
import { legacySanityId } from '../fields/slug'
import { revalidateCollection } from '../hooks/revalidate'

/**
 * A donor's payment declaration.
 *
 * ── PRIVATE, AND PARTIALLY PUBLISHED ──────────────────────────
 * This is the subtlest document in the project. The collection is unreadable
 * over the API to anyone not signed in, but a *derived* view of it — the
 * supporters roll on /support — is public. What makes that safe is two rules
 * that must survive any future edit:
 *
 *  1. `amount` is NEVER published. It determines the donor's position on the
 *     roll and nothing else: the read layer sorts by it inside MongoDB and does
 *     not select it, so rank falls out of array position and the figure itself
 *     never leaves the server. Publishing a rank tells you somebody gave more
 *     than the person below them. Publishing the amount tells the whole campus
 *     what a named student could afford.
 *
 *  2. An anonymous donor's real name is NEVER published. `donorName` is always
 *     recorded — payments have to be matched against a bank statement — but the
 *     read layer substitutes "Anonymous" before anything is returned, so the
 *     real name exists only in a local variable in a server module.
 *
 * Everything in the Verification group is admin-facing. `senderAccount`,
 * `transactionId`, `contactEmail`, `contactPhone`, `adminNotes`,
 * `rejectionReason` and `verifiedBy` are never published in any form.
 * `npm run check:privacy` enforces this.
 *
 * See docs/crowdfunding-plan.md §2 and docs/privacy-runbook.md.
 */
export const Donations: CollectionConfig = {
  slug: 'donations',
  admin: {
    group: 'Crowdfunding',
    useAsTitle: 'donorName',
    defaultColumns: ['donorName', 'status', 'amount', 'paymentMethod', 'donatedAt'],
    description:
      'The verification queue. A donation is invisible on the site until it is approved, and its amount is never shown at all.',
  },
  access: {
    read: staff,
    // The donate form posts to /api/donate, which rate-limits, runs the spam
    // traps, checks the campaign gate and writes through the Local API. An
    // anonymous REST create would bypass every one of those.
    create: nobody,
    update: staff,
    delete: adminOnly,
  },
  hooks: revalidateCollection('donations'),
  defaultSort: '-donatedAt',
  fields: [
    // ── Verification — internal ───────────────────────────────
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: 'Verification Status',
      options: [
        { label: '⏳ Pending Verification', value: 'pending' },
        { label: '✅ Approved', value: 'approved' },
        { label: '⛔ Rejected', value: 'rejected' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'amount',
      type: 'number',
      min: 0,
      label: 'Verified Amount (BDT)',
      admin: {
        position: 'sidebar',
        description:
          'NEVER PUBLISHED. Sets this donor’s position on the public roll — the roll shows the rank, never the figure. Required to approve.',
      },
      validate: (value: unknown, { data }: { data: Record<string, unknown> }) => {
        if (data?.status !== 'approved') return true
        if (typeof value !== 'number' || Number.isNaN(value)) {
          return 'Enter the verified amount before approving — it determines the public rank.'
        }
        return value > 0 ? true : 'The verified amount must be greater than zero.'
      },
    },
    {
      name: 'approvedAt',
      type: 'date',
      label: 'Verified At',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayAndTime' },
        description: 'Shown publicly as the verified date, and breaks ties between equal amounts.',
      },
      validate: (value: unknown, { data }: { data: Record<string, unknown> }) =>
        data?.status === 'approved' && !value
          ? 'Set the verification date before approving.'
          : true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'verifiedBy',
          type: 'text',
          label: 'Verified By',
          admin: { width: '50%', description: 'Who checked the statement. Internal only.' },
        },
        {
          name: 'rejectionReason',
          type: 'text',
          admin: {
            width: '50%',
            description: 'Never shown publicly. Use it when replying to the donor by hand.',
            condition: (data) => data?.status === 'rejected',
          },
        },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Internal Notes',
      admin: { description: 'Never shown publicly.' },
    },

    // ── Donor declaration — read-only ─────────────────────────
    {
      type: 'row',
      fields: [
        {
          name: 'paymentMethod',
          type: 'select',
          options: [...PAYMENT_METHODS],
          label: 'Channel Used',
          admin: { readOnly: true, width: '50%' },
        },
        {
          name: 'donatedAt',
          type: 'date',
          label: 'Declared At',
          admin: { readOnly: true, width: '50%', date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'senderAccount',
          type: 'text',
          label: 'Sent From (account number)',
          admin: {
            readOnly: true,
            width: '50%',
            description: 'NEVER PUBLISHED. Match this against the statement.',
          },
        },
        {
          name: 'transactionId',
          type: 'text',
          index: true,
          admin: {
            readOnly: true,
            width: '50%',
            description: 'NEVER PUBLISHED. The fastest way to confirm a transfer.',
          },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'contactEmail',
          type: 'text',
          admin: { readOnly: true, width: '50%', description: 'NEVER PUBLISHED.' },
        },
        {
          name: 'contactPhone',
          type: 'text',
          admin: { readOnly: true, width: '50%', description: 'NEVER PUBLISHED.' },
        },
      ],
    },

    // ── Public listing ────────────────────────────────────────
    {
      name: 'donorName',
      type: 'text',
      maxLength: LIMITS.name,
      admin: {
        readOnly: true,
        description:
          'Always recorded so payments can be matched. Replaced by “Anonymous” in the public roll when the donor asked to stay anonymous — the real name is never sent to a browser.',
      },
    },
    {
      name: 'isAnonymous',
      type: 'checkbox',
      defaultValue: false,
      label: 'List as Anonymous',
      admin: { readOnly: true, description: 'The donor’s choice.' },
    },
    {
      name: 'affiliation',
      type: 'text',
      maxLength: LIMITS.affiliation,
      admin: {
        readOnly: true,
        description: 'e.g. “BRACU CSE ’22”. Suppressed publicly when anonymous.',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      maxLength: LIMITS.message,
      label: 'Public Message',
      admin: {
        description: 'Shown on the supporters roll. Editable — trim anything unsuitable before approving.',
      },
    },
    legacySanityId,
  ],
}

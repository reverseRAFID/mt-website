import { defineField, defineType } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import { PAYMENT_METHODS, LIMITS } from '../../lib/crowdfunding'

const methodOptions = PAYMENT_METHODS.map((m) => ({ title: m, value: m }))

const REVIEW_STATES = [
  { title: '⏳ Pending Verification', value: 'pending' },
  { title: '✅ Approved', value: 'approved' },
  { title: '⛔ Rejected', value: 'rejected' },
]

// Donor-supplied fields are a declaration of what someone says they sent. They
// are never hand-edited during verification — rewriting them would destroy the
// audit trail we match against the bank statement. Same convention as the
// `application` schema.
const readOnly = true

/**
 * A donor's payment declaration.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * PRIVACY — read before adding a field.
 *
 * Every field in the "Verification (internal)" group is admin-only and MUST
 * NOT appear in any GROQ projection that reaches a browser. In particular
 * `amount` determines the public rank ordering but is never itself published:
 * APPROVED_DONATIONS_QUERY sorts by it inside Sanity and returns rows without
 * it, so rank falls out of array position. `donorName` is likewise withheld
 * for anonymous donors — the query substitutes "Anonymous" via GROQ select(),
 * so the real name never leaves the dataset.
 *
 * This only holds because the dataset is private. See docs/crowdfunding-plan.md §2.
 * ─────────────────────────────────────────────────────────────────────────
 */
export const donation = defineType({
  name: 'donation',
  title: 'Donation',
  type: 'document',
  groups: [
    { name: 'review', title: 'Verification (internal)', default: true },
    { name: 'declaration', title: 'Donor Declaration' },
    { name: 'listing', title: 'Public Listing' },
  ],
  fields: [
    // ── Verification — ADMIN ONLY ─────────────────────────────
    defineField({
      name: 'status',
      title: 'Verification Status',
      type: 'string',
      group: 'review',
      options: { list: REVIEW_STATES, layout: 'radio' },
      initialValue: 'pending',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'amount',
      title: 'Verified Amount (BDT)',
      type: 'number',
      group: 'review',
      description:
        'NEVER PUBLISHED. Sets this donor’s position on the public supporters roll — the roll shows the rank, never the figure. Required to approve.',
      validation: (R) =>
        R.min(0).custom((amount, ctx) => {
          const status = (ctx.document as { status?: string } | undefined)?.status
          if (status !== 'approved') return true
          if (typeof amount !== 'number' || Number.isNaN(amount)) {
            return 'Enter the verified amount before approving — it determines the public rank.'
          }
          if (amount <= 0) return 'The verified amount must be greater than zero.'
          return true
        }),
    }),
    defineField({
      name: 'approvedAt',
      title: 'Verified At',
      type: 'datetime',
      group: 'review',
      description:
        'Shown publicly as the "verified" date, and breaks ties between equal amounts (earlier wins). Required to approve.',
      validation: (R) =>
        R.custom((approvedAt, ctx) => {
          const status = (ctx.document as { status?: string } | undefined)?.status
          if (status === 'approved' && !approvedAt) {
            return 'Set the verification date before approving.'
          }
          return true
        }),
    }),
    defineField({
      name: 'verifiedBy',
      title: 'Verified By',
      type: 'string',
      group: 'review',
      description: 'Who checked the statement. Internal only.',
    }),
    defineField({
      name: 'adminNotes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      group: 'review',
      description: 'Never shown publicly.',
    }),
    defineField({
      name: 'rejectionReason',
      title: 'Rejection Reason',
      type: 'string',
      group: 'review',
      description: 'Never shown publicly. Use it when replying to the donor by hand.',
      hidden: ({ document }) => document?.status !== 'rejected',
    }),

    // ── Donor declaration — ADMIN ONLY, read-only ─────────────
    defineField({
      name: 'paymentMethod',
      title: 'Channel Used',
      type: 'string',
      group: 'declaration',
      options: { list: methodOptions },
      readOnly,
    }),
    defineField({
      name: 'senderAccount',
      title: 'Sent From (account number)',
      type: 'string',
      group: 'declaration',
      description: 'NEVER PUBLISHED. Match this against the statement.',
      readOnly,
    }),
    defineField({
      name: 'transactionId',
      title: 'Transaction ID',
      type: 'string',
      group: 'declaration',
      description: 'NEVER PUBLISHED. Optional — but the fastest way to confirm a transfer.',
      readOnly,
    }),
    defineField({
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
      group: 'declaration',
      description: 'NEVER PUBLISHED. Optional — for the thank-you and for chasing mismatches.',
      readOnly,
    }),
    defineField({
      name: 'contactPhone',
      title: 'Contact Phone',
      type: 'string',
      group: 'declaration',
      description: 'NEVER PUBLISHED.',
      readOnly,
    }),
    defineField({
      name: 'donatedAt',
      title: 'Declared At',
      type: 'datetime',
      group: 'declaration',
      description: 'When the donor filed this declaration.',
      readOnly,
    }),

    // ── Public listing ────────────────────────────────────────
    defineField({
      name: 'donorName',
      title: 'Donor Name',
      type: 'string',
      group: 'listing',
      description:
        'Always recorded so payments can be matched. Replaced by “Anonymous” in the public roll when the donor asked to stay anonymous.',
      readOnly,
      validation: (R) => R.max(LIMITS.name),
    }),
    defineField({
      name: 'isAnonymous',
      title: 'List as Anonymous',
      type: 'boolean',
      group: 'listing',
      initialValue: false,
      description: 'The donor’s choice. When on, the real name is never sent to a browser.',
      readOnly,
    }),
    defineField({
      name: 'affiliation',
      title: 'Affiliation',
      type: 'string',
      group: 'listing',
      description: 'e.g. “BRACU CSE ’22”. Suppressed publicly when anonymous.',
      readOnly,
      validation: (R) => R.max(LIMITS.affiliation),
    }),
    defineField({
      name: 'message',
      title: 'Public Message',
      type: 'text',
      rows: 2,
      group: 'listing',
      description:
        'Shown on the supporters roll. Editable — trim anything unsuitable before approving.',
      validation: (R) => R.max(LIMITS.message),
    }),
  ],
  preview: {
    select: {
      name: 'donorName',
      anon: 'isAnonymous',
      status: 'status',
      amount: 'amount',
      method: 'paymentMethod',
      at: 'donatedAt',
    },
    prepare({ name, anon, status, amount, method, at }) {
      const dot = { pending: '⏳', approved: '✅', rejected: '⛔' }[status as string] ?? '⏳'
      const when = at ? new Date(at as string).toLocaleDateString('en-GB') : null
      // The amount is shown here because the Studio is admin-only surface.
      const money = typeof amount === 'number' ? `৳${amount.toLocaleString('en-BD')}` : 'unverified'
      return {
        title: `${dot} ${name ?? 'Unnamed donor'}${anon ? ' (anonymous)' : ''}`,
        subtitle: [money, method, when].filter(Boolean).join(' · '),
      }
    },
  },
  orderings: [
    {
      title: 'Newest declarations first',
      name: 'declaredDesc',
      by: [{ field: 'donatedAt', direction: 'desc' }],
    },
    {
      title: 'Rank order (amount desc)',
      name: 'amountDesc',
      by: [
        { field: 'amount', direction: 'desc' },
        { field: 'approvedAt', direction: 'asc' },
      ],
    },
  ],
})

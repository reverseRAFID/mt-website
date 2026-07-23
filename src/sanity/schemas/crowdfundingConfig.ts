import { defineField, defineType, defineArrayMember } from 'sanity'
// Relative import (not the @/ alias) so the schema resolves under both the
// Next bundler and the Sanity CLI.
import { PAYMENT_METHODS, ACCOUNT_TYPES, DEFAULT_VERIFICATION_HOURS } from '../../lib/crowdfunding'

const methodOptions = PAYMENT_METHODS.map((m) => ({ title: m, value: m }))
const accountTypeOptions = ACCOUNT_TYPES.map((t) => ({ title: t, value: t }))

/** Bank-only fields are noise on a mobile-wallet row. */
const bankOnly = ({ parent }: { parent?: { method?: string } }) => parent?.method !== 'Bank Transfer'

export const crowdfundingConfig = defineType({
  name: 'crowdfundingConfig',
  title: 'Crowdfunding Configuration',
  type: 'document',
  // Singleton — only one document of this type should exist, at the fixed id
  // `crowdfunding-config` (see sanity.config.ts).
  groups: [
    { name: 'campaign', title: 'Campaign', default: true },
    { name: 'channels', title: 'Payment Channels' },
    { name: 'content', title: 'Page Content' },
  ],
  fields: [
    // ── Campaign gate ─────────────────────────────────────────
    defineField({
      name: 'status',
      title: 'Campaign Status',
      type: 'string',
      group: 'campaign',
      options: {
        list: [
          { title: '🟢 Open — accepting declarations', value: 'open' },
          { title: '🟡 Paused — roll visible, form closed', value: 'paused' },
          { title: '🔴 Closed — campaign over', value: 'closed' },
        ],
        layout: 'radio',
      },
      initialValue: 'closed',
      description:
        'Enforced server-side by /api/donate — a closed campaign rejects submissions even if someone posts to the endpoint directly.',
      validation: (R) => R.required(),
    }),
    defineField({
      name: 'headline',
      title: 'Campaign Headline',
      type: 'string',
      group: 'campaign',
      placeholder: 'Help us get Mongol-Tori to Utah',
    }),
    defineField({
      name: 'pitch',
      title: 'Campaign Pitch',
      type: 'text',
      rows: 4,
      group: 'campaign',
      description: 'Why the team needs support. Shown under the page hero.',
    }),
    defineField({
      name: 'closedMessage',
      title: 'Paused / Closed Message',
      type: 'text',
      rows: 3,
      group: 'campaign',
      description: 'Shown in place of the form when the campaign is not open.',
      placeholder: 'We are not collecting donations right now — thank you to everyone who chipped in!',
    }),
    defineField({
      name: 'verificationHours',
      title: 'Verification Turnaround (hours)',
      type: 'number',
      group: 'campaign',
      initialValue: DEFAULT_VERIFICATION_HOURS,
      description: 'Sets the "we verify within N hours" promise shown to donors.',
      validation: (R) => R.min(1).max(720),
    }),
    defineField({
      name: 'showSupporterCount',
      title: 'Show supporter count publicly',
      type: 'boolean',
      group: 'campaign',
      initialValue: true,
      description:
        'Shows how many people have contributed. Never shows any monetary figure — amounts are not published anywhere on the site.',
    }),

    // ── Payment channels ──────────────────────────────────────
    defineField({
      name: 'channels',
      title: 'Payment Channels',
      type: 'array',
      group: 'channels',
      description:
        'The receiving accounts donors copy from /support. Public by design — do not put a personal account here unless the team intends it to be public.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'paymentChannel',
          fields: [
            defineField({
              name: 'method',
              title: 'Channel',
              type: 'string',
              options: { list: methodOptions },
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'accountNumber',
              title: 'Account / Wallet Number',
              type: 'string',
              description: 'Exactly as the donor should type it into their app.',
              validation: (R) => R.required(),
            }),
            defineField({
              name: 'accountName',
              title: 'Account Holder Name',
              type: 'string',
              description: 'Shown so donors can confirm they are sending to the right place.',
            }),
            defineField({
              name: 'accountType',
              title: 'Account Type',
              type: 'string',
              options: { list: accountTypeOptions },
            }),
            defineField({
              name: 'note',
              title: 'Instruction Note',
              type: 'string',
              placeholder: 'Use "Send Money", not "Cash Out"',
            }),
            defineField({ name: 'bankName', title: 'Bank Name', type: 'string', hidden: bankOnly }),
            defineField({ name: 'branch', title: 'Branch', type: 'string', hidden: bankOnly }),
            defineField({ name: 'routingNumber', title: 'Routing Number', type: 'string', hidden: bankOnly }),
          ],
          preview: {
            select: { title: 'method', subtitle: 'accountNumber', type: 'accountType' },
            prepare({ title, subtitle, type }) {
              return {
                title: `${title}${type ? ` · ${type}` : ''}`,
                subtitle,
              }
            },
          },
        }),
      ],
    }),

    // ── Page content ──────────────────────────────────────────
    defineField({
      name: 'steps',
      title: 'How It Works — Steps',
      type: 'array',
      group: 'content',
      description: 'Leave empty to use the built-in four-step explanation.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'step',
          fields: [
            defineField({ name: 'title', title: 'Title', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'body', title: 'Body', type: 'text', rows: 2, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'title', subtitle: 'body' } },
        }),
      ],
    }),
    defineField({
      name: 'faqItems',
      title: 'FAQ Items',
      type: 'array',
      group: 'content',
      description: 'Leave empty to use the built-in FAQ.',
      of: [
        defineArrayMember({
          type: 'object',
          name: 'faqItem',
          fields: [
            defineField({ name: 'question', title: 'Question', type: 'string', validation: (R) => R.required() }),
            defineField({ name: 'answer', title: 'Answer', type: 'text', rows: 3, validation: (R) => R.required() }),
          ],
          preview: { select: { title: 'question', subtitle: 'answer' } },
        }),
      ],
    }),
  ],
  preview: {
    select: { status: 'status', channels: 'channels' },
    prepare({ status, channels }) {
      const dot = { open: '🟢', paused: '🟡', closed: '🔴' }[status as string] ?? '🔴'
      const count = Array.isArray(channels) ? channels.length : 0
      return {
        title: 'Crowdfunding Configuration',
        subtitle: `${dot} ${status ?? 'closed'} · ${count} payment channel${count === 1 ? '' : 's'}`,
      }
    },
  },
})

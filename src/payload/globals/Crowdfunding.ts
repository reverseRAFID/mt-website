import type { GlobalConfig } from 'payload'

import { ACCOUNT_TYPES, DEFAULT_VERIFICATION_HOURS, PAYMENT_METHODS } from '../../lib/crowdfunding'
import { anyone, staff } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/** Bank-only fields are noise on a mobile-wallet row. */
const bankOnly = (_: unknown, siblingData: { method?: string }) =>
  siblingData?.method !== 'Bank Transfer'

export const Crowdfunding: GlobalConfig = {
  slug: 'crowdfunding',
  label: 'Crowdfunding Campaign',
  admin: {
    group: 'Settings',
    description: 'The /support campaign — its gate, its copy, and the accounts donors send to.',
  },
  access: { read: anyone, update: staff },
  hooks: revalidateGlobal('crowdfunding'),
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Campaign',
          fields: [
            {
              name: 'status',
              type: 'select',
              required: true,
              defaultValue: 'closed',
              label: 'Campaign Status',
              options: [
                { label: '🟢 Open — accepting declarations', value: 'open' },
                { label: '🟡 Paused — roll visible, form closed', value: 'paused' },
                { label: '🔴 Closed — campaign over', value: 'closed' },
              ],
              admin: {
                description:
                  'Enforced server-side by /api/donate — a closed campaign rejects submissions even when posted to directly.',
              },
            },
            {
              name: 'headline',
              type: 'text',
              label: 'Campaign Headline',
              admin: { placeholder: 'Help us get Mongol-Tori to Utah' },
            },
            {
              name: 'pitch',
              type: 'textarea',
              label: 'Campaign Pitch',
              admin: { description: 'Why the team needs support. Shown under the page hero.' },
            },
            {
              name: 'closedMessage',
              type: 'textarea',
              label: 'Paused / Closed Message',
              admin: { description: 'Shown in place of the form when the campaign is not open.' },
            },
            {
              name: 'deadline',
              type: 'date',
              label: 'Campaign Deadline',
              admin: {
                date: { pickerAppearance: 'dayAndTime' },
                description:
                  'Drives the "N days left" line on every support CTA. Passing it only stops the countdown — it does NOT close the campaign, so set the status too.',
              },
            },
            {
              name: 'verificationHours',
              type: 'number',
              min: 1,
              max: 720,
              defaultValue: DEFAULT_VERIFICATION_HOURS,
              label: 'Verification Turnaround (hours)',
              admin: { description: 'Sets the "we verify within N hours" promise shown to donors.' },
            },
            {
              name: 'showSupporterCount',
              type: 'checkbox',
              defaultValue: true,
              label: 'Show supporter count publicly',
              admin: {
                description:
                  'How many people contributed. Never a monetary figure — amounts are published nowhere on the site.',
              },
            },
          ],
        },
        {
          label: 'Payment Channels',
          fields: [
            {
              name: 'channels',
              type: 'array',
              label: 'Payment Channels',
              admin: {
                initCollapsed: true,
                description:
                  'The receiving accounts donors copy from /support. PUBLIC by design — do not put a personal account here unless the team means it to be public.',
              },
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'method',
                      type: 'select',
                      required: true,
                      label: 'Channel',
                      options: [...PAYMENT_METHODS],
                      admin: { width: '50%' },
                    },
                    {
                      name: 'accountType',
                      type: 'select',
                      options: [...ACCOUNT_TYPES],
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  name: 'accountNumber',
                  type: 'text',
                  required: true,
                  label: 'Account / Wallet Number',
                  admin: { description: 'Exactly as the donor should type it into their app.' },
                },
                {
                  name: 'accountName',
                  type: 'text',
                  label: 'Account Holder Name',
                  admin: { description: 'So donors can confirm they are sending to the right place.' },
                },
                {
                  name: 'note',
                  type: 'text',
                  label: 'Instruction Note',
                  admin: { placeholder: 'Use "Send Money", not "Cash Out"' },
                },
                {
                  name: 'bankName',
                  type: 'text',
                  admin: { condition: (_, sibling) => !bankOnly(_, sibling) },
                },
                {
                  name: 'branch',
                  type: 'text',
                  admin: { condition: (_, sibling) => !bankOnly(_, sibling) },
                },
                {
                  name: 'routingNumber',
                  type: 'text',
                  admin: { condition: (_, sibling) => !bankOnly(_, sibling) },
                },
              ],
            },
          ],
        },
        {
          label: 'Page Content',
          fields: [
            {
              name: 'steps',
              type: 'array',
              label: 'How It Works — Steps',
              admin: {
                initCollapsed: true,
                description: 'Leave empty to use the built-in four-step explanation.',
              },
              fields: [
                { name: 'title', type: 'text', required: true },
                { name: 'body', type: 'textarea', required: true },
              ],
            },
            {
              name: 'faqItems',
              type: 'array',
              label: 'FAQ Items',
              admin: { initCollapsed: true, description: 'Leave empty to use the built-in FAQ.' },
              fields: [
                { name: 'question', type: 'text', required: true },
                { name: 'answer', type: 'textarea', required: true },
              ],
            },
          ],
        },
      ],
    },
  ],
}

import type { GlobalConfig } from 'payload'

import { anyone, staff } from '../access'
import { revalidateGlobal } from '../hooks/revalidate'

/**
 * Recruitment settings.
 *
 * A Payload global rather than the "one document at a fixed id" convention
 * Sanity needed — the singleton is a first-class thing here, so there is no
 * longer any way to accidentally create a second one.
 */
export const Recruitment: GlobalConfig = {
  slug: 'recruitment',
  label: 'Recruitment',
  admin: {
    group: 'Settings',
    description: 'Controls whether /join/apply accepts applications.',
  },
  access: { read: anyone, update: staff },
  hooks: revalidateGlobal('recruitment'),
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'closed',
      label: 'Recruitment Status',
      options: [
        { label: '🟢 Open', value: 'open' },
        { label: '🟡 Under Review', value: 'under-review' },
        { label: '🔴 Closed', value: 'closed' },
      ],
      admin: {
        description:
          'Enforced server-side by /api/apply — anything but Open rejects submissions even when posted to directly.',
      },
    },
    {
      name: 'openingMessage',
      type: 'textarea',
      label: 'Opening / Closing Message',
      admin: {
        placeholder: 'e.g. "Applications for Spring 2025 are open! Apply before March 15."',
      },
    },
    {
      name: 'closingDate',
      type: 'date',
      label: 'Application Deadline',
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'faqItems',
      type: 'array',
      label: 'FAQ Items',
      admin: { initCollapsed: true },
      fields: [
        { name: 'question', type: 'text', required: true },
        { name: 'answer', type: 'textarea', required: true },
      ],
    },
  ],
}

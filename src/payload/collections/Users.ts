import type { CollectionConfig } from 'payload'

import { adminOnly, adminOrSelf } from '../access'

/**
 * CMS users.
 *
 * New in the migration: Sanity managed accounts for us, Payload does not. Two
 * roles, because that is the real shape of the team —
 *
 *   • editor — writes content, works the order and donation queues.
 *   • admin  — everything an editor can do, plus user management and the
 *              money-shaped fields (a donation's verified `amount`, the shop's
 *              notification inboxes).
 *
 * Self-service is deliberately narrow: a user can change their own name and
 * password, but not their own role. Otherwise "editor" is only ever one save
 * away from "admin".
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 8, // an 8-hour working day
    maxLoginAttempts: 8,
    lockTime: 10 * 60 * 1000,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'role'],
    group: 'Settings',
  },
  access: {
    // Never public. An open `read` here would publish the team's email
    // addresses, and the login form does not need it.
    read: adminOrSelf,
    create: adminOnly,
    update: adminOrSelf,
    delete: adminOnly,
    admin: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    beforeChange: [
      /**
       * The first account ever created is an admin.
       *
       * `role` is admin-only to write, and during first-user registration there
       * is no logged-in user — so the field would be stripped and the founding
       * account would default to `editor`, locking everyone out of user
       * management on a fresh install. Runs after field access has been applied,
       * which is why it can set what the request itself was not allowed to.
       */
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data
        const { totalDocs } = await req.payload.count({ collection: 'users' })
        return totalDocs === 0 ? { ...data, role: 'admin' } : data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: { description: 'Shown in the admin UI so changes are attributable to a person.' },
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'editor',
      options: [
        { label: 'Editor — content, orders, donations', value: 'editor' },
        { label: 'Admin — everything, including users', value: 'admin' },
      ],
      // Only an admin may grant a role, and only over the API path that
      // enforces field access. Without this an editor could PATCH themselves.
      access: {
        create: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
        update: ({ req: { user } }) => (user as { role?: string } | null)?.role === 'admin',
      },
    },
  ],
}

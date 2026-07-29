import path from 'path'
import { fileURLToPath } from 'url'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { resendAdapter } from '@payloadcms/email-resend'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { buildConfig } from 'payload'
import sharp from 'sharp'

import { Documents } from './src/payload/collections/Documents'
import { Media } from './src/payload/collections/Media'
import { Users } from './src/payload/collections/Users'

const dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Payload root config.
 *
 * ── Why the API is not at /api ────────────────────────────────
 * Payload's REST API defaults to `/api/*`, and this app already owns
 * `/api/apply`, `/api/donate`, `/api/shop/cart` and `/api/shop/order`. Two route
 * trees under one prefix — one of them a catch-all — is a Next build error, and
 * those four endpoints are public contracts posted to by live forms. So Payload
 * moves instead, to `/payload-api`.
 *
 * ── Why GraphQL is off ────────────────────────────────────────
 * Nothing in this project queries it, and it is a second, separately-configured
 * door into collections that hold customer addresses and donor account numbers.
 * An API surface nobody uses is an API surface nobody is checking.
 */
export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SITE_URL,

  routes: {
    admin: '/admin',
    api: '/payload-api',
  },

  admin: {
    user: Users.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — BRACU Mongol-Tori',
      description: 'Content management for bracumongoltori.com',
    },
  },

  collections: [Users, Media, Documents],

  editor: lexicalEditor(),

  // Signs auth tokens and encrypts stored secrets. Rotating it logs everyone
  // out; losing it makes existing sessions unverifiable, which is the point.
  secret: process.env.PAYLOAD_SECRET || '',

  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
    // The shop's no-oversell guarantee is a multi-document transaction. Payload
    // uses sessions when the server supports them; a standalone mongod does not,
    // which is why docker-compose runs a replica set even locally.
    transactionOptions: {
      readConcern: { level: 'snapshot' },
      writeConcern: { w: 'majority' },
    },
  }),

  sharp,

  /**
   * Admin email — password resets and account invitations only.
   *
   * Order and status emails do NOT go through here; they are sent by
   * src/lib/email/client.ts, which owns its own templates and failure handling.
   * Left undefined when RESEND_API_KEY is unset, in which case Payload logs the
   * message to the console instead of failing — the same "email is optional,
   * losing data is not" stance the shop takes.
   */
  email:
    process.env.RESEND_API_KEY && process.env.SHOP_FROM_EMAIL
      ? resendAdapter({
          apiKey: process.env.RESEND_API_KEY,
          defaultFromAddress: process.env.SHOP_FROM_EMAIL.replace(/^.*<|>.*$/g, ''),
          defaultFromName: 'BRACU Mongol-Tori',
        })
      : undefined,

  graphQL: { disable: true },

  typescript: {
    outputFile: path.resolve(dirname, 'src/payload-types.ts'),
  },

  // No cross-origin browser access. Everything that reads this data is either
  // the site itself (server-side, in-process) or the admin UI on the same origin.
  cors: [],
  csrf: process.env.NEXT_PUBLIC_SITE_URL ? [process.env.NEXT_PUBLIC_SITE_URL] : [],
})

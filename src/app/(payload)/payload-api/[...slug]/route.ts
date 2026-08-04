/* THIS FILE IS PART OF PAYLOAD'S ADMIN SHELL.
 *
 * Payload's REST API, mounted at /payload-api rather than the default /api —
 * see the note in payload.config.ts. Collection `access` rules are what make
 * this safe to expose: `orders`, `donations`, `applications` and `users` all
 * answer 403 here, and scripts/check-access.mjs asserts it.
 */
import config from '@payload-config'
import {
  REST_DELETE,
  REST_GET,
  REST_OPTIONS,
  REST_PATCH,
  REST_POST,
  REST_PUT,
} from '@payloadcms/next/routes'

export const GET = REST_GET(config)
export const POST = REST_POST(config)
export const DELETE = REST_DELETE(config)
export const PATCH = REST_PATCH(config)
export const PUT = REST_PUT(config)
export const OPTIONS = REST_OPTIONS(config)

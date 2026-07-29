import { createClient } from '@sanity/client'

// ── Server-only Sanity write client ────────────────────────────
// Authenticated with SANITY_API_TOKEN (an "Editor" token). This MUST
// stay on the server — only import it from route handlers / server
// actions (e.g. src/app/api/apply/route.ts). Never import it into a
// client component, or the token would be bundled to the browser.
//
// SANITY_API_TOKEN is read at runtime; if it is unset, writes will 401.
export const sanityWriteClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'replace-me',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

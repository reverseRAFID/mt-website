import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // ── Dev-only PII exposure ─────────────────────────────────
    // Next's dev-mode Server Components HMR cache stores fetch() responses so a
    // hot reload does not refetch, and it serialises them into the RSC flight
    // payload embedded in the page. On /shop/track/[trackId] that meant the RAW
    // order — full phone number, street address, postcode, email — appeared in
    // `self.__next_f.push(...)` in the page source, even though the page itself
    // only ever renders the masked PublicOrder.
    //
    // Production was never affected (verified against `next build` + `next
    // start`: only "Banani" and "••••••432" appear). But a developer running
    // `next dev` against live data would have real customers' details sitting in
    // their browser's view-source, and the end-to-end privacy test could not
    // tell the two builds apart.
    //
    // Turning the cache off costs a refetch on hot reload and makes dev match
    // production, which is what the privacy assertions need in order to mean
    // anything.
    serverComponentsHmrCache: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
      { protocol: 'https', hostname: 'img.youtube.com' },
      // Vercel Blob, when object storage is configured. Uploads served from the
      // local filesystem are same-origin and need no pattern at all.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
    ],
  },
}

// withPayload wires the admin bundle, the `@payload-config` alias and the
// server-only externals into the Next build.
export default withPayload(nextConfig)

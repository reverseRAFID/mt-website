import { withPayload } from '@payloadcms/next/withPayload'

/**
 * A remotePatterns entry for whatever NEXT_PUBLIC_SITE_URL points at.
 *
 * Returns nothing when the variable is unset or unparseable — an absent pattern
 * gives a clear "hostname is not configured" error, which is a much better
 * failure than a crash inside the config at boot.
 */
function siteImagePattern() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '')
    return [{ protocol: url.protocol.replace(':', ''), hostname: url.hostname, port: url.port || undefined }]
  } catch {
    return []
  }
}

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
      // Vercel Blob, when object storage is configured.
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com' },
      // The site's own origin. Payload builds upload URLs from `serverURL`, so
      // even a locally-stored image arrives as an absolute URL on this host and
      // next/image refuses to optimise a host it was not told about. Derived
      // from the env var rather than hardcoded, so dev, preview and production
      // each allow themselves and nothing else.
      ...siteImagePattern(),
    ],
  },
}

// withPayload wires the admin bundle, the `@payload-config` alias and the
// server-only externals into the Next build.
export default withPayload(nextConfig)

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
    // ── Cloudinary does the resizing ──────────────────────────
    // A custom loader means Next never runs its own optimiser: it still emits
    // the srcset and handles layout, but each URL is a Cloudinary
    // transformation. One CDN hop instead of two, AVIF/WebP negotiated by
    // `f_auto`, and no image-optimisation usage on Vercel.
    //
    // The loader runs for EVERY <Image>, so it passes non-Cloudinary URLs
    // through untouched — the local logo SVGs go through it too.
    //
    // `remotePatterns` is deliberately absent: it configures the built-in
    // optimiser, which is no longer in the path. Host allow-listing moves to
    // the loader, which only ever rewrites res.cloudinary.com.
    loader: 'custom',
    loaderFile: './src/lib/cms/cloudinary-loader.ts',
  },
}

// withPayload wires the admin bundle, the `@payload-config` alias and the
// server-only externals into the Next build.
export default withPayload(nextConfig)

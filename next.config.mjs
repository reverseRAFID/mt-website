/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
    ],
  },
  // Required for Sanity Studio embedded at /studio
  // Prevents next/image optimization from interfering with studio assets
  async headers() {
    return [
      {
        // Allow Sanity Studio to load in same-origin iframe
        source: '/studio/:path*',
        headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }],
      },
    ]
  },
}

export default nextConfig

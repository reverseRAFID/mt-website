import type { ReactNode } from 'react'
import type { SponsorIcon } from '@/lib/sponsorship'

/**
 * Shared inline SVG glyphs for the sponsorship sections. Lucide-style:
 * 24×24, stroke 1.5, rounded caps/joins, color via `currentColor`.
 */
const PATHS: Record<SponsorIcon, ReactNode> = {
  broadcast: (
    <>
      <path d="M4.93 19.07a10 10 0 0 1 0-14.14M7.76 16.24a6 6 0 0 1 0-8.49M19.07 4.93a10 10 0 0 1 0 14.14M16.24 7.76a6 6 0 0 1 0 8.49" />
      <circle cx="12" cy="12" r="2" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </>
  ),
  beaker: (
    <>
      <path d="M9 3h6M10 3v6.5L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-8.5V3" />
      <path d="M7.5 14h9" />
    </>
  ),
  talent: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  rover: (
    <>
      <rect x="3" y="8" width="14" height="7" rx="1" />
      <path d="M17 11h2.5L21 14M7 8V5h5v3" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="15" cy="18" r="2" />
      <path d="M9 18h4" />
    </>
  ),
  trophy: (
    <>
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" />
    </>
  ),
  handshake: (
    <>
      <path d="m11 17 2 2a1 1 0 0 0 1.4 0l3.6-3.6a2 2 0 0 0 0-2.8L13.4 8" />
      <path d="m18 13-1.5-1.5M14.5 14.5 13 13M3 7l4-4 6 6-2 2a2 2 0 0 1-2.8 0L3 9.8" />
      <path d="m7 17 1.6 1.6a1 1 0 0 0 1.4 0L11 17.6" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  rocket: (
    <>
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 0 1 8-10c2 0 4 0 4 0s0 2 0 4a22 22 0 0 1-10 8" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </>
  ),
  graduation: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5z" />
      <path d="M6 12v5c0 1 2.5 2.5 6 2.5s6-1.5 6-2.5v-5M22 10v6" />
    </>
  ),
}

export function SponsorGlyph({
  icon,
  className,
  size = 24,
}: {
  icon: SponsorIcon
  className?: string
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {PATHS[icon]}
    </svg>
  )
}

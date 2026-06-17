'use client'

import { usePathname } from 'next/navigation'
import { SmoothScroll } from './SmoothScroll'
import { Cursor } from './Cursor'
import { GrainOverlay } from './GrainOverlay'
import { Preloader } from './Preloader'

/**
 * Global "award layer". Mounted once in the root layout (persists across client
 * navigations). The embedded Sanity Studio opts out entirely — it needs native
 * scrolling, the native cursor, and no overlays.
 */
export function SiteFx() {
  const pathname = usePathname()
  if (pathname?.startsWith('/studio')) return null

  return (
    <>
      <Preloader />
      <SmoothScroll />
      <Cursor />
      <GrainOverlay />
    </>
  )
}

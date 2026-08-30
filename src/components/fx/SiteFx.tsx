'use client'

import { usePathname } from 'next/navigation'
import { SmoothScroll } from './SmoothScroll'
import { Cursor } from './Cursor'
import { GrainOverlay } from './GrainOverlay'
import { Preloader } from './Preloader'

/**
 * Global "award layer". Mounted once in the root layout (persists across client
 * navigations). The Payload admin opts out entirely — it needs native
 * scrolling, the native cursor, and no overlays.
 */
export function SiteFx() {
  const pathname = usePathname()
  if (pathname?.startsWith('/admin')) return null

  return (
    <>
      <Preloader />
      <SmoothScroll />
      {/* <Cursor /> */}
      <GrainOverlay />
    </>
  )
}

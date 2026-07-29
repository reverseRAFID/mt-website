'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'

/**
 * Lenis momentum scrolling, driven by the GSAP ticker and kept in sync with
 * ScrollTrigger. No-ops under reduced-motion (native scroll is preserved).
 * Mounted once globally; the caller skips it on /admin.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (prefersReducedMotion()) return

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    })

    lenis.on('scroll', ScrollTrigger.update)

    const onTick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    // keep ScrollTrigger measurements fresh after layout/async content settles
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    const refreshTimer = window.setTimeout(refresh, 600)

    return () => {
      gsap.ticker.remove(onTick)
      gsap.ticker.lagSmoothing(500, 33)
      window.removeEventListener('load', refresh)
      window.clearTimeout(refreshTimer)
      lenis.destroy()
    }
  }, [])

  return null
}

'use client'

import { useEffect, useRef } from 'react'
import { gsap, prefersReducedMotion, isFinePointer } from '@/lib/gsap'

const INTERACTIVE = 'a, button, [role="button"], [data-cursor], input, textarea, select, label, summary'

/**
 * A targeting-reticle cursor: a precise centre dot plus a lagging ring that
 * locks onto interactive elements. Fine-pointer + motion-allowed only; the
 * native cursor is hidden globally (kept on text inputs via CSS).
 */
export function Cursor() {
  const dotRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (prefersReducedMotion() || !isFinePointer()) return
    const dot = dotRef.current
    const ring = ringRef.current
    if (!dot || !ring) return

    const root = document.documentElement
    root.classList.add('cursor-reticle')

    gsap.set([dot, ring], { xPercent: -50, yPercent: -50, opacity: 0 })

    const dotX = gsap.quickTo(dot, 'x', { duration: 0.12, ease: 'power3.out' })
    const dotY = gsap.quickTo(dot, 'y', { duration: 0.12, ease: 'power3.out' })
    const ringX = gsap.quickTo(ring, 'x', { duration: 0.42, ease: 'power3.out' })
    const ringY = gsap.quickTo(ring, 'y', { duration: 0.42, ease: 'power3.out' })

    let shown = false
    const onMove = (e: PointerEvent) => {
      if (!shown) {
        shown = true
        gsap.to([dot, ring], { opacity: 1, duration: 0.3 })
      }
      dotX(e.clientX)
      dotY(e.clientY)
      ringX(e.clientX)
      ringY(e.clientY)
    }

    const setActive = (active: boolean) => {
      gsap.to(ring, {
        scale: active ? 1.7 : 1,
        borderColor: active ? 'rgba(240, 110, 30, 0.9)' : 'rgba(240, 110, 30, 0.45)',
        duration: 0.3,
        ease: 'power3.out',
      })
      gsap.to(dot, { scale: active ? 0 : 1, duration: 0.3, ease: 'power3.out' })
    }

    const onOver = (e: Event) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE)) setActive(true)
    }
    const onOut = (e: Event) => {
      if ((e.target as Element)?.closest?.(INTERACTIVE)) setActive(false)
    }
    const onDown = () => gsap.to(ring, { scale: 0.85, duration: 0.18 })
    const onUp = () => gsap.to(ring, { scale: 1, duration: 0.25 })
    const onLeave = () => {
      shown = false
      gsap.to([dot, ring], { opacity: 0, duration: 0.25 })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerover', onOver)
    document.addEventListener('pointerout', onOut)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.addEventListener('pointerleave', onLeave)

    return () => {
      root.classList.remove('cursor-reticle')
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return (
    <>
      <div
        ref={ringRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-9 w-9 rounded-full border opacity-0"
        style={{ borderColor: 'rgba(240, 110, 30, 0.45)' }}
      >
        {/* crosshair ticks */}
        <span className="absolute left-1/2 top-0 h-1.5 w-px -translate-x-1/2 bg-primary/60" />
        <span className="absolute left-1/2 bottom-0 h-1.5 w-px -translate-x-1/2 bg-primary/60" />
        <span className="absolute top-1/2 left-0 w-1.5 h-px -translate-y-1/2 bg-primary/60" />
        <span className="absolute top-1/2 right-0 w-1.5 h-px -translate-y-1/2 bg-primary/60" />
      </div>
      <div
        ref={dotRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[9999] h-1.5 w-1.5 rounded-full bg-primary opacity-0"
      />
    </>
  )
}

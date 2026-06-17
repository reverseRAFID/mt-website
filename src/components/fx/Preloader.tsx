'use client'

import { useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const BOOT_LINES = [
  'INITIALIZING TELEMETRY LINK',
  'CALIBRATING IMU · GNSS · LIDAR',
  'LOADING TERRAIN MESH',
  'ESTABLISHING UPLINK — MONGOL-TORI',
]

/** Marks the intro gate open so the Hero can play its entrance after the wipe. */
function openBootGate() {
  if (typeof window === 'undefined') return
  ;(window as unknown as { __mtBooted?: boolean }).__mtBooted = true
  window.dispatchEvent(new Event('mt:booted'))
}

/**
 * One-time mission "boot" sequence shown on the first load of a session. Wipes
 * up to reveal the site and opens the boot gate. Skipped under reduced-motion
 * or if already booted this session (Hero then plays immediately).
 */
export function Preloader() {
  const rootRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const barRef = useRef<HTMLDivElement>(null)
  // Always false on first render (server + client match → no hydration drift).
  // The layout-effect below removes the overlay before paint when it should be skipped.
  const [done, setDone] = useState(false)

  useGSAP(
    () => {
      const skip = prefersReducedMotion() || sessionStorage.getItem('mt-booted') === '1'
      if (skip) {
        openBootGate()
        setDone(true)
        return
      }
      const root = rootRef.current
      if (!root) return
      document.documentElement.classList.add('lenis-stopped', 'overflow-hidden')

      const counter = { v: 0 }
      const tl = gsap.timeline({
        onComplete: () => {
          sessionStorage.setItem('mt-booted', '1')
          document.documentElement.classList.remove('lenis-stopped', 'overflow-hidden')
          setDone(true)
        },
      })

      tl.from('[data-boot-brand]', { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out' })
        .from('[data-boot-line]', { opacity: 0, y: 8, duration: 0.4, stagger: 0.14, ease: 'power2.out' }, '-=0.1')
        .to(
          counter,
          {
            v: 100,
            duration: 1.5,
            ease: 'power1.inOut',
            onUpdate: () => {
              const v = Math.round(counter.v)
              if (counterRef.current) counterRef.current.textContent = String(v).padStart(3, '0')
              if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`
            },
          },
          '-=0.5'
        )
        .add(openBootGate)
        .to('[data-boot-fade]', { opacity: 0, duration: 0.35, ease: 'power2.in' })
        .to(root, { yPercent: -100, duration: 0.8, ease: 'power4.inOut' }, '-=0.05')
    },
    { scope: rootRef }
  )

  if (done) return null

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-[#050505] text-white"
      role="status"
      aria-label="Loading"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid opacity-[0.06]" />
      <div data-boot-fade className="relative w-full max-w-md px-6">
        <div data-boot-brand className="mb-8 text-center">
          <div className="hud-label mb-3 text-primary">Mongol-Tori // Mission Control</div>
          <div className="display-figure text-5xl text-white sm:text-6xl">RED PLANET</div>
        </div>

        <div className="mb-8 space-y-1.5 font-mono text-[11px] text-white/45">
          {BOOT_LINES.map((line) => (
            <div data-boot-line key={line} className="flex items-center gap-2">
              <span className="text-primary">›</span>
              {line}
              <span className="text-primary/70">OK</span>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <span className="hud-label text-white/40">Loading</span>
          <span ref={counterRef} className="font-mono text-sm text-primary nums">
            000
          </span>
        </div>
        <div className="mt-2 h-px w-full overflow-hidden bg-white/10">
          <div ref={barRef} className="h-full w-full origin-left scale-x-0 bg-primary" />
        </div>
      </div>
    </div>
  )
}

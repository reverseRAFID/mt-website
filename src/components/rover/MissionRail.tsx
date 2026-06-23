'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger, prefersReducedMotion } from '@/lib/gsap'

/**
 * Decorative sticky left-edge instrument spine. Reads whole-page scroll
 * progress to fill an orange line, light the active section tick and tick a
 * 4-digit telemetry readout — all driven imperatively (no React state / no
 * re-render). aria-hidden + pointer-events-none; only mounts in the gutter at
 * 1440px+. The SSR/DOM default (empty fill, first tick lit, 0000) already IS
 * the page-top state, so JS-off and reduced-motion render correctly for free.
 */
export function MissionRail({ total, callsign }: { total: number; callsign: string }) {
  const fillRef = useRef<HTMLSpanElement>(null)
  const readoutRef = useRef<HTMLSpanElement>(null)
  const tickRefs = useRef<(HTMLSpanElement | null)[]>([])

  const ticks = Array.from({ length: total }, (_, i) => String(i + 1).padStart(2, '0'))

  useGSAP(
    () => {
      if (prefersReducedMotion()) return

      const fill = fillRef.current
      const readout = readoutRef.current
      const tickEls = tickRefs.current
      let activeIndex = 0

      const apply = (p: number) => {
        if (fill) fill.style.transform = `scaleY(${p})`
        if (readout) readout.textContent = String(Math.round(p * 1000)).padStart(4, '0')
        const next = Math.round(p * (total - 1))
        if (next !== activeIndex) {
          tickEls[activeIndex]?.classList.replace('text-primary', 'text-text-faint')
          tickEls[next]?.classList.replace('text-text-faint', 'text-primary')
          activeIndex = next
        }
      }

      const st = ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => apply(self.progress),
      })
      // Sync once in case the page loads mid-scroll.
      apply(st.progress)

      return () => st.kill()
    },
    { dependencies: [total] }
  )

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 top-0 z-30 hidden h-screen w-12 flex-col items-center justify-between py-6 min-[1440px]:flex"
    >
      {/* Callsign — stacked vertically, reading bottom-to-top */}
      <span className="whitespace-nowrap font-mono text-[9px] uppercase tracking-widest text-text-faint [writing-mode:vertical-rl] rotate-180">
        {callsign}
      </span>

      {/* Spine: 1px divider line with an orange scroll-fill + section ticks */}
      <div className="relative w-px flex-1 bg-divider">
        <span
          ref={fillRef}
          className="absolute inset-x-0 top-0 h-full origin-top scale-y-0 bg-primary will-change-transform"
        />
        <div className="absolute inset-y-0 left-1/2 flex -translate-x-1/2 flex-col items-center justify-between">
          {ticks.map((tick, i) => (
            <span
              key={tick}
              ref={(el) => {
                tickRefs.current[i] = el
              }}
              className={`hud-label nums text-[8px] leading-none ${
                i === 0 ? 'text-primary' : 'text-text-faint'
              }`}
            >
              {tick}
            </span>
          ))}
        </div>
      </div>

      {/* 4-digit telemetry readout */}
      <span ref={readoutRef} className="nums font-mono text-[9px] tracking-widest text-text-faint">
        0000
      </span>
    </div>
  )
}

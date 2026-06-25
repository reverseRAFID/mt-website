'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface ScrollSpineProps {
  /** Position the spine inside a `relative` parent, e.g. `absolute left-4 top-0 bottom-0`. */
  className?: string
  /**
   * ScrollTrigger range over the parent (the element this spine is placed in).
   * Defaults trace the parent from when its top hits 82% of the viewport to
   * when its bottom reaches 55% — so the line is fully drawn a touch before the
   * section leaves the screen.
   */
  start?: string
  end?: string
}

/**
 * A vertical "telemetry spine" — a 1px track with an orange fill that scrubs
 * from 0→1 as you scroll through the section it lives in, plus a soft glowing
 * tip that rides the leading edge. Used as the connective tissue of the
 * timeline / stepper sections that replaced the old horizontal-scroll reels.
 *
 * The trigger is the spine's own parent element, so a consumer just drops
 * `<ScrollSpine className="absolute left-5 top-2 bottom-2" />` as the first
 * child of a `relative` track wrapper — no refs to thread.
 *
 * Reduced-motion / JS-off: the fill renders fully drawn (scaleY:1) so the line
 * always reads as a complete connector and never hides meaning.
 */
export function ScrollSpine({ className, start = 'top 82%', end = 'bottom 55%' }: ScrollSpineProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      const fill = fillRef.current
      const trigger = el?.parentElement
      if (!el || !fill || !trigger) return
      if (prefersReducedMotion()) {
        gsap.set(fill, { scaleY: 1 })
        if (tipRef.current) gsap.set(tipRef.current, { autoAlpha: 0 })
        return
      }

      gsap.set(fill, { scaleY: 0, transformOrigin: 'top center' })
      const tip = tipRef.current

      gsap.to(fill, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger,
          start,
          end,
          scrub: 0.6,
          onUpdate: (self) => {
            if (!tip) return
            // Ride the leading edge; fade in only while actively drawing.
            tip.style.top = `${self.progress * 100}%`
            tip.style.opacity = self.progress > 0.001 && self.progress < 0.999 ? '1' : '0'
          },
        },
      })
    },
    { scope: ref }
  )

  return (
    <span ref={ref} aria-hidden className={cn('pointer-events-none block w-px bg-divider', className)}>
      <span ref={fillRef} className="absolute inset-0 block w-px origin-top bg-primary" />
      <span
        ref={tipRef}
        className="absolute left-1/2 top-0 block h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-none bg-primary opacity-0 shadow-[0_0_12px_2px_rgba(var(--primary-rgb),0.7)]"
      />
    </span>
  )
}

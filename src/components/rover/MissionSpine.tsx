'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'

/**
 * Decorative mission-spine overlay for the numbered mission list. A neutral 1px
 * divider is always visible; an orange fill line scrubs from top to bottom as
 * the section scrolls through view — a quiet progress readout for the plan.
 *
 * SSR / reduced-motion safe: the orange overlay's DOM default is scale-y-0
 * (invisible), so with JS off or motion disabled only the neutral divider shows.
 * The fill is only ever revealed by GSAP behind the desktop+fine+motion gate.
 */
export function MissionSpine() {
  const ref = useRef<HTMLSpanElement>(null)
  const fillRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const fill = fillRef.current
      const section = ref.current?.closest('section')
      if (!fill || !section) return
      const mm = gsap.matchMedia()
      mm.add(
        '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const tween = gsap.fromTo(
            fill,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: 'none',
              scrollTrigger: {
                trigger: section,
                start: 'top 70%',
                end: 'bottom 80%',
                scrub: true,
              },
            }
          )
          return () => tween.scrollTrigger?.kill()
        }
      )
      return () => mm.revert()
    },
    { scope: ref }
  )

  return (
    <span ref={ref} aria-hidden className="pointer-events-none absolute inset-0 block">
      <span className="absolute bottom-2 left-[15px] top-2 w-px bg-divider sm:left-[19px]" />
      <span
        ref={fillRef}
        className="absolute bottom-2 left-[15px] top-2 w-px origin-top scale-y-0 bg-primary sm:left-[19px]"
      />
    </span>
  )
}

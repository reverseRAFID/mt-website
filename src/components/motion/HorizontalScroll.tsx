'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { cn } from '@/lib/utils'

interface HorizontalScrollProps {
  children: ReactNode
  className?: string
  /** Accessible name for the scroll region. */
  ariaLabel?: string
  /** Extra classes for the inner flex track (gap, padding). */
  trackClassName?: string
}

/**
 * Pinned horizontal scroll. On desktop (≥1024px, fine pointer, motion allowed)
 * the section pins and the track translates with the scroll — a cinematic
 * sideways reveal. Everywhere else (touch, mobile, reduced-motion) it degrades
 * to a native scroll-snap swipe row, so it NEVER creates page-level horizontal
 * overflow and stays fully usable. Direct children should set their own widths
 * (e.g. `w-[80vw] lg:w-[40vw] shrink-0`).
 */
export function HorizontalScroll({
  children,
  className,
  ariaLabel,
  trackClassName,
}: HorizontalScrollProps) {
  const rootRef = useRef<HTMLElement>(null)
  const maskRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const track = trackRef.current
      if (!root || !track) return

      const mm = gsap.matchMedia()

      mm.add(
        '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const distance = () => Math.max(0, track.scrollWidth - track.offsetWidth)

          const tween = gsap.to(track, {
            x: () => -distance(),
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: () => `+=${distance()}`,
              scrub: 1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

          return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            gsap.set(track, { clearProps: 'x' })
          }
        }
      )

      return () => mm.revert()
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} aria-label={ariaLabel} className={cn('relative max-w-full', className)}>
      <div
        ref={maskRef}
        className="max-w-full overflow-x-auto lg:overflow-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          ref={trackRef}
          className={cn(
            'flex snap-x snap-mandatory lg:snap-none will-change-transform',
            trackClassName
          )}
        >
          {children}
        </div>
      </div>
    </section>
  )
}

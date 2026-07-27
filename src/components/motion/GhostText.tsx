'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { ghostStyle } from '@/lib/ghost-type'
import { cn } from '@/lib/utils'

interface GhostTextProps {
  /** Word(s) rendered as the oversized background watermark. Always uppercase. */
  text: string
  /** Vertical anchor within the host section. */
  anchor?: 'top' | 'center' | 'bottom'
  /** Horizontal scroll-drift direction. */
  drift?: 'left' | 'right'
  /** Hollow (stroked) glyphs instead of filled ones. */
  outline?: boolean
  /** Overrides on the word itself — size, opacity, offsets. */
  className?: string
}

const ANCHOR: Record<'top' | 'center' | 'bottom', string> = {
  top: 'items-start',
  center: 'items-center',
  bottom: 'items-end',
}

/**
 * Screen-filling low-opacity display word pinned behind a section's content —
 * the footer-wordmark pattern, animated. The word is sized from its own letters
 * so it runs past both screen edges whatever its length (see ghost-type), and
 * drifts horizontally as the section scrolls through the viewport (GSAP scrub),
 * staying static under reduced-motion. The host section only needs `relative`;
 * the carrier clips its own overflow so it can never cause horizontal scroll.
 * Decorative only.
 */
export function GhostText({
  text,
  anchor = 'center',
  drift = 'left',
  outline = false,
  className,
}: GhostTextProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      if (!rootRef.current || !wordRef.current || prefersReducedMotion()) return
      const dir = drift === 'left' ? -1 : 1
      gsap.fromTo(
        wordRef.current,
        { xPercent: dir * -5 },
        {
          xPercent: dir * 5,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      )
    },
    { scope: rootRef }
  )

  return (
    <div
      ref={rootRef}
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 z-0 flex justify-center overflow-hidden',
        ANCHOR[anchor]
      )}
    >
      <span
        ref={wordRef}
        style={ghostStyle(text)}
        className={cn(
          'ghost-word',
          outline ? 'ghost-word-outline' : 'text-text/[0.035]',
          className
        )}
      >
        {text}
      </span>
    </div>
  )
}

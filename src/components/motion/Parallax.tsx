'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

interface ParallaxProps {
  children: ReactNode
  as?: ElementType
  className?: string
  /** Travel as a fraction of element height. Positive = moves up on scroll. */
  speed?: number
  style?: React.CSSProperties
}

/**
 * Scroll-scrubbed parallax. For media, place an over-sized child (e.g. scale
 * 115%) inside an `overflow-hidden` frame and wrap it here so it never reveals
 * gaps. No-ops under reduced-motion.
 */
export function Parallax({ children, as, className, speed = 0.18, style }: ParallaxProps) {
  const ref = useRef<HTMLElement>(null)
  const Tag = (as ?? 'div') as ElementType

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const shift = speed * 100
      gsap.fromTo(
        el,
        { yPercent: -shift / 2 },
        {
          yPercent: shift / 2,
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      )
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}

'use client'

import { useRef, type ElementType, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

interface RevealProps {
  children: ReactNode
  /** Rendered element. Defaults to div. */
  as?: ElementType
  className?: string
  /** Vertical travel in px. */
  y?: number
  /** Initial blur in px for a "focus-in" feel. */
  blur?: number
  delay?: number
  duration?: number
  /**
   * When set, animates the element's DIRECT children in sequence instead of
   * the element itself. Pass `true` for the default 0.08s step, or a number.
   */
  stagger?: number | boolean
  /** ScrollTrigger start. Defaults to 'top 85%'. */
  start?: string
  /** Replay each time it scrolls into view. Default false (play once). */
  repeat?: boolean
  style?: React.CSSProperties
}

/**
 * Scroll-triggered entrance. Content is hidden ONLY via JS (gsap.set), so it
 * stays visible when JS is disabled or reduced-motion is requested.
 */
export function Reveal({
  children,
  as,
  className,
  y = 24,
  blur = 0,
  delay = 0,
  duration = 0.8,
  stagger = false,
  start = 'top 85%',
  repeat = false,
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement>(null)
  const Tag = (as ?? 'div') as ElementType

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) return

      const targets: Element | Element[] = stagger ? Array.from(el.children) : el
      const fromVars: gsap.TweenVars = { opacity: 0, y }
      if (blur) fromVars.filter = `blur(${blur}px)`

      gsap.set(targets, fromVars)
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        filter: blur ? 'blur(0px)' : undefined,
        duration,
        delay,
        ease: 'power3.out',
        stagger: typeof stagger === 'number' ? stagger : stagger ? 0.08 : 0,
        clearProps: 'filter',
        scrollTrigger: {
          trigger: el,
          start,
          toggleActions: repeat ? 'restart none none reverse' : 'play none none none',
          once: !repeat,
        },
      })
    },
    { scope: ref }
  )

  return (
    <Tag ref={ref} className={className} style={style}>
      {children}
    </Tag>
  )
}

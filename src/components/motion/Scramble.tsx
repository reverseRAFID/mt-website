'use client'

import { useRef, type ElementType } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

const GLYPHS = '!<>-_\\/[]{}=+*^?#________·:'

interface ScrambleProps {
  text: string
  className?: string
  as?: ElementType
  delay?: number
  duration?: number
  /** When set, decode on scroll-into-view instead of on mount. */
  start?: string
}

/**
 * "Decode" text effect — characters resolve from random mono glyphs into the
 * real string. The real text is rendered on the server, so it is fully legible
 * with JS disabled or reduced-motion (we never hide it via CSS). On-brand
 * mission-control telemetry flavour for names / codes / labels.
 */
export function Scramble({ text, className, as, delay = 0, duration = 1, start }: ScrambleProps) {
  const ref = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLSpanElement>(null)
  const Tag = (as ?? 'span') as ElementType

  useGSAP(
    () => {
      const el = ref.current
      const inner = innerRef.current
      if (!el || !inner) return
      if (prefersReducedMotion()) {
        inner.textContent = text
        return
      }
      const proxy = { p: 0 }
      gsap.to(proxy, {
        p: 1,
        duration,
        delay,
        ease: 'power2.out',
        scrollTrigger: start ? { trigger: el, start, once: true } : undefined,
        onUpdate: () => {
          const revealed = Math.floor(proxy.p * text.length)
          let out = ''
          for (let i = 0; i < text.length; i++) {
            const ch = text[i]
            if (i < revealed || ch === ' ') out += ch
            else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          }
          inner.textContent = out
        },
        onComplete: () => {
          inner.textContent = text
        },
      })
    },
    { scope: ref, dependencies: [text] }
  )

  // The accessible name stays equal to the real string throughout: assistive
  // tech reads the sr-only copy while the animated (aria-hidden) node decodes.
  return (
    <Tag ref={ref} className={className}>
      <span className="sr-only">{text}</span>
      <span ref={innerRef} aria-hidden="true">
        {text}
      </span>
    </Tag>
  )
}

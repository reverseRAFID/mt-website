'use client'

import { useRef, type ReactNode } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion, isFinePointer } from '@/lib/gsap'

interface TiltCardProps {
  children: ReactNode
  className?: string
  /** Max tilt in degrees. */
  max?: number
}

/**
 * Subtle pointer-driven 3D tilt for cards. Fine-pointer + motion-allowed only,
 * so it never affects layout, focus, or touch devices.
 */
export function TiltCard({ children, className, max = 6 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion() || !isFinePointer()) return

      const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.4, ease: 'power3.out' })
      const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.4, ease: 'power3.out' })

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        rotY(px * max * 2)
        rotX(-py * max * 2)
      }
      const onLeave = () => {
        rotX(0)
        rotY(0)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    },
    { scope: ref }
  )

  return (
    <div ref={ref} className={className} style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}>
      {children}
    </div>
  )
}

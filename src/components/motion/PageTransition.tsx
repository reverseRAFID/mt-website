'use client'

import { useRef, type ReactNode } from 'react'
import { usePathname } from 'next/navigation'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

/**
 * Page-enter transition. Lives inside app/template.tsx, which React re-mounts
 * on every navigation, so the enter animation runs on each route change.
 * The transform is cleared on completion so sticky/fixed descendants behave
 * normally while scrolling. Studio routes opt out (see template.tsx).
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        gsap.set(el, { opacity: 1, clearProps: 'all' })
        return
      }
      gsap.fromTo(
        el,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', clearProps: 'transform,opacity' }
      )
    },
    { dependencies: [pathname], scope: ref }
  )

  return <div ref={ref}>{children}</div>
}

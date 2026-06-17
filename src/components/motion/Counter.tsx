'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'

interface CounterProps {
  to: number
  from?: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  /** Group thousands with commas. */
  grouping?: boolean
  className?: string
}

/**
 * Counts up to `to` when scrolled into view. Renders the final value on the
 * server so it's correct with JS disabled / reduced-motion.
 */
export function Counter({
  to,
  from = 0,
  duration = 1.8,
  prefix = '',
  suffix = '',
  decimals = 0,
  grouping = false,
  className,
}: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null)

  const format = (v: number) => {
    const n = decimals > 0 ? v.toFixed(decimals) : Math.round(v).toString()
    const grouped = grouping
      ? Number(n).toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      : n
    return `${prefix}${grouped}${suffix}`
  }

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return
      if (prefersReducedMotion()) {
        el.textContent = format(to)
        return
      }
      const obj = { val: from }
      el.textContent = format(from)
      gsap.to(obj, {
        val: to,
        duration,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = format(obj.val)
        },
      })
    },
    { scope: ref, dependencies: [to] }
  )

  return (
    <span ref={ref} className={className}>
      {format(to)}
    </span>
  )
}

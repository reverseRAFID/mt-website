'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { CornerTicks } from '@/components/ui/CornerTicks'
import type { MemberAchievement } from '@/lib/cms/types'

/**
 * Vertical achievement timeline. The spine draws downward as you scroll through
 * (transform-only scaleY scrub), nodes light up and cards slide in. Renders
 * static and fully legible under reduced-motion. Self-contained list — the page
 * supplies the section heading.
 */
export function AchievementTimeline({ items }: { items: MemberAchievement[] }) {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const spine = el.querySelector<HTMLElement>('[data-ach-spine]')
      const nodes = el.querySelectorAll<HTMLElement>('[data-ach-node]')
      const cards = el.querySelectorAll<HTMLElement>('[data-ach-card]')

      if (spine) {
        gsap.fromTo(
          spine,
          { scaleY: 0 },
          {
            scaleY: 1,
            transformOrigin: 'top center',
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top 72%', end: 'bottom 72%', scrub: true },
          }
        )
      }
      gsap.from(cards, {
        opacity: 0,
        x: -14,
        y: 10,
        duration: 0.6,
        stagger: 0.12,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      })
      gsap.from(nodes, {
        scale: 0,
        duration: 0.45,
        stagger: 0.12,
        ease: 'back.out(2.2)',
        scrollTrigger: { trigger: el, start: 'top 78%', once: true },
      })
    },
    { scope: ref, dependencies: [items.length] }
  )

  return (
    <div ref={ref} className="relative pl-7 sm:pl-8">
      {/* spine: static track + animated fill */}
      <div aria-hidden className="absolute left-[6px] top-1.5 bottom-1.5 w-px bg-divider sm:left-[7px]" />
      <div data-ach-spine aria-hidden className="absolute left-[6px] top-1.5 bottom-1.5 w-px bg-primary sm:left-[7px]" />

      <ol className="flex flex-col gap-5">
        {items.map((a, i) => (
          <li key={`${a.title}-${i}`} className="relative">
            {/* node */}
            <span
              data-ach-node
              aria-hidden
              className="absolute -left-7 top-5 h-3 w-3 rotate-45 border border-primary bg-primary sm:-left-8"
            />
            <article
              data-ach-card
              className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.5)]"
            >
              <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" />
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h3 className="font-display text-base font-bold tracking-tight text-text">{a.title}</h3>
                {a.year != null && <span className="hud-label nums text-text-faint">{a.year}</span>}
              </div>
              {a.achievement && (
                <p className="mt-2 text-sm font-medium text-primary text-pretty">{a.achievement}</p>
              )}
              {a.details && a.details.length > 0 && (
                <ul className="mt-3 flex flex-col gap-1.5">
                  {a.details.map((d, j) => (
                    <li key={j} className="flex gap-2.5 text-sm text-text-muted leading-relaxed text-pretty">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rotate-45 bg-primary" aria-hidden />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </li>
        ))}
      </ol>
    </div>
  )
}

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
  /**
   * Optional header (eyebrow / title) that travels WITH the pinned stage on
   * desktop so the section reads as one deliberate set-piece. On touch/mobile
   * it simply renders above the swipe row.
   */
  header?: ReactNode
  /**
   * Total number of "slides" — when provided, a HUD index readout (`03 / 08`)
   * tracks scroll progress on desktop. Pass the real item count (exclude any
   * trailing spacer children).
   */
  count?: number
}

/**
 * Pinned horizontal scroll, built as a FULL-HEIGHT, vertically-centered stage.
 * On desktop (≥1024px, fine pointer, motion allowed) the section pins for the
 * duration of the horizontal travel and the track slides sideways — a
 * cinematic reveal that FILLS the viewport instead of sticking to the top.
 * A progress rail + optional index readout add telemetry.
 *
 * CRUCIAL: the pin-only layout (full-height stage, clipped overflow, the
 * progress HUD) is applied IMPERATIVELY only while the GSAP pin is mounted.
 * The DEFAULT, JS-off, reduced-motion, coarse-pointer state at EVERY breakpoint
 * is a native horizontally-scrollable scroll-snap row — so content is never
 * clipped-and-unreachable, and the page never gets a horizontal scrollbar.
 * Direct children set their own widths (e.g. `w-[80vw] lg:w-[34vw] shrink-0`).
 */
export function HorizontalScroll({
  children,
  className,
  ariaLabel,
  trackClassName,
  header,
  count,
}: HorizontalScrollProps) {
  const rootRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const barRef = useRef<HTMLSpanElement>(null)
  const idxRef = useRef<HTMLSpanElement>(null)

  useGSAP(
    () => {
      const root = rootRef.current
      const stage = stageRef.current
      const track = trackRef.current
      const viewport = viewportRef.current
      if (!root || !stage || !track || !viewport) return

      const mm = gsap.matchMedia()

      mm.add(
        '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          // Promote to the pinned full-height stage ONLY now that the pin is
          // actually mounting. Everything here is reverted on cleanup, so the
          // fallback (no-JS / reduced-motion / coarse-pointer) stays a usable
          // native scroll row at all widths.
          stage.style.height = '100vh'
          stage.style.overflow = 'hidden'
          viewport.style.overflowX = 'hidden'
          root.style.paddingTop = '0px'
          root.style.paddingBottom = '0px'
          if (progressRef.current) progressRef.current.style.display = 'flex'

          // Horizontal overflow that must scroll past, measured live so it
          // survives resizes / font + image settling (invalidateOnRefresh).
          const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth)

          const pad = (n: number) => String(n).padStart(2, '0')
          const total = count ?? 0

          // Cards that opt into nearest-center emphasis (no-op when absent, so
          // every other caller of HorizontalScroll is unaffected).
          const cards = Array.from(track.querySelectorAll<HTMLElement>('[data-hs-card]'))
          let lastActive = -1

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
              onUpdate: (self) => {
                if (barRef.current) {
                  barRef.current.style.transform = `scaleX(${self.progress})`
                }
                if (idxRef.current && total > 0) {
                  const active = Math.min(
                    total,
                    Math.max(1, Math.round(self.progress * (total - 1)) + 1)
                  )
                  idxRef.current.textContent = `${pad(active)} / ${pad(total)}`
                }
                if (cards.length) {
                  const a = Math.round(self.progress * (cards.length - 1))
                  if (a !== lastActive) {
                    cards.forEach((c, i) =>
                      c.setAttribute('data-active', i === a ? 'true' : 'false')
                    )
                    lastActive = a
                  }
                }
              },
            },
          })

          return () => {
            tween.scrollTrigger?.kill()
            tween.kill()
            gsap.set(track, { clearProps: 'x' })
            // Restore the native scroll-row fallback.
            stage.style.height = ''
            stage.style.overflow = ''
            viewport.style.overflowX = ''
            root.style.paddingTop = ''
            root.style.paddingBottom = ''
            if (progressRef.current) progressRef.current.style.display = ''
            cards.forEach((c) => c.removeAttribute('data-active'))
          }
        }
      )

      return () => mm.revert()
    },
    { scope: rootRef }
  )

  return (
    <section ref={rootRef} aria-label={ariaLabel} className={cn('relative max-w-full', className)}>
      {/* Default = native scroll row (flow). The matchMedia callback promotes
          this to a pinned full-height centered stage only when the pin mounts. */}
      <div ref={stageRef} className="flex flex-col justify-center">
        {header && <div className="section-container w-full shrink-0">{header}</div>}

        <div
          ref={viewportRef}
          className="max-w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div
            ref={trackRef}
            className={cn('flex will-change-transform', trackClassName)}
          >
            {children}
          </div>
        </div>

        {/* Progress telemetry — revealed (display:flex) only while pinned. */}
        <div
          ref={progressRef}
          aria-hidden
          className="section-container mt-6 hidden w-full shrink-0 items-center gap-4"
        >
          <span className="relative h-px flex-1 overflow-hidden bg-divider">
            <span
              ref={barRef}
              className="absolute inset-0 origin-left scale-x-0 bg-primary will-change-transform"
            />
          </span>
          {count ? (
            <span ref={idxRef} className="hud-label nums shrink-0 text-text-faint">
              {`01 / ${String(count).padStart(2, '0')}`}
            </span>
          ) : (
            <span className="hud-label inline-flex shrink-0 items-center gap-2 text-text-faint">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
              Scroll
            </span>
          )}
        </div>
      </div>
    </section>
  )
}

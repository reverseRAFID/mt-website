'use client'

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { urlFor } from '@/sanity/lib/client'
import type { Testimonial } from '@/sanity/lib/types'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { Reveal } from '@/components/motion/Reveal'

interface TestimonialsProps {
  testimonials: Testimonial[]
  index?: string
  kicker?: string
  title?: string
  description?: string
}

const AUTOPLAY_MS = 6500

function PersonGlyph() {
  return (
    <svg
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      className="text-text-faint"
      aria-hidden
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}

/**
 * Advisor testimonials — a kinetic, fully-responsive quote carousel that
 * showcases what mentors say about Mongol-Tori. Featured on the Home and About
 * pages. Gracefully handles a single quote (static, no controls) or many
 * (autoplaying carousel with prev/next, dots, keyboard arrows, and swipe).
 * Motion is GSAP-driven and fully disabled under prefers-reduced-motion.
 */
export function Testimonials({
  testimonials,
  index,
  kicker = 'Advisors',
  title = 'Our advisors',
  description = 'The mentors and faculty who guide Mongol-Tori on what the team is building.',
}: TestimonialsProps) {
  const count = testimonials.length
  const isCarousel = count > 1

  const rootRef = useRef<HTMLDivElement>(null)
  const slideRef = useRef<HTMLDivElement>(null)
  const animatedActive = useRef(0)
  const startX = useRef<number | null>(null)

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    setReduced(prefersReducedMotion())
  }, [])

  // Crossfade the quote in on every navigation. Only fires when `active`
  // actually changes — never on (re)mount. Comparing against the last-animated
  // index (rather than a one-shot "first run" flag) keeps this correct under
  // React Strict Mode, whose double-invoked effects would otherwise flip a flag
  // on the first pass and fire a stray animation on the second. `clearProps` +
  // `overwrite` stop useGSAP's per-change revert from flashing the old state.
  useGSAP(
    () => {
      if (animatedActive.current === active) return
      animatedActive.current = active
      if (prefersReducedMotion() || !slideRef.current) return
      gsap.fromTo(
        slideRef.current,
        { opacity: 0, y: 16 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
          overwrite: 'auto',
          clearProps: 'opacity,transform',
        }
      )
    },
    { dependencies: [active], scope: rootRef }
  )

  // Autoplay — only with 2+ quotes, paused on hover/focus and under reduced-motion.
  useEffect(() => {
    if (!isCarousel || paused || reduced) return
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % count)
    }, AUTOPLAY_MS)
    return () => window.clearInterval(id)
  }, [isCarousel, paused, reduced, count])

  if (count === 0) return null

  const go = (i: number) => setActive(((i % count) + count) % count)
  const next = () => go(active + 1)
  const prev = () => go(active - 1)

  const onKeyDown = (e: KeyboardEvent) => {
    if (!isCarousel) return
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      prev()
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      next()
    }
  }

  const onPointerDown = (e: PointerEvent) => {
    if (!isCarousel) return
    startX.current = e.clientX
  }
  const onPointerUp = (e: PointerEvent) => {
    if (!isCarousel || startX.current === null) return
    const dx = e.clientX - startX.current
    startX.current = null
    if (Math.abs(dx) < 40) return
    if (dx > 0) prev()
    else next()
  }

  const t = testimonials[active]
  const meta = [t.role, t.organization].filter(Boolean).join(' · ')

  return (
    <section className="relative overflow-hidden border-y border-divider bg-surface py-20 lg:py-28">
      {/* signature backdrop */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full glow-orange blur-[130px] opacity-50"
      />

      <div className="section-container relative">
        <Reveal>
          <SectionHeader index={index} kicker={kicker} title={title} description={description} align="center" />
        </Reveal>

        <Reveal className="relative mx-auto mt-12 max-w-4xl lg:mt-16">
          <div
            ref={rootRef}
            role="group"
            aria-roledescription={isCarousel ? 'carousel' : undefined}
            aria-label="Advisor testimonials"
            onKeyDown={onKeyDown}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
          >
          <div
            className="relative rounded-card border border-divider bg-surface-raised p-8 sm:p-10 lg:p-14"
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            style={isCarousel ? { touchAction: 'pan-y' } : undefined}
          >
            <CornerTicks className="text-primary/30" size="md" />

            {/* oversized decorative quotation mark */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-6 top-2 select-none font-display text-[7rem] leading-none text-primary/15 sm:text-[9rem]"
            >
              &ldquo;
            </span>

            {/* progress HUD */}
            {isCarousel && (
              <span className="hud-label nums absolute right-5 top-5 text-text-faint">
                {String(active + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
              </span>
            )}

            <div
              ref={slideRef}
              aria-live={!isCarousel || reduced || paused ? 'polite' : 'off'}
              className="relative"
            >
              <blockquote className="relative pt-8 sm:pt-6">
                <p className="text-balance font-display text-xl font-medium leading-snug text-text sm:text-2xl lg:text-[1.75rem]">
                  {t.quote}
                </p>
              </blockquote>

              <figcaption className="mt-8 flex items-center gap-4">
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-card border border-divider bg-surface-2 sm:h-14 sm:w-14">
                  {t.photo ? (
                    <Image
                      src={urlFor(t.photo).width(160).height(160).url()}
                      alt={t.name}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : (
                    <span className="absolute inset-0 grid place-items-center">
                      <PersonGlyph />
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-display text-base font-bold leading-tight text-text">
                    {t.link ? (
                      <Link
                        href={t.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="link-underline transition-colors hover:text-primary"
                      >
                        {t.name}
                      </Link>
                    ) : (
                      t.name
                    )}
                  </p>
                  {meta && <p className="mt-0.5 text-sm text-text-muted">{meta}</p>}
                </div>
              </figcaption>
            </div>
          </div>

          {/* controls */}
          {isCarousel && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous testimonial"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-none border border-divider text-text-muted transition-colors duration-150 hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {testimonials.map((item, i) => (
                  <button
                    key={item._id}
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === active ? 'true' : undefined}
                    aria-label={`Show testimonial ${i + 1}`}
                    className="group grid h-11 w-6 cursor-pointer place-items-center rounded-none focus-visible:outline-none"
                  >
                    <span
                      aria-hidden
                      className={`h-1.5 rounded-none transition-all duration-300 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2 group-focus-visible:ring-offset-surface ${
                        i === active ? 'w-6 bg-primary' : 'w-1.5 bg-divider group-hover:bg-text-faint'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={next}
                aria-label="Next testimonial"
                className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-none border border-divider text-text-muted transition-colors duration-150 hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

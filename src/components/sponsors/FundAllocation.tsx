'use client'

import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { FUND_ALLOCATION, sponsorMailto } from '@/lib/sponsorship'

/**
 * "Where your sponsorship goes" — the transparency section. Allocation bars
 * grow on scroll-in (transform-only `scaleX`, so no reflow); under
 * reduced-motion they simply render full. The split is editorial — see
 * FUND_ALLOCATION in lib/sponsorship.ts.
 */
export function FundAllocation() {
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      const fills = el.querySelectorAll<HTMLElement>('[data-fund-fill]')
      gsap.set(fills, { scaleX: 0, transformOrigin: 'left center' })
      gsap.to(fills, {
        scaleX: 1,
        duration: 1.1,
        ease: 'power2.out',
        stagger: 0.12,
        scrollTrigger: { trigger: el, start: 'top 80%', once: true },
      })
    },
    { scope: ref }
  )

  return (
    <section className="relative py-20 lg:py-28">
      <GhostText text="FUNDING" drift="right" />
      <div className="section-container relative">
        <SectionHeader
          index="06"
          kicker="Full transparency"
          title="Where your sponsorship goes"
          description="No hidden costs. Every contribution feeds directly into building rovers and getting them to the start line — here’s the breakdown."
          className="mb-12 lg:mb-16"
        />

        <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-16">
          {/* Allocation bars */}
          <div ref={ref} className="flex flex-col gap-7">
            {FUND_ALLOCATION.map((slice) => (
              <div key={slice.label}>
                <div className="mb-2 flex items-baseline justify-between gap-4">
                  <span className="font-display text-base font-bold text-text sm:text-lg">{slice.label}</span>
                  <span className="font-display text-2xl font-bold text-primary nums">{slice.percent}%</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-none bg-surface-2">
                  <div
                    data-fund-fill
                    style={{ width: `${slice.percent}%` }}
                    className="h-full rounded-none bg-primary"
                  />
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-muted text-pretty">{slice.detail}</p>
              </div>
            ))}
          </div>

          {/* Accountability note */}
          <Reveal y={32}>
            <div className="relative h-full overflow-hidden rounded-card border border-divider bg-surface-raised p-7">
              <CornerTicks className="text-primary/40" size="md" />
              <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-30" />
              <div className="relative flex h-full flex-col">
                <span className="hud-label text-primary">Accountable to you</span>
                <h3 className="mt-3 font-display text-xl font-bold text-text sm:text-2xl">
                  Every taka is accounted for
                </h3>
                <p className="mt-3 flex-1 leading-relaxed text-text-muted text-pretty">
                  We keep a clear record of how sponsorship is spent and are glad to share a detailed budget and post-season report with our partners.
                </p>
                <a
                  href={sponsorMailto()}
                  className="mt-6 inline-flex min-h-[44px] w-fit items-center gap-2 rounded-none border border-border px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  Request a budget
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap } from '@/lib/gsap'
import { Parallax } from '@/components/motion/Parallax'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from './SectionEyebrow'
import { media } from '@/lib/cms/media'
import type { RoverSubsystem } from '@/lib/cms/types'
import { SUBTEAM_COLORS, labelFor, pad2 } from './roverHelpers'

function SubsystemRow({ subsystem, index }: { subsystem: RoverSubsystem; index: number }) {
  const flip = index % 2 === 1
  const badge = subsystem.subTeam ? SUBTEAM_COLORS[subsystem.subTeam] : undefined
  const highlights = (subsystem.highlights ?? []).slice(0, 7)
  const frameRef = useRef<HTMLDivElement>(null)

  // One-shot vertical inspection scan across the media on scroll-in.
  useGSAP(
    () => {
      const frame = frameRef.current
      if (!frame) return
      const scan = frame.querySelector<HTMLElement>('[data-sys-scan]')
      if (!scan) return
      const mm = gsap.matchMedia()
      mm.add(
        '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const tween = gsap.fromTo(
            scan,
            { y: 0, opacity: 0.8 },
            {
              y: frame.offsetHeight,
              opacity: 0,
              ease: 'power1.in',
              duration: 1.1,
              scrollTrigger: { trigger: frame, start: 'top 75%', once: true },
            }
          )
          return () => tween.scrollTrigger?.kill()
        }
      )
      return () => mm.revert()
    },
    { scope: frameRef }
  )

  return (
    <div className="grid items-center gap-8 border-t border-divider py-12 lg:grid-cols-2 lg:gap-14 lg:py-16">
      {/* Media */}
      <div className={flip ? 'lg:order-last' : ''}>
        <TiltCard max={5}>
          <div ref={frameRef} className="group relative aspect-[4/3] overflow-hidden rounded-card border border-divider bg-surface-2">
            {subsystem.image ? (
              <Parallax speed={0.22} className="absolute -inset-y-[11%] inset-x-0">
                <Image
                  src={media(subsystem.image)?.url ?? ''}
                  alt={subsystem.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </Parallax>
            ) : (
              <>
                <div aria-hidden className="absolute inset-0 tech-grid-sm opacity-50" />
                <div aria-hidden className="absolute inset-0 flex items-center justify-center">
                  <span className="font-display text-[34vw] font-bold leading-none tracking-tighter text-text/[0.05] lg:text-[12vw]">
                    {pad2(index + 1)}
                  </span>
                </div>
              </>
            )}
            <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/40 to-transparent" />
            <span className="absolute left-3 top-3 hud-label nums text-text-faint [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
              SYS.{pad2(index + 1)}
            </span>
            {subsystem.subTeam && (
              <span className={`absolute bottom-3 left-3 rounded-none px-2 py-0.5 text-[10px] font-semibold ${badge ?? 'bg-surface-2 text-text-faint'}`}>
                {labelFor(subsystem.subTeam)}
              </span>
            )}
            <span
              data-sys-scan
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-primary/30 to-transparent opacity-0"
            />
            <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/45" />
          </div>
        </TiltCard>
      </div>

      {/* Content */}
      <Reveal stagger={0.07} y={20}>
        <div className="mb-4 flex items-center gap-2.5">
          <span className="font-mono text-sm font-medium text-primary/70 nums">{pad2(index + 1)}</span>
          <span className="h-px w-8 bg-divider" aria-hidden />
          <span className="hud-label text-text-faint">Subsystem</span>
        </div>
        <h3 className="font-display text-2xl font-bold leading-tight tracking-tight text-text sm:text-3xl lg:text-4xl">
          {subsystem.name}
        </h3>
        <p className="mt-4 max-w-xl text-pretty text-base leading-relaxed text-text-muted">
          {subsystem.summary}
        </p>
        {highlights.length > 0 && (
          <ul className="mt-6 grid gap-2.5">
            {highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rotate-45 bg-primary" aria-hidden />
                <span className="text-sm leading-relaxed text-text-muted">{h}</span>
              </li>
            ))}
          </ul>
        )}
      </Reveal>
    </div>
  )
}

export function RoverSubsystems({
  subsystems,
  index = '02',
}: {
  subsystems: RoverSubsystem[]
  index?: string
}) {
  if (!subsystems || subsystems.length === 0) return null

  return (
    <section className="relative py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <SectionEyebrow index={index} label="Engineering" className="mb-3" />
          <h2 className="max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-4xl lg:text-5xl">
            Built subsystem by subsystem
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted text-pretty">
            Every discipline on the team owns a slice of the machine. Here is how each one comes together.
          </p>
        </Reveal>

        <div className="mt-6">
          {subsystems.map((s, i) => (
            <SubsystemRow key={`${s.name}-${i}`} subsystem={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

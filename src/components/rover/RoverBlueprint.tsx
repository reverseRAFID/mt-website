'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion, isFinePointer } from '@/lib/gsap'
import { Reveal } from '@/components/motion/Reveal'
import { Scramble } from '@/components/motion/Scramble'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from './SectionEyebrow'
import { file, media } from '@/lib/cms/media'
import type { DiagramAnnotation, Media, UploadedFile } from '@/lib/cms/types'
import { pad2 } from './roverHelpers'

const clamp = (n: number) => Math.max(0, Math.min(100, n))

interface RoverBlueprintProps {
  diagrams?: (string | Media)[] | null
  annotations?: DiagramAnnotation[] | null
  cadModel?: string | UploadedFile | null
  name: string
  year: number
  index?: string
}

/**
 * The Teardown — an interactive annotated blueprint built on the previously
 * unused `diagrams` + `diagramAnnotations` CMS data. Three-rung graceful
 * ladder: (a) diagrams + annotations -> full interactive hotspot probe;
 * (b) diagrams only -> static framed schematic plate(s); (c) no diagrams ->
 * renders nothing. A visually-hidden <dl> mirrors every callout in all modes,
 * so the information is never trapped behind interaction.
 */
export function RoverBlueprint({
  diagrams,
  annotations,
  cadModel,
  name,
  year,
  index = '02',
}: RoverBlueprintProps) {
  const plates = diagrams ?? []
  const notes = (annotations ?? []).filter(
    (a) => a && typeof a.xPercent === 'number' && typeof a.yPercent === 'number'
  )
  const [plate, setPlate] = useState(0)
  // active = the callout being shown; pinned = locked by click/keyboard.
  const [active, setActive] = useState<number | null>(null)
  const [pinned, setPinned] = useState(false)
  // While the one-time auto-tour drives selection, silence the aria-live region
  // so screen readers only announce user-initiated node selections.
  const [touring, setTouring] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGLineElement>(null)
  const nodeRefs = useRef<Array<HTMLButtonElement | null>>([])
  const touringRef = useRef(false)

  const cadUrl = file(cadModel)?.url ?? undefined
  const interactive = plates.length > 0 && notes.length > 0

  // ── Leader line: connect the active node to the readout panel (desktop) ──
  const drawLine = useCallback(
    (i: number | null) => {
      const line = lineRef.current
      const container = containerRef.current
      const panel = panelRef.current
      if (!line || !container || !panel) return
      if (i === null || !isFinePointer()) {
        line.style.opacity = '0'
        return
      }
      const node = nodeRefs.current[i]
      if (!node) return
      const c = container.getBoundingClientRect()
      const n = node.getBoundingClientRect()
      const p = panel.getBoundingClientRect()
      const x1 = n.left + n.width / 2 - c.left
      const y1 = n.top + n.height / 2 - c.top
      const x2 = p.left - c.left
      const y2 = p.top - c.top + 28
      line.setAttribute('x1', String(x1))
      line.setAttribute('y1', String(y1))
      line.setAttribute('x2', String(x2))
      line.setAttribute('y2', String(y2))
      line.style.opacity = '1'
      const len = Math.hypot(x2 - x1, y2 - y1)
      line.style.strokeDasharray = String(len)
      if (prefersReducedMotion()) {
        line.style.strokeDashoffset = '0'
      } else {
        gsap.fromTo(
          line,
          { strokeDashoffset: len },
          { strokeDashoffset: 0, duration: 0.25, ease: 'power2.out' }
        )
      }
    },
    []
  )

  useEffect(() => {
    drawLine(active)
    const onResize = () => drawLine(active)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [active, plate, drawLine])

  const select = useCallback((i: number, lock: boolean) => {
    touringRef.current = false
    setTouring(false)
    setActive(i)
    if (lock) setPinned(true)
  }, [])

  const clearHover = useCallback(() => {
    if (!pinned) setActive(null)
  }, [pinned])

  // Keyboard: roving focus across nodes, Enter/Space pins, Esc releases.
  const onNodeKey = useCallback(
    (e: React.KeyboardEvent, i: number) => {
      const n = notes.length
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        const next = (i + 1) % n
        nodeRefs.current[next]?.focus()
        select(next, false)
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = (i - 1 + n) % n
        nodeRefs.current[prev]?.focus()
        select(prev, false)
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        select(i, true)
      } else if (e.key === 'Escape') {
        setPinned(false)
        setActive(null)
      }
    },
    [notes.length, select]
  )

  // ── One-time auto-tour on scroll-in (desktop, motion allowed) ──
  useGSAP(
    () => {
      if (!interactive) return
      const mm = gsap.matchMedia()
      mm.add(
        '(min-width: 1024px) and (pointer: fine) and (prefers-reduced-motion: no-preference)',
        () => {
          const tl = gsap.timeline({
            scrollTrigger: { trigger: containerRef.current, start: 'top 65%', once: true },
            onStart: () => {
              touringRef.current = true
              setTouring(true)
            },
          })
          notes.forEach((_, i) => {
            tl.call(
              () => {
                if (touringRef.current) setActive(i)
              },
              [],
              i === 0 ? 0.2 : `+=0.9`
            )
          })
          tl.call(
            () => {
              if (touringRef.current) {
                setActive(null)
                touringRef.current = false
                setTouring(false)
              }
            },
            [],
            '+=1.1'
          )
          return () => tl.scrollTrigger?.kill()
        }
      )
      return () => mm.revert()
    },
    { scope: containerRef, dependencies: [interactive, notes.length] }
  )

  if (plates.length === 0) return null

  const activeNote = active !== null ? notes[active] : null

  return (
    <section className="relative overflow-hidden border-t border-divider py-16 lg:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid opacity-40" />
      <div className="section-container relative">
        <Reveal>
          <SectionEyebrow index={index} label="The Teardown" className="mb-3" />
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="max-w-3xl text-balance font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
              Inside {name}, component by component
            </h2>
            <span className="hud-label nums text-text-faint">
              {year} · SCHEMATIC // {pad2(notes.length)} PTS
            </span>
          </div>
          {interactive && (
            <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-text-muted">
              Probe the annotated build —{' '}
              <span className="text-text">hover, tap, or arrow-key</span> between nodes to read out
              each system.
            </p>
          )}
        </Reveal>

        <div
          ref={containerRef}
          className="relative mt-10 grid gap-6 lg:mt-14 lg:grid-cols-[1.55fr_1fr] lg:gap-8"
        >
          {/* ── Plate + hotspots ── */}
          <div>
            <div className="scanlines relative aspect-[16/10] w-full overflow-hidden rounded-card border border-divider bg-surface-2">
              <Image
                src={media(plates[plate])?.url ?? ''}
                alt={`${name} schematic${plates.length > 1 ? ` ${plate + 1}` : ''}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
              {/* faux axis rulers */}
              <span aria-hidden className="absolute left-3 top-3 hud-label nums text-text-faint">
                X·Y // PLATE.{pad2(plate + 1)}
              </span>
              <CornerTicks className="text-primary/35" size="md" />

              {/* hotspot nodes */}
              {interactive &&
                notes.map((a, i) => {
                  const isActive = active === i
                  const dim = active !== null && !isActive
                  return (
                    <button
                      key={`${a.label}-${i}`}
                      ref={(el) => {
                        nodeRefs.current[i] = el
                      }}
                      type="button"
                      tabIndex={active === null ? (i === 0 ? 0 : -1) : isActive ? 0 : -1}
                      aria-label={a.label}
                      aria-pressed={pinned && isActive}
                      onMouseEnter={() => isFinePointer() && select(i, false)}
                      onMouseLeave={clearHover}
                      onFocus={() => select(i, false)}
                      onClick={() => select(i, true)}
                      onKeyDown={(e) => onNodeKey(e, i)}
                      style={{ left: `${clamp(a.xPercent)}%`, top: `${clamp(a.yPercent)}%` }}
                      className="group/node absolute z-10 -translate-x-1/2 -translate-y-1/2 outline-none"
                    >
                      <span
                        className={`relative flex h-3.5 w-3.5 rotate-45 items-center justify-center border transition-all duration-300 ${
                          isActive
                            ? 'scale-125 border-primary bg-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.25)]'
                            : 'border-primary/70 bg-bg group-hover/node:border-primary group-focus-visible/node:border-primary'
                        } ${dim ? 'opacity-30' : 'opacity-100'} ${!isActive ? 'animate-pulse-glow' : ''}`}
                      >
                        <span
                          aria-hidden
                          className={`absolute -inset-2 -rotate-45 rounded-full border border-primary/40 transition-opacity duration-300 ${
                            isActive ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </span>
                    </button>
                  )
                })}
            </div>

            {/* plate switcher */}
            {plates.length > 1 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {plates.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setPlate(i)
                      setActive(null)
                      setPinned(false)
                    }}
                    aria-pressed={plate === i}
                    aria-label={`Show schematic plate ${i + 1}`}
                    className={`hud-label nums rounded-none border px-3 py-1.5 transition-colors ${
                      plate === i
                        ? 'border-primary bg-primary text-on-accent'
                        : 'border-divider text-text-faint hover:border-primary/50 hover:text-primary'
                    }`}
                  >
                    {pad2(i + 1)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Readout panel (desktop / tablet) ── */}
          <div className="hidden lg:block">
            <div
              ref={panelRef}
              className="relative flex min-h-[18rem] flex-col rounded-card border border-divider bg-surface-raised p-6 lg:sticky lg:top-24"
              aria-live={touring ? 'off' : 'polite'}
            >
              <CornerTicks className="text-primary/25" />
              <div className="flex items-center gap-2.5">
                <span
                  className={`h-1.5 w-1.5 rounded-none transition-colors ${
                    activeNote ? 'bg-primary animate-pulse-glow' : 'bg-text-faint'
                  }`}
                  aria-hidden
                />
                <span className="hud-label text-text-faint">
                  {activeNote ? `Node ${pad2((active ?? 0) + 1)} / ${pad2(notes.length)}` : 'Readout // Standby'}
                </span>
              </div>

              {activeNote ? (
                <div className="mt-6">
                  <Scramble
                    key={active}
                    as="h3"
                    text={activeNote.label}
                    className="block font-display text-2xl font-bold leading-tight tracking-tight text-text"
                  />
                  {activeNote.description && (
                    <p className="mt-3 text-pretty text-sm leading-relaxed text-text-muted">
                      {activeNote.description}
                    </p>
                  )}
                </div>
              ) : (
                <p className="mt-6 max-w-xs text-pretty text-sm leading-relaxed text-text-faint">
                  {interactive
                    ? 'Select a node on the schematic to read its system breakdown.'
                    : 'Annotated readout will appear once schematic points are published.'}
                </p>
              )}

              {cadUrl && (
                <a
                  href={cadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-auto inline-flex items-center justify-between gap-3 rounded-none border border-border px-4 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <span className="inline-flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                    </svg>
                    Download CAD
                  </span>
                  <span className="hud-label text-text-faint">.MODEL</span>
                </a>
              )}
            </div>
          </div>

          {/* leader line overlay — child of the grid (not the clipped plate)
              so it can span the gap from a node across to the readout panel. */}
          {interactive && (
            <svg
              aria-hidden
              className="pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
              style={{ overflow: 'visible' }}
            >
              <line
                ref={lineRef}
                stroke="rgb(var(--primary-rgb))"
                strokeWidth="1"
                strokeDasharray="4 4"
                style={{ opacity: 0 }}
              />
            </svg>
          )}
        </div>

        {/* CAD download for mobile (panel is desktop-only) */}
        {cadUrl && (
          <a
            href={cadUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-none border border-border px-4 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary lg:hidden"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
            </svg>
            Download CAD model
          </a>
        )}

        {/* Always-rendered, screen-reader / no-JS complete readout. */}
        {notes.length > 0 && (
          <dl className="sr-only">
            {notes.map((a, i) => (
              <div key={`${a.label}-sr-${i}`}>
                <dt>
                  {pad2(i + 1)}. {a.label}
                </dt>
                {a.description && <dd>{a.description}</dd>}
              </div>
            ))}
          </dl>
        )}
      </div>

      {/* Mobile bottom-sheet callout */}
      {interactive && activeNote && (
        <div className="fixed inset-x-0 bottom-0 z-50 lg:hidden" role="dialog" aria-label={activeNote.label}>
          <div className="relative m-3 rounded-card border border-divider bg-surface-raised p-5 shadow-[0_-12px_40px_-20px_rgba(0,0,0,0.6)]">
            <CornerTicks className="text-primary/25" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="hud-label text-primary">
                  Node {pad2((active ?? 0) + 1)} / {pad2(notes.length)}
                </span>
                <h3 className="mt-1.5 font-display text-lg font-bold leading-tight tracking-tight text-text">
                  {activeNote.label}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPinned(false)
                  setActive(null)
                }}
                aria-label="Close readout"
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            {activeNote.description && (
              <p className="mt-2 text-pretty text-sm leading-relaxed text-text-muted">
                {activeNote.description}
              </p>
            )}
          </div>
        </div>
      )}
    </section>
  )
}

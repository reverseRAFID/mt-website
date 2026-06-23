'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { urlFor } from '@/sanity/lib/client'
import type { RoverCrewMember } from '@/sanity/lib/types'
import { SUBTEAM_COLORS, labelFor } from './roverHelpers'

const effectiveTeam = (c: RoverCrewMember) => c.subTeamOverride ?? c.member.subTeam ?? 'other'

function CrewCard({ crew }: { crew: RoverCrewMember }) {
  const { member, contribution } = crew
  const team = effectiveTeam(crew)
  const badge = team !== 'other' ? SUBTEAM_COLORS[team] : undefined

  return (
    <Link
      href={`/team/${member.slug.current}`}
      data-crew-card
      className="group relative flex flex-col overflow-hidden rounded-card border border-divider bg-surface-raised transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_22px_50px_-28px_rgba(var(--primary-rgb),0.6)]"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2 scanlines">
        {member.photo ? (
          <Image
            src={urlFor(member.photo).width(360).height(450).url()}
            alt={member.name}
            fill
            className="object-cover grayscale transition-all duration-500 group-hover:scale-[1.05] group-hover:grayscale-0"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center tech-grid-sm opacity-60">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-text-faint" aria-hidden>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
        )}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
        {member.isAlumni && (
          <span className="absolute right-3 top-3 hud-label text-[9px] text-white/90 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">ALUM</span>
        )}
        <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/60" />
        <div className="absolute inset-x-0 bottom-0 p-3.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.8)]">
          <h3 className="line-clamp-1 font-display text-base font-bold leading-tight text-white">{member.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{contribution ?? member.role ?? 'Crew'}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2 px-3.5 py-3">
        {team !== 'other' ? (
          <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold ${badge ?? 'bg-surface-2 text-text-faint'}`}>
            {labelFor(team)}
          </span>
        ) : (
          <span className="hud-label text-text-faint">Crew</span>
        )}
        <span className="hud-label inline-flex items-center gap-1 text-text-faint transition-colors group-hover:text-primary">
          View
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </span>
      </div>
    </Link>
  )
}

function CrewGrid({ crew, filterKey }: { crew: RoverCrewMember[]; filterKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      gsap.fromTo(
        el.querySelectorAll('[data-crew-card]'),
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.04, ease: 'power3.out' }
      )
    },
    { scope: ref, dependencies: [filterKey] }
  )
  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {crew.map((c) => (
        <CrewCard key={c.member._id} crew={c} />
      ))}
    </div>
  )
}

export function RoverCrew({
  crew,
  roverName,
  index = '07',
}: {
  crew: RoverCrewMember[]
  roverName: string
  index?: string
}) {
  const [filter, setFilter] = useState('all')

  const teams = useMemo(() => {
    const counts = new Map<string, number>()
    for (const c of crew) {
      const t = effectiveTeam(c)
      if (t !== 'other') counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [crew])

  if (!crew || crew.length === 0) return null

  const shown = filter === 'all' ? crew : crew.filter((c) => effectiveTeam(c) === filter)

  return (
    <section className="relative border-t border-divider bg-surface py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>The Crew
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
            The minds behind {roverName}
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted text-pretty">
            {crew.length} engineers across every sub-team. Filter by discipline to see who built what.
          </p>
        </Reveal>

        {/* Sub-team tab filter */}
        {teams.length > 0 && (
          <div className="mb-9 mt-8 flex flex-wrap items-center gap-2">
            <span className="hud-label mr-1 text-text-faint">Sub-team //</span>
            <FilterChip label="All" count={crew.length} active={filter === 'all'} onClick={() => setFilter('all')} />
            {teams.map(([key, n]) => (
              <FilterChip key={key} label={labelFor(key)} count={n} active={filter === key} onClick={() => setFilter(key)} />
            ))}
          </div>
        )}

        {shown.length > 0 ? (
          <CrewGrid crew={shown} filterKey={filter} />
        ) : (
          <div className="py-12 text-center text-text-muted">
            No crew in <span className="text-primary">{labelFor(filter)}</span> for this rover.
          </div>
        )}
      </div>
    </section>
  )
}

function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string
  count: number
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 rounded-none border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 ${
        active
          ? 'border-primary bg-primary text-on-accent'
          : 'border-divider text-text-muted hover:border-primary/50 hover:text-primary'
      }`}
    >
      {label}
      <span className={`hud-label ${active ? 'text-on-accent/80' : 'text-text-faint'}`}>{count}</span>
    </button>
  )
}

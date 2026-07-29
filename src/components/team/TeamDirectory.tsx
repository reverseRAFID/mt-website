'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { useGSAP } from '@gsap/react'
import { gsap, prefersReducedMotion } from '@/lib/gsap'
import { media } from '@/lib/cms/media'
import type { Member } from '@/lib/cms/types'
import { TiltCard } from '@/components/motion/TiltCard'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SUBTEAM_COLORS, labelFor } from '@/lib/subteam-style'

function MemberCardView({ member, index }: { member: Member; index: number }) {
  const idx = String(index + 1).padStart(2, '0')
  const subtitle = member.isAlumni && member.currentOrg ? `Now @ ${member.currentOrg}` : member.role
  return (
    <TiltCard className="h-full">
      <Link
        href={`/team/${member.slug}`}
        data-member-card
        className="group relative flex h-full flex-col overflow-hidden rounded-card border border-divider bg-surface-raised transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_22px_50px_-28px_rgba(var(--primary-rgb),0.6)] focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
      >
        <div className="relative aspect-[4/5] overflow-hidden bg-surface-2 scanlines">
          {member.photo ? (
            <Image
              src={media(member.photo)?.url ?? ''}
              alt={member.name}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            />
          ) : (
            <div className="absolute inset-0 tech-grid-sm flex items-center justify-center opacity-60">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-text-faint" aria-hidden>
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}

          {/* Always-on scrims so the white HUD + name stay legible over any photo or the
              near-white no-photo placeholder (light mode). */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

          {/* HUD: index (left) + status node (right) */}
          <span className="hud-label nums absolute left-3 top-3 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">{idx}</span>
          <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]">
            <span className={`h-1.5 w-1.5 rounded-none ${member.isAlumni ? 'bg-white/70' : 'bg-primary'}`} aria-hidden />
            <span className="hud-label text-[9px] text-white">{member.isAlumni ? 'ALUM' : 'ACTV'}</span>
          </span>
          <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/60" />

          {/* name block over image */}
          <div className="absolute inset-x-0 bottom-0 p-3.5 [text-shadow:0_1px_3px_rgba(0,0,0,0.75)]">
            <h3 className="font-display text-base font-bold leading-tight text-white line-clamp-1">{member.name}</h3>
            {subtitle && <p className="mt-0.5 line-clamp-1 text-xs text-white/85">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-3.5 py-3">
          {member.subTeam ? (
            <span className={`rounded-none px-2 py-0.5 text-[10px] font-semibold ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
              {labelFor(member.subTeam)}
            </span>
          ) : (
            <span className="hud-label text-text-faint">Member</span>
          )}
          <span className="hud-label inline-flex items-center gap-1 text-text-faint transition-colors group-hover:text-primary">
            View
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </Link>
    </TiltCard>
  )
}

function MemberGrid({ members, filterKey }: { members: Member[]; filterKey: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useGSAP(
    () => {
      const el = ref.current
      if (!el || prefersReducedMotion()) return
      gsap.fromTo(
        el.querySelectorAll('[data-member-card]'),
        { opacity: 0, y: 18, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.03, ease: 'power3.out' }
      )
    },
    { scope: ref, dependencies: [filterKey] }
  )
  return (
    <div ref={ref} className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {members.map((m, i) => (
        <MemberCardView key={m.id} member={m} index={i} />
      ))}
    </div>
  )
}

export function TeamDirectory({ members }: { members: Member[] }) {
  const [filter, setFilter] = useState<string>('all')

  const subteams = useMemo(() => {
    const counts = new Map<string, number>()
    for (const m of members) {
      if (m.subTeam) counts.set(m.subTeam, (counts.get(m.subTeam) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [members])

  const matches = (m: Member) => filter === 'all' || m.subTeam === filter
  const active = members.filter((m) => !m.isAlumni && matches(m))
  const alumni = members.filter((m) => m.isAlumni && matches(m))

  if (members.length === 0) {
    return (
      <div className="relative mx-auto max-w-xl rounded-card border border-divider bg-surface-raised px-8 py-16 text-center">
        <CornerTicks className="text-primary/25" size="md" />
        <span className="hud-label text-primary">No Crew On Record</span>
        <p className="mt-4 text-pretty leading-relaxed text-text-muted">
          The crew manifest is empty. Add members in the CMS &rarr; Team to populate the directory.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* Filter console */}
      {subteams.length > 0 && (
        <Reveal className="mb-10 flex flex-wrap items-center gap-2" stagger y={12}>
          <span className="hud-label mr-1 text-text-faint">Filter //</span>
          <FilterChip label="All" count={members.length} active={filter === 'all'} onClick={() => setFilter('all')} />
          {subteams.map(([key, count]) => (
            <FilterChip
              key={key}
              label={labelFor(key)}
              count={count}
              active={filter === key}
              onClick={() => setFilter(key)}
            />
          ))}
        </Reveal>
      )}

      {active.length > 0 && (
        <div className="mb-16">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <h2 className="hud-label text-text-muted">
              Active Members <span className="text-text-faint">[{active.length}]</span>
            </h2>
          </div>
          <MemberGrid members={active} filterKey={`active-${filter}`} />
        </div>
      )}

      {alumni.length > 0 && (
        <div className="opacity-90">
          <div className="mb-8 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-text-faint" aria-hidden />
            <h2 className="hud-label text-text-faint">
              Alumni <span className="text-text-faint/70">[{alumni.length}]</span>
            </h2>
          </div>
          <MemberGrid members={alumni} filterKey={`alumni-${filter}`} />
        </div>
      )}

      {active.length === 0 && alumni.length === 0 && (
        <div className="relative mx-auto max-w-xl rounded-card border border-divider bg-surface-raised px-8 py-14 text-center">
          <CornerTicks className="text-primary/25" size="md" />
          <span className="hud-label text-text-faint">No Match</span>
          <p className="mt-4 text-pretty leading-relaxed text-text-muted">
            No members in <span className="text-primary">{labelFor(filter)}</span> on record yet.
          </p>
          <button
            onClick={() => setFilter('all')}
            className="group mt-6 inline-flex min-h-[44px] items-center gap-2 rounded-none border border-divider px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-300 group-hover:-translate-x-0.5" aria-hidden>
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            View all members
          </button>
        </div>
      )}
    </div>
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
      onClick={onClick}
      aria-pressed={active}
      className={`group inline-flex items-center gap-2 rounded-none border px-3.5 py-1.5 text-sm font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
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

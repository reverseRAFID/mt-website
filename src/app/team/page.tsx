import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBERS_QUERY } from '@/sanity/lib/queries'
import type { MemberCard } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'The Team' }

const SUBTEAM_COLORS: Record<string, string> = {
  management: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  controls: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  mechanical: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  electronics: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  science: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  uav: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
  network: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
  autonomous: 'bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400',
  rnd: 'bg-violet-50 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
}

function MemberCard({ member }: { member: MemberCard }) {
  return (
    <Link
      href={`/team/${member.slug.current}`}
      className="group relative flex flex-col items-center rounded-card border border-divider bg-surface-raised p-5 text-center transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
    >
      {/* Framed telemetry avatar */}
      <div className="relative mb-4 rounded-xl border border-divider bg-surface-2 p-1.5">
        <div className="relative h-20 w-20 overflow-hidden rounded-lg bg-surface flex items-center justify-center">
          {member.photo ? (
            <Image
              src={urlFor(member.photo).width(160).height(160).url()}
              alt={member.name}
              fill
              className="object-cover"
              sizes="80px"
            />
          ) : (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
            </svg>
          )}
          <CornerTicks className="text-primary/0 group-hover:text-primary/50 transition-colors" />
        </div>
      </div>

      <h3 className="font-display font-bold text-sm text-text group-hover:text-primary transition-colors mb-1 line-clamp-1">
        {member.name}
      </h3>
      {member.role && (
        <p className="hud-label text-text-faint mb-2.5 line-clamp-1 normal-case tracking-normal text-[11px]">
          {member.role}
        </p>
      )}
      {member.subTeam && (
        <span className={`mt-auto text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
          {member.subTeam}
        </span>
      )}
    </Link>
  )
}

export default async function TeamPage() {
  const members = await sanityFetch<MemberCard[]>(MEMBERS_QUERY)

  const active = members?.filter((m) => !m.isAlumni) ?? []
  const alumni = members?.filter((m) => m.isAlumni) ?? []

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <SectionHeader
            kicker="Crew"
            title="The Team"
            description="Current members and alumni — the engineers, scientists, and leaders who built Mongol-Tori."
          />
        </div>
      </section>

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          {active.length === 0 && alumni.length === 0 ? (
            <div className="py-20 text-center text-text-muted">
              No members yet — add them in Sanity CMS → Team Members.
            </div>
          ) : (
            <>
              {active.length > 0 && (
                <div className="mb-16">
                  <Reveal>
                    <div className="mb-8 flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                      <h2 className="hud-label text-text-muted">Active Members</h2>
                    </div>
                  </Reveal>
                  <Reveal stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {active.map((m) => <MemberCard key={m._id} member={m} />)}
                  </Reveal>
                </div>
              )}
              {alumni.length > 0 && (
                <div className="opacity-80">
                  <Reveal>
                    <div className="mb-8 flex items-center gap-2.5">
                      <span className="h-1.5 w-1.5 rotate-45 bg-text-faint" aria-hidden />
                      <h2 className="hud-label text-text-faint">Alumni</h2>
                    </div>
                  </Reveal>
                  <Reveal stagger className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {alumni.map((m) => <MemberCard key={m._id} member={m} />)}
                  </Reveal>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

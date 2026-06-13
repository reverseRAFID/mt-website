import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBERS_QUERY } from '@/sanity/lib/queries'
import type { MemberCard } from '@/sanity/lib/types'

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
      className="group bg-surface rounded-xl border border-divider p-5 text-center hover:border-primary/40 hover:shadow-md transition-all duration-200"
    >
      <div className="w-16 h-16 rounded-full bg-surface-2 border border-divider flex items-center justify-center mx-auto mb-3 overflow-hidden relative">
        {member.photo ? (
          <Image
            src={urlFor(member.photo).width(64).height(64).url()}
            alt={member.name}
            fill
            className="object-cover"
          />
        ) : (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>
      <h3 className="font-display font-bold text-sm text-text group-hover:text-primary transition-colors mb-1 line-clamp-1">
        {member.name}
      </h3>
      {member.role && <p className="text-xs text-text-muted mb-2 line-clamp-1">{member.role}</p>}
      {member.subTeam && (
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">People</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">The Team</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Current members and alumni — the engineers, scientists, and leaders who built Mongol-Tori.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {active.length === 0 && alumni.length === 0 ? (
          <div className="py-20 text-center text-text-muted">
            No members yet — add them in Sanity CMS → Team Members.
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <>
                <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Active Members</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-14">
                  {active.map((m) => <MemberCard key={m._id} member={m} />)}
                </div>
              </>
            )}
            {alumni.length > 0 && (
              <>
                <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Alumni</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 opacity-80">
                  {alumni.map((m) => <MemberCard key={m._id} member={m} />)}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </PageLayout>
  )
}

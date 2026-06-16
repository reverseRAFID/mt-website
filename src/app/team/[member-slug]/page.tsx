import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { MemberFull } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface Props {
  params: Promise<{ 'member-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  return { title: member?.name ?? 'Member' }
}

const SUBTEAM_COLORS: Record<string, string> = {
  management: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
  software: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  mechanical: 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  electrical: 'bg-yellow-50 text-yellow-700 dark:bg-yellow-950/50 dark:text-yellow-400',
  science: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  drone: 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400',
  outreach: 'bg-pink-50 text-pink-700 dark:bg-pink-950/50 dark:text-pink-400',
}

export default async function MemberPage({ params }: Props) {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  if (!member) notFound()

  return (
    <PageLayout>
      <div className="section-container py-14 lg:py-20">
        <nav className="flex items-center gap-2 hud-label text-text-faint mb-8">
          <Link href="/team" className="hover:text-primary transition-colors">Team</Link>
          <span aria-hidden>/</span>
          <span className="text-text">{member.name}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-8 lg:gap-12 items-start">
          {/* Profile — sticky sidebar card */}
          <Reveal className="lg:sticky lg:top-24">
            <div className="relative rounded-card border border-divider bg-surface-raised p-6 sm:p-7">
              <CornerTicks className="text-primary/30" />

              <div className="flex flex-col items-center text-center sm:items-start sm:text-left">
                {/* Framed avatar */}
                <div className="relative rounded-card border border-divider bg-surface-2 p-1.5">
                  <div className="relative w-28 h-28 rounded-xl overflow-hidden bg-surface-2">
                    {member.photo ? (
                      <Image
                        src={urlFor(member.photo).width(128).height(128).url()}
                        alt={member.name}
                        fill
                        sizes="112px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 tech-grid-sm opacity-50 flex items-center justify-center">
                        <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                    <CornerTicks className="text-primary/40" />
                  </div>
                </div>

                <h1 className="mt-5 font-display font-bold text-2xl sm:text-3xl text-text tracking-tight text-balance">{member.name}</h1>
                {member.role && <p className="mt-1 text-text-muted">{member.role}</p>}

                <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
                  {member.subTeam && (
                    <span className={`hud-label px-2.5 py-1 rounded-full ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
                      {member.subTeam}
                    </span>
                  )}
                  {member.isAlumni && (
                    <span className="hud-label px-2.5 py-1 rounded-full bg-surface-2 text-text-faint">Alumni</span>
                  )}
                </div>

                {/* Social links */}
                {(member.linkedin || member.github) && (
                  <div className="mt-5 flex gap-2">
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="LinkedIn"
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-divider text-text-faint transition-colors hover:border-primary hover:text-primary"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                        </svg>
                      </a>
                    )}
                    {member.github && (
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="GitHub"
                        className="flex h-11 w-11 items-center justify-center rounded-md border border-divider text-text-faint transition-colors hover:border-primary hover:text-primary"
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                        </svg>
                      </a>
                    )}
                  </div>
                )}
              </div>

              {member.skills && member.skills.length > 0 && (
                <div className="mt-6 pt-6 border-t border-divider">
                  <h2 className="hud-label text-text-faint mb-3">Skills</h2>
                  <div className="flex flex-wrap gap-2">
                    {member.skills.map((skill) => (
                      <span key={skill} className="inline-flex items-center rounded-full bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>

          {/* Details */}
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* Competitions */}
            {member.competitions && member.competitions.length > 0 && (
              <Reveal>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">Competitions</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {member.competitions.map((comp) => (
                    <Link
                      key={comp._id}
                      href={`/competitions/${comp.slug.current}`}
                      className="group relative flex items-center justify-between gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-1.5">
                          <span className="hud-label text-primary nums">{comp.shortName} {comp.year}</span>
                          {comp.myRole && <span className="hud-label text-text-faint">{comp.myRole}</span>}
                        </div>
                        <p className="font-display font-bold text-lg text-text tracking-tight group-hover:text-primary transition-colors">{comp.name}</p>
                        {comp.result && <p className="mt-1 text-sm text-text-muted leading-relaxed">{comp.result}</p>}
                      </div>
                      {comp.rank && (
                        <span className="shrink-0 font-mono font-bold text-3xl text-primary/60 nums">#{comp.rank}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Papers */}
            {member.papers && member.papers.length > 0 && (
              <Reveal>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">Research</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {member.papers.map((paper) => (
                    <Link
                      key={paper._id}
                      href={`/research/${paper.slug.current}`}
                      className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                      <div className="hud-label text-text-faint nums mb-2">{paper.conference} · {paper.year}</div>
                      <p className="font-display font-bold text-lg text-text tracking-tight group-hover:text-primary transition-colors">{paper.title}</p>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

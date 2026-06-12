import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { MemberFull } from '@/sanity/lib/types'

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
      <div className="section-container py-14">
        <nav className="flex items-center gap-2 text-sm text-text-faint mb-8">
          <Link href="/team" className="hover:text-primary transition-colors">Team</Link>
          <span>/</span>
          <span className="text-text">{member.name}</span>
        </nav>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Profile */}
          <div className="flex flex-col items-center lg:items-start gap-4">
            <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-divider relative bg-surface-2">
              {member.photo ? (
                <Image
                  src={urlFor(member.photo).width(128).height(128).url()}
                  alt={member.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
              )}
            </div>
            <div className="text-center lg:text-left">
              <h1 className="font-display font-bold text-3xl text-text mb-1">{member.name}</h1>
              {member.role && <p className="text-text-muted mb-2">{member.role}</p>}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {member.subTeam && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
                    {member.subTeam}
                  </span>
                )}
                {member.isAlumni && (
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-surface-2 text-text-faint">Alumni</span>
                )}
              </div>
            </div>

            {/* Social links */}
            <div className="flex gap-3">
              {member.linkedin && (
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="text-text-faint hover:text-primary transition-colors" aria-label="LinkedIn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
                  </svg>
                </a>
              )}
              {member.github && (
                <a href={member.github} target="_blank" rel="noopener noreferrer" className="text-text-faint hover:text-primary transition-colors" aria-label="GitHub">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"/>
                  </svg>
                </a>
              )}
            </div>

            {member.skills && member.skills.length > 0 && (
              <div className="w-full">
                <h3 className="font-display font-semibold text-sm text-text-faint uppercase tracking-wide mb-3">Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {member.skills.map((skill) => (
                    <span key={skill} className="text-xs bg-primary-highlight text-primary px-2 py-0.5 rounded-full font-medium">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="lg:col-span-2 flex flex-col gap-8">
            {/* Competitions */}
            {member.competitions && member.competitions.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-xl text-text mb-4 accent-line">Competitions</h2>
                <div className="flex flex-col gap-3">
                  {member.competitions.map((comp) => (
                    <Link
                      key={comp._id}
                      href={`/competitions/${comp.slug.current}`}
                      className="group flex items-center justify-between bg-surface rounded-lg border border-divider p-4 hover:border-primary/40 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-xs font-semibold text-primary">{comp.shortName} {comp.year}</span>
                          {comp.myRole && <span className="text-xs text-text-faint">{comp.myRole}</span>}
                        </div>
                        <p className="text-sm font-medium text-text group-hover:text-primary transition-colors">{comp.name}</p>
                        {comp.result && <p className="text-xs text-text-muted">{comp.result}</p>}
                      </div>
                      {comp.rank && (
                        <span className="font-display font-bold text-2xl text-primary/60">#{comp.rank}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Papers */}
            {member.papers && member.papers.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-xl text-text mb-4 accent-line">Research</h2>
                <div className="flex flex-col gap-3">
                  {member.papers.map((paper) => (
                    <Link
                      key={paper._id}
                      href={`/research/${paper.slug.current}`}
                      className="group bg-surface rounded-lg border border-divider p-4 hover:border-primary/40 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-text-faint">{paper.conference} · {paper.year}</span>
                      </div>
                      <p className="text-sm font-medium text-text group-hover:text-primary transition-colors">{paper.title}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

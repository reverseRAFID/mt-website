import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { MemberFull } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Magnetic } from '@/components/motion/Magnetic'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { MemberHero, type HeroStat } from '@/components/team/MemberHero'
import { ContributionRail } from '@/components/team/ContributionRail'
import { AchievementTimeline } from '@/components/team/AchievementTimeline'
import { SUBTEAM_COLORS, labelFor } from '@/lib/subteam-style'

interface Props {
  params: Promise<{ 'member-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  if (!member) return { title: 'Member' }
  const desc = member.tagline ?? member.bio?.slice(0, 150)
  return {
    title: member.name,
    description: desc,
    openGraph: {
      title: member.name,
      description: desc,
      images: member.photo ? [urlFor(member.photo).width(1200).height(630).url()] : undefined,
    },
  }
}

function SectionTitle({ children, count }: { children: React.ReactNode; count?: number }) {
  return (
    <div className="mb-6 flex items-center gap-2.5">
      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
      <h2 className="hud-label text-primary">
        {children}
        {count != null && <span className="ml-1.5 text-text-faint">[{count}]</span>}
      </h2>
    </div>
  )
}

function safeHost(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

export default async function MemberPage({ params }: Props) {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  if (!member) notFound()

  const idCode = member._id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase()
  const subLabel = member.subTeam ? labelFor(member.subTeam) : undefined
  const photoUrl = member.photo ? urlFor(member.photo).width(440).height(440).url() : null

  // rover-> can return nulls (competition without a rover) and duplicates (member in
  // several competitions sharing a rover) — flatten to unique, defined entries.
  const rovers = Array.from(
    new Map((member.rovers ?? []).filter(Boolean).map((r) => [r._id, r])).values()
  )

  // Mirror ContributionRail's span: ignore a graduationYear that precedes joinedYear, and
  // fall back to a single season for an active member who only has joinedYear set.
  const effGrad =
    member.graduationYear != null && member.joinedYear != null && member.graduationYear < member.joinedYear
      ? undefined
      : member.graduationYear
  const seasons =
    member.yearsContributed?.length ||
    (member.joinedYear ? (effGrad ?? member.joinedYear) - member.joinedYear + 1 : undefined)

  const stats: HeroStat[] = []
  if (seasons && seasons > 0) stats.push({ label: seasons === 1 ? 'Season' : 'Seasons', value: seasons })
  if (member.competitions?.length) stats.push({ label: 'Competitions', value: member.competitions.length })
  if (member.papers?.length) stats.push({ label: member.papers.length === 1 ? 'Paper' : 'Papers', value: member.papers.length })
  if (rovers.length) stats.push({ label: rovers.length === 1 ? 'Rover' : 'Rovers', value: rovers.length })

  const hasSidebar =
    !!member.subTeam || !!member.yearOfStudy || !!member.graduationYear || !!member.joinedYear ||
    (member.focusAreas?.length ?? 0) > 0 || (member.skills?.length ?? 0) > 0 ||
    !!member.linkedin || !!member.github || !!member.website

  return (
    <PageLayout>
      <MemberHero
        name={member.name}
        role={member.role}
        tagline={member.tagline}
        subTeamKey={member.subTeam}
        subLabel={subLabel}
        isAlumni={member.isAlumni}
        currentOrg={member.currentOrg}
        photoUrl={photoUrl}
        idCode={idCode}
        stats={stats}
      />

      <ContributionRail
        joinedYear={member.joinedYear}
        graduationYear={member.graduationYear}
        yearsContributed={member.yearsContributed}
        isAlumni={member.isAlumni}
      />

      {/* ── Body ─────────────────────────────────────────── */}
      <section className="section-container py-14 lg:py-20">
        <div className={hasSidebar ? 'grid gap-10 lg:grid-cols-3 lg:gap-12' : ''}>
          {/* Sidebar — dossier */}
          {hasSidebar && (
            <Reveal className="order-last lg:order-none lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-6">
                {(member.subTeam || member.yearOfStudy || member.joinedYear || member.graduationYear) && (
                  <div className="relative rounded-card border border-divider bg-surface-raised p-5">
                    <CornerTicks className="text-primary/25" />
                    <h2 className="hud-label mb-4 text-text-faint">Dossier</h2>
                    <dl className="flex flex-col gap-3 text-sm">
                      {member.subTeam && (
                        <div className="flex items-center justify-between gap-3">
                          <dt className="hud-label text-text-faint">Sub-team</dt>
                          <dd>
                            <span className={`hud-label rounded-none px-2 py-0.5 ${SUBTEAM_COLORS[member.subTeam] ?? 'bg-surface-2 text-text-faint'}`}>
                              {subLabel}
                            </span>
                          </dd>
                        </div>
                      )}
                      {member.yearOfStudy && <Row k="Year" v={member.yearOfStudy} />}
                      {member.joinedYear && <Row k="Joined" v={String(member.joinedYear)} />}
                      {member.graduationYear && <Row k="Graduation" v={String(member.graduationYear)} />}
                    </dl>
                  </div>
                )}

                {member.focusAreas && member.focusAreas.length > 0 && (
                  <div className="rounded-card border border-divider bg-surface-raised p-5">
                    <h2 className="hud-label mb-3 text-text-faint">Focus Areas</h2>
                    <div className="flex flex-wrap gap-2">
                      {member.focusAreas.map((fa) => (
                        <span key={fa} className="inline-flex items-center gap-1.5 rounded-none border border-divider bg-surface px-2.5 py-1 text-xs font-medium text-text-muted">
                          <span className="h-1 w-1 rotate-45 bg-primary" aria-hidden />
                          {fa}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {member.skills && member.skills.length > 0 && (
                  <div className="rounded-card border border-divider bg-surface-raised p-5">
                    <h2 className="hud-label mb-3 text-text-faint">Skills / Tools</h2>
                    <div className="flex flex-wrap gap-2">
                      {member.skills.map((skill) => (
                        <span key={skill} className="inline-flex items-center rounded-none bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(member.linkedin || member.github || member.website) && (
                  <div>
                    <h2 className="hud-label mb-3 text-text-faint">Connect</h2>
                    <div className="flex gap-2.5">
                      {member.linkedin && (
                        <SocialLink href={member.linkedin} label="LinkedIn">
                          <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" /><circle cx="4" cy="4" r="2" />
                        </SocialLink>
                      )}
                      {member.github && (
                        <SocialLink href={member.github} label="GitHub">
                          <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                        </SocialLink>
                      )}
                      {member.website && (
                        <SocialLink href={member.website} label="Website">
                          <circle cx="12" cy="12" r="10" /><path d="M2 12h20" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </SocialLink>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Reveal>
          )}

          {/* Main content */}
          <div className={`flex flex-col gap-12 ${hasSidebar ? 'lg:col-span-2' : 'max-w-3xl'}`}>
            {/* About + quote */}
            {(member.bio || member.quote) && (
              <Reveal as="section">
                <SectionTitle>About</SectionTitle>
                {member.bio && <p className="text-base leading-relaxed text-text-muted text-pretty">{member.bio}</p>}
                {member.quote && (
                  <figure className="relative mt-7 rounded-card border border-divider bg-surface-raised p-6 sm:p-7">
                    <CornerTicks className="text-primary/25" />
                    <span aria-hidden className="absolute right-5 top-2 select-none font-display text-6xl leading-none text-primary/15">”</span>
                    <blockquote className="font-display text-xl italic text-text text-pretty sm:text-2xl">
                      “{member.quote}”
                    </blockquote>
                    <figcaption className="mt-3 hud-label text-text-faint">— {member.name}</figcaption>
                  </figure>
                )}
              </Reveal>
            )}

            {/* Key achievements */}
            {member.achievements && member.achievements.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={member.achievements.length}>Key Achievements</SectionTitle>
                <AchievementTimeline items={member.achievements} />
              </Reveal>
            )}

            {/* Works & projects */}
            {member.works && member.works.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={member.works.length}>Works &amp; Projects</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {member.works.map((work, i) => {
                    const host = work.url ? safeHost(work.url) : null
                    const idx = String(i + 1).padStart(2, '0')
                    const inner = (
                      <>
                        <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/40" />
                        <div className="min-w-0">
                          <span className="hud-label nums text-text-faint">{idx}</span>
                          <p className="mt-1.5 font-display text-base font-bold tracking-tight text-text transition-colors group-hover:text-primary">{work.name}</p>
                          {host && <p className="mt-0.5 truncate text-xs text-text-faint">{host}</p>}
                        </div>
                        {work.url && (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0 text-text-faint transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" aria-hidden>
                            <path d="M7 17 17 7M9 7h8v8" />
                          </svg>
                        )}
                      </>
                    )
                    const cls =
                      'group relative flex items-start justify-between gap-3 rounded-card border border-divider bg-surface-raised p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.5)]'
                    return work.url ? (
                      <a key={`${work.name}-${i}`} href={work.url} target="_blank" rel="noopener noreferrer" className={cls}>
                        {inner}
                      </a>
                    ) : (
                      <div key={`${work.name}-${i}`} className={cls}>
                        {inner}
                      </div>
                    )
                  })}
                </div>
              </Reveal>
            )}

            {/* Competitions */}
            {member.competitions && member.competitions.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={member.competitions.length}>Competitions</SectionTitle>
                <div className="flex flex-col gap-3">
                  {member.competitions.map((comp) => (
                    <Link
                      key={comp._id}
                      href={`/competitions/${comp.slug.current}`}
                      className="group relative flex items-center justify-between gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                      <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="hud-label nums text-primary">{comp.shortName} {comp.year}</span>
                          {comp.myRole && <span className="hud-label text-text-faint">{comp.myRole}</span>}
                        </div>
                        <p className="font-display text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary">{comp.name}</p>
                        {comp.result && <p className="mt-1 text-sm text-text-muted leading-relaxed">{comp.result}</p>}
                      </div>
                      {comp.rank && <span className="shrink-0 font-mono text-3xl font-bold text-primary nums">#{comp.rank}</span>}
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Research */}
            {member.papers && member.papers.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={member.papers.length}>Research</SectionTitle>
                <div className="flex flex-col gap-3">
                  {member.papers.map((paper) => (
                    <Link
                      key={paper._id}
                      href={`/research/${paper.slug.current}`}
                      className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                      <div className="hud-label nums mb-2 text-text-faint">{paper.conference ? `${paper.conference} · ` : ''}{paper.year}</div>
                      <p className="font-display text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary">{paper.title}</p>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}

            {/* Rovers built */}
            {rovers.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={rovers.length}>Rovers</SectionTitle>
                <div className="grid gap-3 sm:grid-cols-2">
                  {rovers.map((rover) => (
                    <Link
                      key={rover._id}
                      href={`/rovers/${rover.slug.current}`}
                      className="group relative flex items-center justify-between gap-3 rounded-card border border-divider bg-surface-raised p-4 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <div>
                        <p className="font-display font-bold text-text transition-colors group-hover:text-primary">{rover.name}</p>
                        <span className="hud-label nums text-text-faint">{rover.year}</span>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </Link>
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="hud-label text-text-faint">{k}</dt>
      <dd className="font-medium text-text text-right">{v}</dd>
    </div>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <Magnetic strength={0.4}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={label}
        className="flex h-11 w-11 items-center justify-center rounded-none border border-divider text-text-faint transition-colors hover:border-primary hover:text-primary"
      >
        {/* Only the LinkedIn glyph is a closed/filled path; GitHub + Website are stroke outlines. */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={label === 'LinkedIn' ? 'currentColor' : 'none'}
          stroke={label === 'LinkedIn' ? 'none' : 'currentColor'}
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {children}
        </svg>
      </a>
    </Magnetic>
  )
}

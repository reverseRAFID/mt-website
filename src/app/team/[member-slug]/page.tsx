import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { MEMBER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { MemberFull, SanityImage } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Parallax } from '@/components/motion/Parallax'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface Props {
  params: Promise<{ 'member-slug': string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  return {
    title: member?.name ?? 'Member',
    description: member?.tagline ?? member?.bio?.slice(0, 150),
  }
}

// Keys match the Sub-Team option values in the member schema.
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
const SUBTEAM_LABEL: Record<string, string> = {
  uav: 'UAV', rnd: 'R&D', autonomous: 'Autonomous', controls: 'Controls', mechanical: 'Mechanical',
  electronics: 'Electronics', science: 'Science', network: 'Network', management: 'Management',
}
const labelFor = (s: string) => SUBTEAM_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1)

const ptComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: SanityImage }) => {
      if (!value?.asset) return null
      return (
      <figure className="not-prose my-7 overflow-hidden rounded-card border border-divider bg-surface">
        <div className="relative aspect-video">
          <Image
            src={urlFor(value).width(1280).url()}
            alt={value.caption ?? ''}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 720px"
          />
        </div>
        {value.caption && (
          <figcaption className="px-4 py-2.5 text-xs text-text-faint">{value.caption}</figcaption>
        )}
      </figure>
      )
    },
  },
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

export default async function MemberPage({ params }: Props) {
  const slug = (await params)['member-slug']
  const member = await sanityFetch<MemberFull | null>(MEMBER_BY_SLUG_QUERY, { slug })
  if (!member) notFound()

  const firstName = member.name.split(' ')[0] || member.name
  const idCode = member._id.replace(/[^a-zA-Z0-9]/g, '').slice(-5).toUpperCase()
  const subLabel = member.subTeam ? labelFor(member.subTeam) : null

  // rover-> can return nulls (competition without a rover) and duplicates (member in
  // several competitions sharing a rover) — flatten to unique, defined entries.
  const rovers = Array.from(
    new Map((member.rovers ?? []).filter(Boolean).map((r) => [r._id, r])).values()
  )

  const stats: { label: string; value: string }[] = []
  if (member.joinedYear) stats.push({ label: 'Joined', value: String(member.joinedYear) })
  if (member.competitions?.length) stats.push({ label: 'Competitions', value: String(member.competitions.length) })
  if (member.papers?.length) stats.push({ label: 'Papers', value: String(member.papers.length) })
  if (subLabel) stats.push({ label: 'Sub-team', value: subLabel })

  const hasSidebar =
    !!member.subTeam || !!member.yearOfStudy || !!member.graduationYear || !!member.joinedYear ||
    (member.focusAreas?.length ?? 0) > 0 || (member.skills?.length ?? 0) > 0 ||
    !!member.linkedin || !!member.github || !!member.website

  return (
    <PageLayout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-divider py-12 sm:py-16 lg:py-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 h-[360px] w-[360px] rounded-full glow-orange blur-[120px] opacity-50" />

        {/* Parallax dimmed name watermark */}
        <Parallax
          speed={0.32}
          className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center overflow-hidden"
        >
          <span aria-hidden className="select-none whitespace-nowrap font-display text-[30vw] font-bold uppercase leading-[0.8] tracking-tighter text-text/[0.045] lg:text-[20vw]">
            {firstName}
          </span>
        </Parallax>

        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 z-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60 motion-safe:animate-[mt-scan_8s_linear_infinite]"
        />

        <div className="section-container relative z-10">
          {/* Breadcrumb + ID strip */}
          <div className="mb-8 flex items-center justify-between gap-4">
            <nav className="hud-label flex items-center gap-2 text-text-faint">
              <Link href="/team" className="transition-colors hover:text-primary">Team</Link>
              <span aria-hidden>/</span>
              <span className="text-text">{member.name}</span>
            </nav>
            <span className="hud-label nums hidden text-text-faint sm:inline">
              ID // {idCode}
            </span>
          </div>

          <Reveal className="flex flex-col items-center gap-7 text-center sm:flex-row sm:items-end sm:text-left">
            {/* Framed avatar */}
            <div className="relative shrink-0 rounded-card border border-divider bg-surface-2 p-1.5">
              <CornerTicks className="text-primary/40" size="md" />
              <div className="relative h-36 w-36 overflow-hidden rounded-xl bg-surface-2 sm:h-44 sm:w-44">
                {member.photo ? (
                  <Image
                    src={urlFor(member.photo).width(384).height(384).url()}
                    alt={member.name}
                    fill
                    sizes="176px"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center tech-grid-sm opacity-50">
                    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" className="text-text-faint" aria-hidden>
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {subLabel && (
                  <span className={`hud-label rounded-full px-2.5 py-1 ${SUBTEAM_COLORS[member.subTeam!] ?? 'bg-surface-2 text-text-faint'}`}>
                    {subLabel}
                  </span>
                )}
                <span className={`hud-label rounded-full px-2.5 py-1 ${member.isAlumni ? 'bg-surface-2 text-text-faint' : 'bg-primary-highlight text-primary'}`}>
                  {member.isAlumni ? 'Alumni' : 'Active'}
                </span>
              </div>
              <h1 className="font-display text-4xl font-bold tracking-tight text-text text-balance sm:text-5xl lg:text-6xl">
                {member.name}
              </h1>
              {member.role && <p className="mt-2 text-lg text-text-muted">{member.role}</p>}
              {member.tagline && (
                <p className="mt-2 max-w-xl text-base text-text-muted leading-relaxed text-pretty">{member.tagline}</p>
              )}
              {member.isAlumni && member.currentOrg && (
                <p className="mt-2 text-sm text-text-faint">Now @ <span className="text-text-muted">{member.currentOrg}</span></p>
              )}
            </div>
          </Reveal>

          {/* Stat tiles */}
          {stats.length > 0 && (
            <Reveal stagger className="mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.label} className="relative rounded-card border border-divider bg-surface-raised px-4 py-3.5">
                  <div className="font-display text-2xl font-bold text-primary nums">{s.value}</div>
                  <div className="hud-label mt-1 text-text-faint">{s.label}</div>
                </div>
              ))}
            </Reveal>
          )}
        </div>
      </section>

      {/* ── Body ─────────────────────────────────────────── */}
      <section className="section-container py-14 lg:py-20">
        <div className={hasSidebar ? 'grid gap-10 lg:grid-cols-3 lg:gap-12' : ''}>
          {/* Sidebar — dossier */}
          {hasSidebar && (
            <Reveal className="lg:sticky lg:top-24 lg:self-start">
              <div className="flex flex-col gap-6">
                {/* Dossier details */}
                {(member.yearOfStudy || member.graduationYear || member.joinedYear || member.subTeam) && (
                  <div className="relative rounded-card border border-divider bg-surface-raised p-5">
                    <CornerTicks className="text-primary/25" />
                    <h2 className="hud-label mb-4 text-text-faint">Dossier</h2>
                    <dl className="flex flex-col gap-3 text-sm">
                      {member.subTeam && <Row k="Sub-team" v={subLabel!} />}
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
                        <span key={fa} className="inline-flex items-center gap-1.5 rounded-full border border-divider bg-surface px-2.5 py-1 text-xs font-medium text-text-muted">
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
                        <span key={skill} className="inline-flex items-center rounded-full bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(member.linkedin || member.github || member.website) && (
                  <div className="flex gap-2">
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
                )}
              </div>
            </Reveal>
          )}

          {/* Main content */}
          <div className={`flex flex-col gap-12 ${hasSidebar ? 'lg:col-span-2' : 'max-w-3xl'}`}>
            {/* About + quote */}
            {(member.bio || member.quote) && (
              <Reveal as="section">
                <SectionTitle>Profile</SectionTitle>
                {member.bio && <p className="text-base leading-relaxed text-text-muted text-pretty">{member.bio}</p>}
                {member.quote && (
                  <blockquote className="mt-6 border-l-2 border-primary pl-4 font-display text-lg italic text-text text-pretty">
                    “{member.quote}”
                  </blockquote>
                )}
              </Reveal>
            )}

            {/* Achievements */}
            {member.achievements && member.achievements.length > 0 && (
              <Reveal as="section">
                <SectionTitle count={member.achievements.length}>Achievements</SectionTitle>
                <ol className="relative flex flex-col gap-5 border-l border-divider pl-6">
                  {member.achievements.map((a, i) => (
                    <li key={`${a.title}-${i}`} className="relative">
                      <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rotate-45 bg-primary" aria-hidden />
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h3 className="font-display text-base font-bold text-text tracking-tight">{a.title}</h3>
                        {a.year && <span className="hud-label nums text-text-faint">{a.year}</span>}
                      </div>
                      {a.detail && <p className="mt-1 text-sm text-text-muted leading-relaxed text-pretty">{a.detail}</p>}
                    </li>
                  ))}
                </ol>
              </Reveal>
            )}

            {/* Works & projects */}
            {member.personalProjects && member.personalProjects.length > 0 && (
              <Reveal as="section">
                <SectionTitle>Works &amp; Projects</SectionTitle>
                <div className="prose prose-neutral max-w-none text-text-muted dark:prose-invert prose-headings:font-display prose-headings:text-text prose-headings:tracking-tight prose-a:text-primary prose-strong:text-text prose-blockquote:border-l-primary prose-blockquote:text-text-muted prose-code:text-text">
                  <PortableText value={member.personalProjects} components={ptComponents} />
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
                      className="group relative flex items-center justify-between gap-4 rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
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
                      {comp.rank && <span className="shrink-0 font-mono text-3xl font-bold text-primary/60 nums">#{comp.rank}</span>}
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
                      className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                    >
                      <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                      <div className="hud-label nums mb-2 text-text-faint">{paper.conference} · {paper.year}</div>
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
                      className="group relative flex items-center justify-between gap-3 rounded-card border border-divider bg-surface-raised p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
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
      <dd className="font-medium text-text">{v}</dd>
    </div>
  )
}

function SocialLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-md border border-divider text-text-faint transition-colors hover:border-primary hover:text-primary"
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
  )
}

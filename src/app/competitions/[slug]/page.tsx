import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { COMPETITION_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { CompetitionFull } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { Counter } from '@/components/motion/Counter'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const comp = await sanityFetch<CompetitionFull | null>(COMPETITION_BY_SLUG_QUERY, { slug })
  return { title: comp ? `${comp.name} ${comp.year}` : 'Competition' }
}

const COMPETITION_COLORS: Record<string, string> = {
  URC: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  IRC: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  ERC: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
}

function getYouTubeEmbedUrl(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export default async function CompetitionPage({ params }: Props) {
  const { slug } = await params
  const comp = await sanityFetch<CompetitionFull | null>(COMPETITION_BY_SLUG_QUERY, { slug })
  if (!comp) notFound()

  const embedUrl = comp.sarVideo ? getYouTubeEmbedUrl(comp.sarVideo) : null

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <Reveal>
            <nav className="flex items-center gap-2 hud-label text-text-faint mb-6" aria-label="Breadcrumb">
              <Link href="/competitions" className="hover:text-primary transition-colors">
                Competitions
              </Link>
              <span aria-hidden>/</span>
              <span className="text-text-muted nums">{comp.name} {comp.year}</span>
            </nav>

            <div className="flex items-center gap-3 mb-5">
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-faint'}`}>
                {comp.shortName}
              </span>
              <span className="hud-label text-text-faint nums">{comp.year}</span>
            </div>

            <SectionHeader
              title={`${comp.name} ${comp.year}`}
              description={comp.location ?? undefined}
            />
          </Reveal>
        </div>
      </section>

      <section className="relative py-16 lg:py-24">
        <div className="section-container">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 flex flex-col gap-12">
              {/* Result hero card */}
              {comp.rank && (
                <Reveal>
                  <div className="group relative rounded-card border border-divider bg-surface-raised p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 transition-colors hover:border-primary/40">
                    <CornerTicks className="text-primary/40" size="md" />
                    <div className="shrink-0 flex items-baseline gap-0.5">
                      <span className="font-display font-bold text-6xl sm:text-7xl text-primary leading-none nums">
                        <Counter to={comp.rank} />
                      </span>
                      <span className="font-display font-bold text-2xl sm:text-3xl text-primary/70 leading-none">
                        {getOrdinalSuffix(comp.rank)}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="hud-label text-text-faint mb-2">Final Standing</div>
                      <p className="font-display font-bold text-xl sm:text-2xl text-text tracking-tight mb-1">
                        {comp.result ?? `${comp.rank}${getOrdinalSuffix(comp.rank)} Place`}
                      </p>
                      {comp.totalTeams && (
                        <p className="text-sm text-text-muted">
                          Top {Math.round((comp.rank / comp.totalTeams) * 100)}% of {comp.totalTeams} teams
                        </p>
                      )}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* SAR Video */}
              {embedUrl && (
                <Reveal>
                  <div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                      <span className="hud-label text-primary">SAR Video</span>
                    </div>
                    <div className="relative rounded-card border border-divider bg-surface-raised p-2 shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.55)]">
                      <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2">
                        <iframe
                          src={embedUrl}
                          title="SAR Video"
                          allowFullScreen
                          className="w-full h-full"
                        />
                        <CornerTicks className="text-primary/40" size="md" />
                      </div>
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Gallery */}
              {comp.gallery && comp.gallery.length > 0 && (
                <Reveal>
                  <div>
                    <div className="flex items-center gap-2.5 mb-5">
                      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                      <span className="hud-label text-primary">Gallery</span>
                    </div>
                    <Reveal stagger className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {comp.gallery.map((img, i) => (
                        <div
                          key={i}
                          className="group relative aspect-[4/3] rounded-lg overflow-hidden border border-divider bg-surface-2"
                        >
                          <Image
                            src={urlFor(img).width(400).height(300).url()}
                            alt={`${comp.name} ${comp.year} photo ${i + 1}`}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                            sizes="(max-width: 640px) 50vw, 33vw"
                          />
                          <CornerTicks className="text-primary/0 group-hover:text-primary/50 transition-colors" />
                        </div>
                      ))}
                    </Reveal>
                  </div>
                </Reveal>
              )}
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Rover */}
              {comp.rover && (
                <Reveal>
                  <Link
                    href={`/rovers/${comp.rover.slug.current}`}
                    className="group relative block rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                    <div className="hud-label text-text-faint mb-3">Rover</div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors">
                        {comp.rover.name}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden>
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </div>
                  </Link>
                </Reveal>
              )}

              {/* Post-Competition Report */}
              {comp.reportPdf && (
                <Reveal>
                  <a
                    href={getFileUrl(comp.reportPdf.asset._ref)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center justify-between gap-3 rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                    <div className="min-w-0">
                      <div className="hud-label text-text-faint mb-1">Report</div>
                      <span className="font-display font-bold text-lg text-text group-hover:text-primary transition-colors">
                        Download Report
                      </span>
                    </div>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-text-faint transition-transform group-hover:translate-y-0.5 group-hover:text-primary" aria-hidden>
                      <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                    </svg>
                  </a>
                </Reveal>
              )}

              {/* Team Roster */}
              {comp.teamMembers && comp.teamMembers.length > 0 && (
                <Reveal>
                  <div className="rounded-card border border-divider bg-surface-raised p-5">
                    <div className="hud-label text-text-faint mb-4">
                      Team ({comp.teamMembers.length})
                    </div>
                    <div className="flex flex-col gap-3">
                      {comp.teamMembers.map((entry, i) => (
                        <Link
                          key={i}
                          href={`/team/${entry.member.slug.current}`}
                          className="group flex items-center gap-3"
                        >
                          <div className="relative w-9 h-9 rounded-md overflow-hidden border border-divider bg-surface-2 shrink-0">
                            {entry.member.photo ? (
                              <Image
                                src={urlFor(entry.member.photo).width(36).height(36).url()}
                                alt={entry.member.name}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint" aria-hidden>
                                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                              </div>
                            )}
                            <CornerTicks className="text-primary/0 group-hover:text-primary/50 transition-colors" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">
                              {entry.member.name}
                            </p>
                            {entry.competitionRole && (
                              <p className="hud-label text-text-faint truncate">{entry.competitionRole}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0]
}

import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { COMPETITION_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { CompetitionFull } from '@/sanity/lib/types'

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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <nav className="flex items-center gap-2 text-sm text-text-faint mb-6">
            <Link href="/competitions" className="hover:text-primary transition-colors">Competitions</Link>
            <span>/</span>
            <span className="text-text">{comp.name} {comp.year}</span>
          </nav>
          <div className="flex items-center gap-3 mb-4">
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${COMPETITION_COLORS[comp.shortName] ?? 'bg-surface-2 text-text-faint'}`}>
              {comp.shortName}
            </span>
            <span className="font-mono text-sm text-text-faint">{comp.year}</span>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">{comp.name} {comp.year}</h1>
          {comp.location && <p className="text-text-muted text-lg">{comp.location}</p>}
        </div>
      </div>

      <div className="section-container py-14">
        <div className="grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 flex flex-col gap-10">
            {/* Result card */}
            {comp.rank && (
              <div className="bg-surface rounded-xl border border-divider p-6 flex items-center gap-6">
                <div className="shrink-0 w-20 h-20 rounded-xl bg-primary-highlight border border-primary/20 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-3xl text-primary leading-none">#{comp.rank}</span>
                  <span className="text-[10px] text-text-faint uppercase tracking-wide">Rank</span>
                </div>
                <div>
                  <p className="font-display font-bold text-xl text-text mb-1">{comp.result ?? `${comp.rank}${getOrdinalSuffix(comp.rank)} Place`}</p>
                  {comp.totalTeams && (
                    <p className="text-text-muted text-sm">
                      Top {Math.round((comp.rank / comp.totalTeams) * 100)}% of {comp.totalTeams} teams
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* SAR Video */}
            {embedUrl && (
              <div>
                <h2 className="font-display font-bold text-2xl text-text mb-4 accent-line">SAR Video</h2>
                <div className="aspect-video rounded-xl overflow-hidden border border-divider">
                  <iframe
                    src={embedUrl}
                    title="SAR Video"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              </div>
            )}

            {/* Gallery */}
            {comp.gallery && comp.gallery.length > 0 && (
              <div>
                <h2 className="font-display font-bold text-2xl text-text mb-4 accent-line">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {comp.gallery.map((img, i) => (
                    <div key={i} className="aspect-[4/3] rounded-lg overflow-hidden relative border border-divider">
                      <Image
                        src={urlFor(img).width(400).height(300).url()}
                        alt={`${comp.name} ${comp.year} photo ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, 33vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="flex flex-col gap-6">
            {/* Rover */}
            {comp.rover && (
              <div className="bg-surface rounded-xl border border-divider p-5">
                <h3 className="font-display font-semibold text-sm text-text-faint uppercase tracking-wide mb-3">Rover</h3>
                <Link href={`/rovers/${comp.rover.slug.current}`} className="font-display font-bold text-lg text-text hover:text-primary transition-colors">
                  {comp.rover.name}
                </Link>
              </div>
            )}

            {/* Team Roster */}
            {comp.teamMembers && comp.teamMembers.length > 0 && (
              <div className="bg-surface rounded-xl border border-divider p-5">
                <h3 className="font-display font-semibold text-sm text-text-faint uppercase tracking-wide mb-4">
                  Team ({comp.teamMembers.length})
                </h3>
                <div className="flex flex-col gap-3">
                  {comp.teamMembers.map((entry, i) => (
                    <Link
                      key={i}
                      href={`/team/${entry.member.slug.current}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-8 h-8 rounded-full bg-surface-2 border border-divider overflow-hidden relative shrink-0">
                        {entry.member.photo ? (
                          <Image
                            src={urlFor(entry.member.photo).width(32).height(32).url()}
                            alt={entry.member.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-text group-hover:text-primary transition-colors truncate">{entry.member.name}</p>
                        {entry.competitionRole && (
                          <p className="text-xs text-text-faint truncate">{entry.competitionRole}</p>
                        )}
                      </div>
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

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return s[(v - 20) % 10] ?? s[v] ?? s[0]
}

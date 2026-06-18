import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { SAR_VIDEOS_QUERY } from '@/sanity/lib/queries'
import type { SarVideo } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'SAR Videos' }

function getYouTubeID(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default async function SarVideosPage() {
  const videos = await sanityFetch<SarVideo[]>(SAR_VIDEOS_QUERY)

  return (
    <PageLayout>
      <PageHero
        kicker="Field Footage / SAR"
        title="SAR Videos"
        description="System Acceptance Review videos submitted for each competition — our technical presentations and rover demonstrations."
        watermark="SAR"
      />

      <section className="relative py-20 lg:py-28">
        <div className="section-container">
          {!videos?.length ? (
            <div className="rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No videos yet — add them in Sanity CMS → SAR Videos.
            </div>
          ) : (
            <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => {
                const ytId = getYouTubeID(video.youtubeUrl)
                return (
                  <div
                    key={video._id}
                    className="group relative flex flex-col rounded-card border border-divider bg-surface-raised overflow-hidden transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                  >
                    {/* Media frame */}
                    <div className="relative border-b border-divider">
                      {ytId ? (
                        <div className="aspect-video">
                          <iframe
                            src={`https://www.youtube.com/embed/${ytId}`}
                            title={video.title}
                            allowFullScreen
                            className="w-full h-full"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div className="aspect-video bg-surface flex items-center justify-center">
                          <svg
                            width="32"
                            height="32"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                            className="text-text-faint"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      )}
                      <CornerTicks className="text-primary/40" />
                      <span className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-none bg-bg/80 px-2 py-1 backdrop-blur-sm">
                        {video.competition ? (
                          <span className="hud-label text-primary nums">
                            {video.competition.shortName} {video.competition.year}
                          </span>
                        ) : (
                          <span className="hud-label text-primary">Live Feed</span>
                        )}
                      </span>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 mb-3">
                        {video.competition && (
                          <span className="inline-flex items-center rounded-none bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary">
                            {video.competition.shortName} {video.competition.year}
                          </span>
                        )}
                        <span className="hud-label text-text-faint nums ml-auto">{video.year}</span>
                      </div>

                      <h2 className="font-display font-bold text-lg text-text tracking-tight group-hover:text-primary transition-colors duration-150 mb-2">
                        {video.title}
                      </h2>

                      {video.description && (
                        <p className="text-sm text-text-muted leading-relaxed line-clamp-2">
                          {video.description}
                        </p>
                      )}

                      {video.competition?.slug && (
                        <Link
                          href={`/competitions/${video.competition.slug.current}`}
                          className="group/link mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors"
                        >
                          See competition results
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden
                            className="transition-transform group-hover/link:translate-x-0.5"
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </Reveal>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

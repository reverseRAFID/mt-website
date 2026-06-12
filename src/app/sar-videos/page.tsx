import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import type { Metadata } from 'next'
import { sanityFetch } from '@/sanity/lib/client'
import { SAR_VIDEOS_QUERY } from '@/sanity/lib/queries'
import type { SarVideo } from '@/sanity/lib/types'

export const metadata: Metadata = { title: 'SAR Videos' }

function getYouTubeID(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([a-zA-Z0-9_-]{11})/)
  return match ? match[1] : null
}

export default async function SarVideosPage() {
  const videos = await sanityFetch<SarVideo[]>(SAR_VIDEOS_QUERY)

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Video Archive</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">SAR Videos</h1>
          <p className="text-text-muted text-lg max-w-xl">
            System Acceptance Review videos submitted for each competition — our technical presentations and rover demonstrations.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!videos?.length ? (
          <div className="py-20 text-center text-text-muted">
            No videos yet — add them in Sanity CMS → SAR Videos.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const ytId = getYouTubeID(video.youtubeUrl)
              return (
                <div key={video._id} className="bg-surface rounded-xl border border-divider overflow-hidden">
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
                    <div className="aspect-video bg-surface-2 flex items-center justify-center">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-text-faint">
                        <polygon points="5 3 19 12 5 21 5 3"/>
                      </svg>
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-2">
                      {video.competition && (
                        <span className="text-xs font-semibold text-primary bg-primary-highlight px-2 py-0.5 rounded-full">
                          {video.competition.shortName} {video.competition.year}
                        </span>
                      )}
                      <span className="font-mono text-xs text-text-faint ml-auto">{video.year}</span>
                    </div>
                    <h2 className="font-display font-bold text-base text-text mb-1">{video.title}</h2>
                    {video.description && (
                      <p className="text-sm text-text-muted line-clamp-2">{video.description}</p>
                    )}
                    {video.competition?.slug && (
                      <Link
                        href={`/competitions/${video.competition.slug.current}`}
                        className="inline-block mt-3 text-xs font-medium text-primary hover:underline"
                      >
                        See competition results →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

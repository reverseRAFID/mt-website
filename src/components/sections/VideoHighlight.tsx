import Link from 'next/link'
import type { SarVideo } from '@/sanity/lib/types'
import { getYouTubeID } from '@/sanity/lib/client'

interface VideoHighlightProps {
  video: SarVideo | null
}

export function VideoHighlight({ video }: VideoHighlightProps) {
  if (!video) return null

  const videoId = getYouTubeID(video.youtubeUrl)
  if (!videoId) return null

  return (
    <section className="py-20 bg-surface">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-2 border border-divider shadow-lg">
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          <div>
            <div className="accent-line mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Latest SAR Video</p>
            </div>
            {video.competition && (
              <span className="inline-block bg-primary-highlight text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {video.competition.shortName} {video.competition.year}
              </span>
            )}
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-text mb-4">{video.title}</h2>
            {video.description && (
              <p className="text-text-muted leading-relaxed mb-8">{video.description}</p>
            )}
            <Link
              href="/sar-videos"
              className="inline-flex items-center gap-2 border border-border text-text-muted hover:text-primary hover:border-primary px-5 py-2.5 rounded-md font-semibold text-sm transition-colors duration-150"
            >
              All SAR Videos
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

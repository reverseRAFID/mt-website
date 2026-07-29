import Link from 'next/link'
import type { Competition, SarVideo } from '@/lib/cms/types'
import { rel } from '@/lib/cms/relations'
import { getYouTubeID } from '@/lib/cms/media'
import { Reveal } from '@/components/motion/Reveal'
import { GhostText } from '@/components/motion/GhostText'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface VideoHighlightProps {
  video: SarVideo | null
}

export function VideoHighlight({ video }: VideoHighlightProps) {
  if (!video) return null

  const videoId = getYouTubeID(video.youtubeUrl)
  if (!videoId) return null

  const competition = rel<Competition>(video.competition)

  return (
    <section className="relative py-20 lg:py-28 bg-surface">
      <GhostText text="DOWNLINK" drift="right" />
      <div className="section-container relative">
        <Reveal className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Media frame */}
          <div className="relative rounded-card border border-divider bg-surface-raised p-2 sm:p-3 shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]">
            <CornerTicks className="text-primary/40" size="md" />

            {/* Telemetry bar */}
            <div className="flex items-center justify-between gap-3 px-1 pb-2 pt-1">
              <span className="flex items-center gap-2 hud-label text-primary">
                <span
                  className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow"
                  aria-hidden
                />
                Live Feed
              </span>
              <span className="hud-label text-text-faint">SAR // VIDEO</span>
            </div>

            <div className="relative aspect-video overflow-hidden rounded-none border border-divider bg-surface-2">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0`}
                title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>

          {/* Text side */}
          <div>
            <div className="flex items-center gap-2.5 mb-5">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
              <span className="hud-label text-primary">Latest SAR Video</span>
            </div>

            {competition && (
              <span className="inline-flex items-center rounded-none bg-primary-highlight px-2.5 py-0.5 text-xs font-semibold text-primary mb-4">
                {competition.shortName} {competition.year}
              </span>
            )}

            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-text tracking-tight text-balance leading-[1.05] mb-4">
              {video.title}
            </h2>

            {video.description && (
              <p className="text-base sm:text-lg text-text-muted leading-relaxed text-pretty mb-8">
                {video.description}
              </p>
            )}

            <Link
              href="/sar-videos"
              className="group inline-flex items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              All SAR Videos
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

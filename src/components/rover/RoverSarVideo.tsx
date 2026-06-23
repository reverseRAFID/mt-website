import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { getYouTubeID } from '@/sanity/lib/client'

/**
 * Cinematic SAR video embed. Server component (just an iframe + Reveal island).
 * Anchored as #sar-video so the hero "Watch SAR Video" CTA can jump to it.
 */
export function RoverSarVideo({
  url,
  roverName,
  year,
  index = '05',
}: {
  url?: string
  roverName: string
  year: number
  index?: string
}) {
  if (!url) return null
  const id = getYouTubeID(url)
  if (!id) return null

  return (
    <section id="sar-video" className="relative scroll-mt-24 border-t border-divider py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>System Acceptance Review
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
              {roverName} in motion
            </h2>
            <span className="hud-label nums text-text-faint">SAR // {year}</span>
          </div>
        </Reveal>

        <Reveal y={28} className="relative mt-10 rounded-card border border-divider bg-surface-raised p-2 shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.55)] sm:p-3">
          <CornerTicks className="text-primary/40" size="md" />
          <div className="mb-2 flex items-center justify-between gap-3 px-1 pt-1">
            <span className="flex items-center gap-2 hud-label text-primary">
              <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
              Live Feed
            </span>
            <span className="hud-label text-text-faint">REC · 00:00</span>
          </div>
          <div className="relative aspect-video overflow-hidden rounded-none border border-divider bg-surface-2">
            <iframe
              src={`https://www.youtube.com/embed/${id}?modestbranding=1&rel=0`}
              title={`${roverName} SAR ${year} video`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  )
}

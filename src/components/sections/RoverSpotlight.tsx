import Link from 'next/link'
import Image from 'next/image'
import type { RoverCard } from '@/sanity/lib/types'
import { urlFor } from '@/sanity/lib/client'
import { Reveal } from '@/components/motion/Reveal'
import { Parallax } from '@/components/motion/Parallax'
import { GhostText } from '@/components/motion/GhostText'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

interface RoverSpotlightProps {
  rover: RoverCard | null
}

const SPEC_LABELS: Record<string, string> = {
  weight: 'Weight',
  driveSystem: 'Drive System',
  dof: 'Arm DOF',
  autonomy: 'Autonomy',
}

export function RoverSpotlight({ rover }: RoverSpotlightProps) {
  if (!rover) return null

  const specEntries = Object.entries(rover.specs ?? {}).filter(([, v]) => v !== undefined && v !== null)

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 bg-bg">
      <GhostText text={rover.name} drift="right" outline />
      <div className="section-container relative">
        <Reveal>
          <SectionHeader kicker="Featured Rover" title={rover.name} description={rover.tagline ?? undefined} />
        </Reveal>

        <div className="mt-12 grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
          {/* Hero image or placeholder — framed telemetry panel */}
          <Reveal y={32} blur={6} className="order-first lg:order-last">
            <Parallax speed={0.12} className="relative">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-6 glow-orange opacity-60 mask-radial-fade"
              />
              <div className="relative rounded-card border border-divider bg-surface-raised p-2 shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.55)]">
                <div className="relative aspect-[4/3] rounded-none bg-surface-2 overflow-hidden">
                  {rover.heroImage ? (
                    <Image
                      src={urlFor(rover.heroImage).width(800).height(600).url()}
                      alt={rover.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                  ) : (
                    <div className="absolute inset-0 tech-grid-sm opacity-50 flex items-center justify-center">
                      <div className="text-center p-8">
                        <div className="w-16 h-16 rounded-none bg-primary/10 flex items-center justify-center mx-auto mb-3">
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                            <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                          </svg>
                        </div>
                        <p className="text-sm text-text-faint">{rover.name}</p>
                        <p className="text-xs text-text-faint mt-1">Add a gallery photo in Sanity CMS</p>
                      </div>
                    </div>
                  )}
                  <CornerTicks className="text-primary/40" size="md" />
                </div>
              </div>

              {rover.competition && (
                <div className="absolute -top-3 -right-3 z-10 inline-flex items-center rounded-none bg-primary px-3 py-1.5 shadow-lg">
                  <span className="hud-label text-on-accent nums">
                    {rover.competition.shortName} {rover.competition.year}
                  </span>
                </div>
              )}
            </Parallax>
          </Reveal>

          {/* Specs + actions */}
          <div>
            {specEntries.length > 0 && (
              <Reveal stagger className="grid grid-cols-2 gap-3 mb-8">
                {specEntries.map(([key, value]) => (
                  <div
                    key={key}
                    className="relative rounded-none border border-divider bg-surface p-3.5 transition-colors hover:border-primary/40"
                  >
                    <div className="hud-label text-text-faint mb-1.5">
                      {SPEC_LABELS[key] ?? key}
                    </div>
                    <div className="font-mono text-sm font-medium text-text nums">{String(value)}</div>
                  </div>
                ))}
              </Reveal>
            )}

            <Reveal delay={0.1}>
              <div className="flex flex-wrap gap-3">
                <Link
                  href={`/rovers/${rover.slug.current}`}
                  className="inline-flex items-center gap-2 rounded-none bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  View Full Specs
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <Link
                  href="/rovers"
                  className="inline-flex items-center gap-2 rounded-none border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  All Rovers
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import Image from 'next/image'
import type { RoverCard } from '@/sanity/lib/types'
import { urlFor } from '@/sanity/lib/client'

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
    <section className="py-20 bg-bg">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="accent-line mb-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Featured Rover</p>
            </div>
            <h2 className="font-display font-bold text-4xl lg:text-5xl text-text mb-4">{rover.name}</h2>
            {rover.tagline && (
              <p className="text-text-muted text-lg leading-relaxed mb-8">{rover.tagline}</p>
            )}

            {specEntries.length > 0 && (
              <div className="grid grid-cols-2 gap-3 mb-8">
                {specEntries.map(([key, value]) => (
                  <div key={key} className="bg-surface rounded-lg p-3 border border-divider">
                    <div className="text-xs text-text-faint uppercase tracking-wide mb-1">
                      {SPEC_LABELS[key] ?? key}
                    </div>
                    <div className="font-mono text-sm font-medium text-text">{String(value)}</div>
                  </div>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/rovers/${rover.slug.current}`}
                className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors duration-150"
              >
                View Full Specs
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/rovers"
                className="inline-flex items-center gap-2 border border-border text-text-muted hover:text-primary hover:border-primary px-5 py-2.5 rounded-md font-semibold text-sm transition-colors duration-150"
              >
                All Rovers
              </Link>
            </div>
          </div>

          {/* Hero image or placeholder */}
          <div className="relative">
            <div className="aspect-[4/3] rounded-xl bg-surface-2 border border-divider flex items-center justify-center overflow-hidden">
              {rover.heroImage ? (
                <Image
                  src={urlFor(rover.heroImage).width(800).height(600).url()}
                  alt={rover.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              ) : (
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-faint">{rover.name}</p>
                  <p className="text-xs text-text-faint mt-1">Add a gallery photo in Sanity CMS</p>
                </div>
              )}
            </div>

            {rover.competition && (
              <div className="absolute -top-3 -right-3 bg-primary text-white text-xs font-bold px-3 py-1.5 rounded-md shadow-lg">
                {rover.competition.shortName} {rover.competition.year}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

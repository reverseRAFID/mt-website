import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { ROVERS_QUERY } from '@/sanity/lib/queries'
import type { RoverCard } from '@/sanity/lib/types'
import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { PageHero } from '@/components/ui/PageHero'
import { CornerTicks } from '@/components/ui/CornerTicks'

export const metadata: Metadata = { title: 'Our Rovers' }

export default async function RoversPage() {
  const rovers = await sanityFetch<RoverCard[]>(ROVERS_QUERY)

  return (
    <PageLayout>
      <PageHero
        kicker="Fleet"
        title="Our Rovers"
        description="Every rover we've built, from first prototype to competition-ready machine."
        watermark="FLEET"
      />

      <section className="relative py-20 lg:py-28">
        <GhostText text="HANGAR" drift="right" />
        <div className="section-container relative">
          {rovers?.length === 0 ? (
            <EmptyState message="No rovers yet — add one in Sanity CMS → Rovers." />
          ) : (
            <Reveal stagger className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {rovers?.map((rover) => (
                <Link
                  key={rover._id}
                  href={`/rovers/${rover.slug.current}`}
                  className="group relative flex flex-col rounded-card border border-divider bg-surface-raised p-4 transition-all duration-300 hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
                >
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />

                  {/* Framed telemetry media panel */}
                  <div className="relative aspect-[16/10] rounded-none bg-surface-2 overflow-hidden">
                    {rover.heroImage ? (
                      <Image
                        src={urlFor(rover.heroImage).width(600).height(375).url()}
                        alt={rover.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div className="absolute inset-0 tech-grid-sm opacity-50 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-12 h-12 rounded-none bg-primary/10 flex items-center justify-center mx-auto mb-2">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                              <circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                            </svg>
                          </div>
                          <span className="text-xs text-text-faint">No photo yet</span>
                        </div>
                      </div>
                    )}
                    <CornerTicks className="text-primary/40" />

                    {rover.competition && (
                      <div className="absolute left-3 top-3 z-10 inline-flex items-center rounded-none bg-primary px-2.5 py-1 shadow-lg">
                        <span className="hud-label text-on-accent nums">
                          {rover.competition.shortName} {rover.competition.year}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col p-2 pt-5">
                    <div className="hud-label text-text-faint nums mb-2">{rover.year}</div>
                    <h2 className="font-display font-bold text-lg lg:text-xl text-text tracking-tight group-hover:text-primary transition-colors duration-150">
                      {rover.name}
                    </h2>
                    {rover.tagline && (
                      <p className="mt-1.5 text-sm text-text-muted leading-relaxed line-clamp-2">{rover.tagline}</p>
                    )}
                    {rover.specs && (
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {rover.specs.weight && (
                          <div className="rounded-none border border-divider bg-surface p-2.5">
                            <div className="hud-label text-text-faint mb-1">Weight</div>
                            <div className="font-mono text-xs font-medium text-text nums">{rover.specs.weight}</div>
                          </div>
                        )}
                        {rover.specs.driveSystem && (
                          <div className="rounded-none border border-divider bg-surface p-2.5">
                            <div className="hud-label text-text-faint mb-1">Drive</div>
                            <div className="font-mono text-xs font-medium text-text nums">{rover.specs.driveSystem}</div>
                          </div>
                        )}
                        {rover.specs.dof !== undefined && (
                          <div className="rounded-none border border-divider bg-surface p-2.5">
                            <div className="hud-label text-text-faint mb-1">Arm DOF</div>
                            <div className="font-mono text-xs font-medium text-text nums">{rover.specs.dof}-DOF</div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </Reveal>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-20 text-center">
      <p className="text-text-muted">{message}</p>
    </div>
  )
}

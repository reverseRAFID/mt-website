import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { ROVERS_QUERY } from '@/sanity/lib/queries'
import type { RoverCard } from '@/sanity/lib/types'

export const metadata: Metadata = { title: 'Our Rovers' }

export default async function RoversPage() {
  const rovers = await sanityFetch<RoverCard[]>(ROVERS_QUERY)

  return (
    <PageLayout>
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Fleet</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Our Rovers</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Every rover we&apos;ve built, from first prototype to competition-ready machine.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {rovers?.length === 0 ? (
          <EmptyState message="No rovers yet — add one in Sanity CMS → Rovers." />
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rovers?.map((rover) => (
              <Link
                key={rover._id}
                href={`/rovers/${rover.slug.current}`}
                className="group bg-surface rounded-xl border border-divider overflow-hidden hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="aspect-[16/10] bg-surface-2 border-b border-divider relative overflow-hidden">
                  {rover.heroImage ? (
                    <Image
                      src={urlFor(rover.heroImage).width(600).height(375).url()}
                      alt={rover.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                            <circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                          </svg>
                        </div>
                        <span className="text-xs text-text-faint">No photo yet</span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    {rover.competition && (
                      <span className="text-xs font-semibold text-primary bg-primary-highlight px-2 py-0.5 rounded-full">
                        {rover.competition.shortName} {rover.competition.year}
                      </span>
                    )}
                    <span className="font-mono text-xs text-text-faint ml-auto">{rover.year}</span>
                  </div>
                  <h2 className="font-display font-bold text-xl text-text group-hover:text-primary transition-colors duration-150 mb-1">
                    {rover.name}
                  </h2>
                  {rover.tagline && (
                    <p className="text-sm text-text-muted mb-4 line-clamp-2">{rover.tagline}</p>
                  )}
                  {rover.specs && (
                    <div className="flex flex-wrap gap-2">
                      {rover.specs.weight && (
                        <span className="font-mono text-xs text-text-faint bg-surface-2 px-2 py-0.5 rounded">{rover.specs.weight}</span>
                      )}
                      {rover.specs.driveSystem && (
                        <span className="font-mono text-xs text-text-faint bg-surface-2 px-2 py-0.5 rounded">{rover.specs.driveSystem}</span>
                      )}
                      {rover.specs.dof !== undefined && (
                        <span className="font-mono text-xs text-text-faint bg-surface-2 px-2 py-0.5 rounded">{rover.specs.dof}-DOF arm</span>
                      )}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
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

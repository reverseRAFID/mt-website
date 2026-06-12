import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { ROVER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { RoverFull } from '@/sanity/lib/types'
import { PortableText } from '@portabletext/react'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const rover = await sanityFetch<RoverFull | null>(ROVER_BY_SLUG_QUERY, { slug })
  return { title: rover?.name ?? 'Rover' }
}

const SPEC_LABELS: Record<string, string> = {
  weight: 'Weight', dimensions: 'Dimensions', driveSystem: 'Drive System',
  payload: 'Payload', dof: 'Arm DOF', autonomy: 'Autonomy',
}

export default async function RoverPage({ params }: Props) {
  const { slug } = await params
  const rover = await sanityFetch<RoverFull | null>(ROVER_BY_SLUG_QUERY, { slug })
  if (!rover) notFound()

  const specs = rover.specs ? Object.entries(rover.specs).filter(([, v]) => v !== undefined && v !== null) : []

  return (
    <PageLayout>
      <div className="section-container py-14">
        <nav className="flex items-center gap-2 text-sm text-text-faint mb-8">
          <Link href="/rovers" className="hover:text-primary transition-colors">Rovers</Link>
          <span>/</span>
          <span className="text-text">{rover.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-12 items-start mb-14">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {rover.competition && (
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-md">
                  {rover.competition.shortName} {rover.competition.year}
                </span>
              )}
              <span className="font-mono text-sm text-text-faint">{rover.year}</span>
            </div>
            <h1 className="font-display font-bold text-5xl lg:text-6xl text-text mb-4">{rover.name}</h1>
            {rover.tagline && (
              <p className="text-text-muted text-lg leading-relaxed mb-4">{rover.tagline}</p>
            )}
            {rover.description && (
              <div className="prose prose-sm text-text-muted leading-relaxed mb-8 max-w-none">
                <PortableText value={rover.description} />
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              {rover.competition?.slug && (
                <Link
                  href={`/competitions/${rover.competition.slug.current}`}
                  className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
                >
                  Competition Results
                </Link>
              )}
              {rover.technicalPdf && (
                <a
                  href={getFileUrl(rover.technicalPdf.asset._ref)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-divider text-text-muted hover:text-primary hover:border-primary px-5 py-2.5 rounded-md font-semibold text-sm transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                  </svg>
                  Download Datasheet
                </a>
              )}
            </div>
          </div>

          {/* Image / 3D viewer placeholder */}
          <div className="lg:sticky lg:top-20">
            {rover.gallery && rover.gallery.length > 0 ? (
              <div className="aspect-[4/3] rounded-xl overflow-hidden relative border border-divider">
                <Image
                  src={urlFor(rover.gallery[0]).width(800).height(600).url()}
                  alt={rover.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
            ) : (
              <div className="aspect-[4/3] rounded-xl bg-surface border border-divider flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary">
                      <circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium text-text mb-1">No photos yet</p>
                  <p className="text-xs text-text-faint">Add gallery images in Sanity CMS → Rovers</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Specs */}
        {specs.length > 0 && (
          <div className="mb-14">
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Technical Specifications</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {specs.map(([key, value]) => (
                <div key={key} className="bg-surface rounded-lg p-4 border border-divider">
                  <div className="text-xs text-text-faint uppercase tracking-wide mb-1.5">{SPEC_LABELS[key] ?? key}</div>
                  <div className="font-mono text-base font-medium text-text">{String(value)}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gallery */}
        {rover.gallery && rover.gallery.length > 1 && (
          <div>
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Gallery</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {rover.gallery.slice(1).map((img, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden relative border border-divider">
                  <Image
                    src={urlFor(img).width(400).height(400).url()}
                    alt={`${rover.name} photo ${i + 2}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

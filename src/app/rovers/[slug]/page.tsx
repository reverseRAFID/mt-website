import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { sanityFetch, urlFor, getFileUrl } from '@/sanity/lib/client'
import { ROVER_BY_SLUG_QUERY } from '@/sanity/lib/queries'
import type { RoverFull } from '@/sanity/lib/types'
import { PortableText } from '@portabletext/react'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

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
      <div className="section-container py-14 lg:py-16">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 hud-label text-text-faint mb-10">
          <Link href="/rovers" className="hover:text-primary transition-colors">Rovers</Link>
          <span aria-hidden>/</span>
          <span className="text-text">{rover.name}</span>
        </nav>

        {/* Hero: title + intro (left) / framed gallery hero (right) */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start mb-16 lg:mb-20">
          <Reveal>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              {rover.competition && (
                <span className="inline-flex items-center rounded-md bg-primary px-3 py-1.5">
                  <span className="hud-label text-on-accent nums">
                    {rover.competition.shortName} {rover.competition.year}
                  </span>
                </span>
              )}
              <span className="hud-label text-text-faint nums">{rover.year}</span>
            </div>

            <SectionHeader
              kicker="Rover Profile"
              title={rover.name}
              description={rover.tagline ?? undefined}
            />

            {rover.description && (
              <div className="prose prose-sm mt-6 max-w-none text-text-muted leading-relaxed">
                <PortableText value={rover.description} />
              </div>
            )}

            <div className="mt-8 flex flex-wrap gap-3">
              {rover.competition?.slug && (
                <Link
                  href={`/competitions/${rover.competition.slug.current}`}
                  className="inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                >
                  Competition Results
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
              )}
              {rover.technicalPdf && (
                <a
                  href={getFileUrl(rover.technicalPdf.asset._ref)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-border px-5 py-2.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M12 17V3M7 12l5 5 5-5M20 21H4" />
                  </svg>
                  Download Datasheet
                </a>
              )}
            </div>
          </Reveal>

          {/* Framed hero image — sticky telemetry panel */}
          <Reveal y={32} blur={6} className="order-first lg:order-last lg:sticky lg:top-24">
            {rover.gallery && rover.gallery.length > 0 ? (
              <div className="relative">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-6 glow-orange opacity-60 mask-radial-fade"
                />
                <div className="relative rounded-card border border-divider bg-surface-raised p-2 shadow-[0_24px_60px_-32px_rgba(var(--primary-rgb),0.55)]">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface-2">
                    <Image
                      src={urlFor(rover.gallery[0]).width(800).height(600).url()}
                      alt={rover.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 50vw"
                    />
                    <CornerTicks className="text-primary/40" size="md" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative rounded-card border border-divider bg-surface-raised p-2">
                <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl bg-surface-2">
                  <div className="absolute inset-0 tech-grid-sm opacity-50" aria-hidden />
                  <div className="relative text-center p-8">
                    <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-primary" aria-hidden>
                        <circle cx="12" cy="12" r="3" /><path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-text mb-1">No photos yet</p>
                    <p className="text-xs text-text-faint">Add gallery images in Sanity CMS → Rovers</p>
                  </div>
                  <CornerTicks className="text-primary/40" size="md" />
                </div>
              </div>
            )}
          </Reveal>
        </div>

        {/* Specs — mono data-readout tiles */}
        {specs.length > 0 && (
          <div className="mb-16 lg:mb-20">
            <Reveal>
              <SectionHeader kicker="Telemetry" title="Technical Specifications" />
            </Reveal>
            <Reveal stagger className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {specs.map(([key, value]) => (
                <div
                  key={key}
                  className="relative rounded-lg border border-divider bg-surface p-4 transition-colors hover:border-primary/40"
                >
                  <div className="hud-label text-text-faint mb-1.5">{SPEC_LABELS[key] ?? key}</div>
                  <div className="font-mono text-base font-medium text-text nums">{String(value)}</div>
                </div>
              ))}
            </Reveal>
          </div>
        )}

        {/* Gallery — framed thumbnails with corner ticks + hover zoom */}
        {rover.gallery && rover.gallery.length > 1 && (
          <div>
            <Reveal>
              <SectionHeader kicker="Imagery" title="Gallery" />
            </Reveal>
            <Reveal stagger className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {rover.gallery.slice(1).map((img, i) => (
                <div
                  key={i}
                  className="group relative aspect-square overflow-hidden rounded-card border border-divider bg-surface-2 transition-colors hover:border-primary/40"
                >
                  <Image
                    src={urlFor(img).width(400).height(400).url()}
                    alt={`${rover.name} photo ${i + 2}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                </div>
              ))}
            </Reveal>
          </div>
        )}
      </div>
    </PageLayout>
  )
}

import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { GALLERY_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, SanitySlug } from '@/sanity/lib/types'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { PageHero } from '@/components/ui/PageHero'

export const metadata: Metadata = { title: 'Gallery' }

interface GalleryRover {
  _id: string
  name: string
  slug: SanitySlug
  year: number
  gallery: SanityImage[]
}

export default async function GalleryPage() {
  const rovers = await sanityFetch<GalleryRover[]>(GALLERY_QUERY)

  const galleries = rovers?.filter((r) => r.gallery?.length > 0) ?? []
  const hasImages = galleries.length > 0

  return (
    <PageLayout>
      <PageHero
        kicker="Archive"
        title="Gallery"
        description="Photos from competitions, rover builds, and team events."
        watermark="GALLERY"
      />

      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Ambient mission-control texture — kept very low opacity */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 tech-grid-sm opacity-[0.35] mask-radial-fade"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 z-0 h-[420px] w-[680px] -translate-x-1/2 glow-orange opacity-40 blur-[130px]"
        />

        <div className="section-container relative z-10">
          {!hasImages ? (
            <Reveal>
              <div className="relative mx-auto max-w-2xl overflow-hidden rounded-card border border-divider bg-surface-raised px-6 py-16 text-center sm:px-10 sm:py-20">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 tech-grid-sm opacity-40 mask-radial-fade"
                />
                <CornerTicks className="text-primary/30" size="md" />
                <div className="relative">
                  <span className="hud-label inline-flex items-center justify-center gap-2 text-primary">
                    <span className="h-1.5 w-1.5 rounded-none bg-primary animate-blink" aria-hidden />
                    No Signal
                  </span>
                  <h2 className="mt-5 text-balance font-display text-2xl font-bold tracking-tight text-text sm:text-3xl">
                    Archive awaiting first transmission
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-pretty leading-relaxed text-text-muted">
                    No frames have been logged yet. Gallery images are pulled from each rover&apos;s
                    record in the CMS — once photos are attached, they surface here automatically.
                  </p>
                  <Link
                    href="/rovers"
                    className="group mt-8 inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border bg-bg/40 px-6 py-3 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Explore the rovers
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="transition-transform group-hover:translate-x-0.5"
                      aria-hidden
                    >
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </Reveal>
          ) : (
            <div className="flex flex-col gap-20">
              {galleries.map((rover) => (
                <div key={rover._id}>
                  <Reveal>
                    <SectionHeader
                      kicker={`${rover.year} · ${rover.gallery.length} ${
                        rover.gallery.length === 1 ? 'Frame' : 'Frames'
                      }`}
                      title={rover.name}
                      titleClassName="text-2xl sm:text-3xl lg:text-4xl"
                      action={
                        <Link
                          href={`/rovers/${rover.slug.current}`}
                          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        >
                          View Rover
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
                            aria-hidden
                          >
                            <path d="M5 12h14M12 5l7 7-7 7" />
                          </svg>
                        </Link>
                      }
                    />
                  </Reveal>

                  <Reveal
                    stagger
                    className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4"
                  >
                    {rover.gallery.map((img, i) => (
                      <figure
                        key={i}
                        className="surface-lift group relative aspect-square overflow-hidden rounded-card border border-divider bg-surface-2 hover:border-primary/40"
                      >
                        <Image
                          src={urlFor(img).width(400).height(400).url()}
                          alt={`${rover.name} photo ${i + 1}`}
                          fill
                          className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        {/* Hover scrim for label legibility */}
                        <div
                          aria-hidden
                          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                        />
                        <figcaption className="hud-label nums absolute bottom-2 left-2.5 z-10 text-text/0 transition-colors duration-300 group-hover:text-text/80">
                          {String(i + 1).padStart(2, '0')}
                        </figcaption>
                        <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/50" />
                      </figure>
                    ))}
                  </Reveal>

                  <div className="mt-6 sm:hidden">
                    <Link
                      href={`/rovers/${rover.slug.current}`}
                      className="link-underline text-sm font-semibold text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      View Rover →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </PageLayout>
  )
}

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

  const hasImages = rovers?.some((r) => r.gallery?.length > 0)

  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <SectionHeader
            kicker="Archive"
            title="Gallery"
            description="Photos from competitions, rover builds, and team events."
          />
        </div>
      </section>

      <section className="relative py-20 lg:py-28">
        <div className="section-container">
          {!hasImages ? (
            <div className="rounded-card border border-divider bg-surface-raised py-20 text-center text-text-muted">
              No photos yet — add gallery images to rovers in Sanity CMS.
            </div>
          ) : (
            <div className="flex flex-col gap-16">
              {rovers?.filter((r) => r.gallery?.length > 0).map((rover) => (
                <div key={rover._id}>
                  <SectionHeader
                    kicker={`${rover.year}`}
                    title={rover.name}
                    titleClassName="text-2xl sm:text-3xl lg:text-4xl"
                    action={
                      <Link
                        href={`/rovers/${rover.slug.current}`}
                        className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-primary transition-colors"
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

                  <Reveal stagger className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {rover.gallery.map((img, i) => (
                      <div
                        key={i}
                        className="group relative aspect-square overflow-hidden rounded-card border border-divider bg-surface-2 transition-colors duration-300 hover:border-primary/40"
                      >
                        <Image
                          src={urlFor(img).width(400).height(400).url()}
                          alt={`${rover.name} photo ${i + 1}`}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        />
                        <CornerTicks className="text-primary/0 group-hover:text-primary/50 transition-colors" />
                      </div>
                    ))}
                  </Reveal>

                  <div className="mt-6 sm:hidden">
                    <Link
                      href={`/rovers/${rover.slug.current}`}
                      className="text-sm font-semibold text-primary hover:text-primary-hover"
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

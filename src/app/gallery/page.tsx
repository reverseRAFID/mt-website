import { PageLayout } from '@/components/layout/PageLayout'
import Link from 'next/link'
import Image from 'next/image'
import type { Metadata } from 'next'
import { sanityFetch, urlFor } from '@/sanity/lib/client'
import { GALLERY_QUERY } from '@/sanity/lib/queries'
import type { SanityImage, SanitySlug } from '@/sanity/lib/types'

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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Photos</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Gallery</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Photos from competitions, rover builds, and team events.
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        {!hasImages ? (
          <div className="py-20 text-center text-text-muted">
            No photos yet — add gallery images to rovers in Sanity CMS.
          </div>
        ) : (
          <div className="flex flex-col gap-14">
            {rovers?.filter((r) => r.gallery?.length > 0).map((rover) => (
              <div key={rover._id}>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-display font-bold text-xl text-text accent-line">{rover.name}</h2>
                  <Link
                    href={`/rovers/${rover.slug.current}`}
                    className="text-xs font-medium text-text-faint hover:text-primary transition-colors"
                  >
                    View Rover →
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {rover.gallery.map((img, i) => (
                    <div key={i} className="aspect-square rounded-lg overflow-hidden relative border border-divider bg-surface-2">
                      <Image
                        src={urlFor(img).width(400).height(400).url()}
                        alt={`${rover.name} photo ${i + 1}`}
                        fill
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  )
}

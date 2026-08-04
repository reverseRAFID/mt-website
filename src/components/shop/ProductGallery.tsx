'use client'

import Image from 'next/image'
import { useState } from 'react'
import { media } from '@/lib/cms/media'
import type { Media } from '@/lib/cms/types'
import { CornerTicks } from '@/components/ui/CornerTicks'

type GalleryImage = string | Media

/**
 * Product image gallery.
 *
 * A main frame plus thumbnails. Deliberately not a swipe carousel: on a product
 * page the customer wants to compare a couple of angles, and a carousel that
 * steals horizontal drag makes the page harder to scroll on a phone.
 */
export function ProductGallery({ images, title }: { images: GalleryImage[]; title: string }) {
  const [index, setIndex] = useState(0)
  const active = images[index] ?? images[0]

  if (!active) {
    return (
      <div className="flex aspect-square w-full items-center justify-center border border-divider bg-surface-2">
        <span className="hud-label text-text-faint">No image</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square overflow-hidden border border-divider bg-surface">
        <CornerTicks className="z-10 text-primary/25" size="md" />
        <Image
          src={media(active)?.url ?? ''}
          // Falls back to the product name so the image is never unlabelled,
          // even though the schema requires alt text.
          alt={media(active)?.alt || title}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
          className="object-cover"
        />
      </div>

      {images.length > 1 && (
        <div
          role="group"
          aria-label={`${title} images`}
          className="grid grid-cols-4 gap-3 sm:grid-cols-5"
        >
          {images.map((image, i) => (
            <button
              key={media(image)?.id ?? i}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === index}
              className={`relative aspect-square overflow-hidden border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                i === index
                  ? 'border-primary'
                  : 'border-divider hover:border-border'
              }`}
            >
              <Image
                src={media(image)?.url ?? ''}
                alt=""
                fill
                sizes="120px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

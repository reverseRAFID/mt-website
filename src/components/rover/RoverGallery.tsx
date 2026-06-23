'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { Reveal } from '@/components/motion/Reveal'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { urlFor } from '@/sanity/lib/client'
import type { SanityImage } from '@/sanity/lib/types'
import { pad2 } from './roverHelpers'

export function RoverGallery({
  images,
  roverName,
  index = '06',
}: {
  images: SanityImage[]
  roverName: string
  index?: string
}) {
  const [open, setOpen] = useState<number | null>(null)
  const count = images?.length ?? 0

  const close = useCallback(() => setOpen(null), [])
  const go = useCallback(
    (dir: number) => setOpen((cur) => (cur === null ? null : (cur + dir + count) % count)),
    [count]
  )

  useEffect(() => {
    if (open === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, close, go])

  if (count === 0) return null

  return (
    <section className="relative border-t border-divider py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="mb-3 flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              <span className="text-text-faint">{index} / </span>Imagery
            </span>
          </div>
          <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl lg:text-5xl">
            Gallery
          </h2>
        </Reveal>

        <Reveal stagger={0.05} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setOpen(i)}
              aria-label={`Open image ${i + 1} of ${count}`}
              className={`group relative overflow-hidden rounded-card border border-divider bg-surface-2 transition-colors hover:border-primary/45 ${
                i === 0 ? 'col-span-2 row-span-2 aspect-square sm:aspect-auto' : 'aspect-square'
              }`}
            >
              <Image
                src={urlFor(img).width(i === 0 ? 800 : 400).height(i === 0 ? 800 : 400).url()}
                alt={img.caption ?? `${roverName} photo ${i + 1}`}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes={i === 0 ? '(max-width: 640px) 100vw, 50vw' : '(max-width: 640px) 50vw, 25vw'}
              />
              <span aria-hidden className="absolute left-2 top-2 hud-label nums text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">
                {pad2(i + 1)}
              </span>
              <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/60" />
            </button>
          ))}
        </Reveal>
      </div>

      {/* Lightbox */}
      {open !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`${roverName} gallery viewer`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-bg/95 p-4 backdrop-blur-sm sm:p-8"
          onClick={close}
        >
          <div aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm opacity-30" />
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          <div className="relative z-[1] flex max-h-full w-full max-w-5xl flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[16/10] w-full overflow-hidden rounded-card border border-divider bg-surface-2">
              <Image
                src={urlFor(images[open]).width(1600).fit('max').url()}
                alt={images[open].caption ?? `${roverName} photo ${open + 1}`}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
              <CornerTicks className="text-primary/40" size="md" />
            </div>
            <div className="mt-3 flex items-center justify-between gap-4">
              <span className="hud-label nums text-text-faint">
                {pad2(open + 1)} / {pad2(count)}
              </span>
              {images[open].caption && (
                <span className="truncate text-sm text-text-muted">{images[open].caption}</span>
              )}
              {count > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => go(-1)}
                    aria-label="Previous image"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M15 18l-6-6 6-6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    onClick={() => go(1)}
                    aria-label="Next image"
                    className="inline-flex h-9 w-9 items-center justify-center rounded-none border border-border text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

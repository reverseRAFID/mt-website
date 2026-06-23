import Link from 'next/link'
import Image from 'next/image'
import { Reveal } from '@/components/motion/Reveal'
import { Magnetic } from '@/components/motion/Magnetic'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SectionEyebrow } from '@/components/rover/SectionEyebrow'
import { urlFor } from '@/sanity/lib/client'
import type { RoverSibling } from '@/sanity/lib/types'

export function RoverFleetStrip({ rovers }: { rovers?: RoverSibling[] }) {
  if (!rovers || rovers.length === 0) return null

  return (
    <section className="relative border-t border-divider py-16 lg:py-24">
      <div className="section-container">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionEyebrow label="The Lineage" className="mb-3" />
              <h2 className="font-display text-3xl font-bold leading-[1.05] tracking-tight text-text sm:text-4xl">
                More of the fleet
              </h2>
            </div>
            <Link
              href="/rovers"
              className="group inline-flex items-center gap-2 rounded-none border border-border px-4 py-2 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
            >
              All rovers
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </Reveal>

        <Reveal stagger={0.06} className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rovers.slice(0, 6).map((r) => (
            <Magnetic key={r._id} strength={0.2} className="block h-full">
              <Link
                href={`/rovers/${r.slug.current}`}
                className="group relative flex h-full w-full flex-col overflow-hidden rounded-card border border-divider bg-surface-raised transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-surface-2">
                  {r.heroImage ? (
                    <Image
                      src={urlFor(r.heroImage).width(560).height(350).url()}
                      alt={r.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center tech-grid-sm opacity-50">
                      <span className="font-display text-5xl font-bold text-text/[0.07] nums">{r.year}</span>
                    </div>
                  )}
                  <CornerTicks className="text-primary/0 transition-colors duration-300 group-hover:text-primary/45" />
                  <span className="absolute left-3 top-3 hud-label nums text-white/90 [text-shadow:0_1px_2px_rgba(0,0,0,0.6)]">{r.year}</span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="font-display text-lg font-bold tracking-tight text-text transition-colors group-hover:text-primary">
                    {r.name}
                  </h3>
                  {r.tagline && <p className="mt-1.5 line-clamp-2 text-sm text-text-muted">{r.tagline}</p>}
                </div>
              </Link>
            </Magnetic>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

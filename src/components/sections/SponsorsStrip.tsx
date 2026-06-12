import type { Sponsor } from '@/sanity/lib/types'
import { urlFor } from '@/sanity/lib/client'
import { ThemeLogo } from '@/components/ui/ThemeLogo'

interface SponsorsStripProps {
  sponsors: Sponsor[]
}

const TIER_ORDER = ['title', 'gold', 'silver', 'bronze', 'in-kind']

export function SponsorsStrip({ sponsors }: SponsorsStripProps) {
  if (sponsors.length === 0) return null

  const sorted = [...sponsors].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  )

  const getSponsorLogoSources = (sponsor: Sponsor) => {
    const fallback = sponsor.logo ? urlFor(sponsor.logo).height(40).url() : undefined
    const lightSrc = sponsor.logoLight ? urlFor(sponsor.logoLight).height(40).url() : fallback
    const darkSrc = sponsor.logoDark ? urlFor(sponsor.logoDark).height(40).url() : fallback

    return { lightSrc, darkSrc }
  }

  return (
    <section className="py-14 bg-surface border-t border-divider">
      <div className="section-container">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-text-faint mb-8">
          Our Sponsors
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
          {sorted.map((sponsor) => (
            <a
              key={sponsor._id}
              href={sponsor.website ?? '#'}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={sponsor.name}
              className="h-10 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-200 grayscale hover:grayscale-0"
            >
              {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
                <ThemeLogo
                  {...getSponsorLogoSources(sponsor)}
                  alt={sponsor.name}
                  width={120}
                  height={40}
                  className="object-contain max-h-10"
                />
              ) : (
                <span className="text-sm font-medium text-text-muted">{sponsor.name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}

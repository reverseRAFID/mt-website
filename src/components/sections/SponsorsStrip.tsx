import type { Sponsor } from '@/sanity/lib/types'
import { urlFor } from '@/sanity/lib/client'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { Reveal } from '@/components/motion/Reveal'

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

  const renderSponsor = (sponsor: Sponsor, duplicate = false) => (
    <a
      key={sponsor._id}
      href={sponsor.website ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={sponsor.name}
      tabIndex={duplicate ? -1 : undefined}
      className="flex h-11 shrink-0 items-center px-2 opacity-60 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0"
    >
      {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
        <ThemeLogo
          {...getSponsorLogoSources(sponsor)}
          alt={sponsor.name}
          width={120}
          height={40}
          className="max-h-10 object-contain"
        />
      ) : (
        <span className="text-sm font-medium text-text-muted">{sponsor.name}</span>
      )}
    </a>
  )

  // Few sponsors read better centered; several flow as an infinite marquee.
  const useMarquee = sorted.length >= 5

  return (
    <section className="border-t border-divider bg-surface py-14">
      <div className="section-container">
        <Reveal>
          <div className="mb-10 flex items-center gap-2.5 justify-center">
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">Our Sponsors</span>
          </div>
        </Reveal>

        {useMarquee ? (
          <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
            <div className="animate-marquee pause-on-hover flex w-max items-center gap-12 pr-12 lg:gap-16 lg:pr-16">
              {sorted.map((sponsor) => renderSponsor(sponsor))}
              {sorted.map((sponsor) => (
                <div key={`dup-${sponsor._id}`} aria-hidden>
                  {renderSponsor(sponsor, true)}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-10 lg:gap-14">
            {sorted.map((sponsor) => renderSponsor(sponsor))}
          </div>
        )}
      </div>
    </section>
  )
}

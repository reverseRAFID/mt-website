import { urlFor } from '@/sanity/lib/client'
import type { Sponsor } from '@/sanity/lib/types'
import { ThemeLogo } from '@/components/ui/ThemeLogo'

const TIER_ORDER: Sponsor['tier'][] = ['title', 'gold', 'silver', 'bronze', 'in-kind']

function logoSources(sponsor: Sponsor) {
  const fallback = sponsor.logo ? urlFor(sponsor.logo).height(40).url() : undefined
  return {
    lightSrc: sponsor.logoLight ? urlFor(sponsor.logoLight).height(40).url() : fallback,
    darkSrc: sponsor.logoDark ? urlFor(sponsor.logoDark).height(40).url() : fallback,
  }
}

/**
 * Global footer partner band: an always-on, full-color marquee of active
 * sponsor logos. It's rendered inside the Footer, so it rides along on every
 * page. Logos run at full color (no monochrome) and the row loops seamlessly
 * via the shared `animate-marquee` utility (two identical halves, -50% shift).
 */
export function SponsorMarquee({ sponsors }: { sponsors: Sponsor[] }) {
  if (sponsors.length === 0) return null

  const sorted = [...sponsors].sort(
    (a, b) => TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier)
  )

  // Repeat a short list so a single marquee half always overflows the viewport;
  // otherwise the seamless -50% loop would reveal an empty gap between cycles.
  const repeats = sorted.length < 6 ? Math.ceil(6 / sorted.length) : 1
  const half = Array.from({ length: repeats }, () => sorted).flat()

  const renderLogo = (sponsor: Sponsor, key: string, decorative: boolean) => (
    <a
      key={key}
      href={sponsor.website ?? '#'}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={decorative ? undefined : sponsor.name}
      aria-hidden={decorative || undefined}
      tabIndex={decorative ? -1 : undefined}
      className="flex h-9 shrink-0 items-center px-2"
    >
      {sponsor.logo || sponsor.logoLight || sponsor.logoDark ? (
        <ThemeLogo
          {...logoSources(sponsor)}
          alt={sponsor.name}
          width={110}
          height={36}
          className="max-h-9 w-auto object-contain"
        />
      ) : (
        <span className="text-sm font-medium text-text-muted">{sponsor.name}</span>
      )}
    </a>
  )

  return (
    <div className="relative overflow-hidden border-b border-divider bg-surface py-5 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex w-max animate-marquee pause-on-hover items-center gap-12 pr-12 lg:gap-16 lg:pr-16">
        {half.map((sponsor, i) => renderLogo(sponsor, `a-${sponsor._id}-${i}`, false))}
        {half.map((sponsor, i) => (
          <div key={`b-${sponsor._id}-${i}`} aria-hidden>
            {renderLogo(sponsor, `b-inner-${sponsor._id}-${i}`, true)}
          </div>
        ))}
      </div>
    </div>
  )
}

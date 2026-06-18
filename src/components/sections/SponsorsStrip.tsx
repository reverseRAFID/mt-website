import Link from 'next/link'
import type { Sponsor } from '@/sanity/lib/types'
import { urlFor } from '@/sanity/lib/client'
import { ThemeLogo } from '@/components/ui/ThemeLogo'
import { Reveal } from '@/components/motion/Reveal'

interface SponsorsStripProps {
  sponsors: Sponsor[]
}

const TIER_ORDER = ['title', 'gold', 'silver', 'bronze', 'in-kind']

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted transition-colors hover:text-primary"
    >
      {children}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5" aria-hidden>
        <path d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    </Link>
  )
}

/**
 * Home-page partners band: a kinetic logo wall (marquee on 5+, centered on
 * fewer) framed by a "Backed by" kicker and a standing "Become a sponsor" ask
 * — so the home page always pitches sponsorship, even before the first logo.
 */
export function SponsorsStrip({ sponsors }: SponsorsStripProps) {
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
    <section className="border-t border-divider bg-surface py-14 lg:py-16">
      <div className="section-container">
        <Reveal>
          <div className="mb-10 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
              <span className="hud-label text-primary">
                {sorted.length ? 'Backed by' : 'Partnerships open'}
              </span>
            </div>
            <ArrowLink href="/sponsors">Become a sponsor</ArrowLink>
          </div>
        </Reveal>

        {sorted.length === 0 ? (
          <Reveal>
            <p className="mx-auto max-w-xl text-center leading-relaxed text-text-muted">
              Be the first to put your brand on the rover.{' '}
              <Link href="/sponsors" className="link-underline font-semibold text-text hover:text-primary">
                Explore sponsorship
              </Link>{' '}
              and back Bangladesh’s mission to Mars.
            </p>
          </Reveal>
        ) : useMarquee ? (
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

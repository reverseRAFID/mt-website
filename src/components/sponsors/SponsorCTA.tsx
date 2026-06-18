import Link from 'next/link'
import { Reveal } from '@/components/motion/Reveal'
import { Magnetic } from '@/components/motion/Magnetic'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { sponsorMailto } from '@/lib/sponsorship'

/**
 * Closing conversion band — the final, unmissable ask.
 */
export function SponsorCTA() {
  return (
    <section className="relative py-20 lg:py-28">
      <div className="section-container">
        <Reveal>
          <div className="relative overflow-hidden rounded-card border border-primary/30 bg-primary-highlight px-6 py-14 text-center lg:px-12 lg:py-20">
            <CornerTicks className="text-primary/40" size="md" />
            <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40" />
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-full h-[300px] w-[600px] -translate-x-1/2 -translate-y-1/2 glow-orange blur-[120px]"
            />

            <div className="relative mx-auto max-w-2xl">
              <div className="mb-5 flex items-center justify-center gap-2.5">
                <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                <span className="hud-label text-primary">Join the mission</span>
              </div>
              <h2 className="font-display text-4xl font-bold leading-[1.05] tracking-tight text-text text-balance sm:text-5xl lg:text-6xl">
                Put your brand on the rover.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-text-muted text-pretty sm:text-lg">
                Back Bangladesh’s top Mars rover team as we compete on the world stage. Tell us about your organization and we’ll tailor a partnership that works for you.
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Magnetic>
                  <a
                    href={sponsorMailto()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-none bg-primary px-7 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
                  >
                    Become a Sponsor
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </a>
                </Magnetic>
                <Link
                  href="/contact"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-none border border-border bg-bg/40 px-7 py-3.5 text-sm font-semibold text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  Get in touch
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

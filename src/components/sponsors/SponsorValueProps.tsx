import { GhostText } from '@/components/motion/GhostText'
import { Reveal } from '@/components/motion/Reveal'
import { TiltCard } from '@/components/motion/TiltCard'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { SponsorGlyph } from '@/components/sponsors/icons'
import { VALUE_PROPS } from '@/lib/sponsorship'
import { cn } from '@/lib/utils'

/**
 * "Why sponsor us" — a bento grid of value propositions. The first card is the
 * featured hero of the grid; the rest are equal tiles. Cards tilt on hover
 * (fine-pointer only) and reveal in a stagger.
 */
export function SponsorValueProps() {
  return (
    <section className="relative py-20 lg:py-28">
      <GhostText text="IMPACT" drift="left" />
      <div className="section-container relative">
        <SectionHeader
          index="01"
          kicker="Why partner with us"
          title="Your brand on Bangladesh’s rover to Mars"
          description="Sponsoring Mongol-Tori is more than a logo. It’s reach, talent, and real-world STEM impact — on a stage few brands in the region can access."
          className="mb-12 lg:mb-16"
        />

        <Reveal stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr">
          {VALUE_PROPS.map((vp, i) => {
            const featured = i === 0
            return (
              <TiltCard
                key={vp.title}
                max={5}
                className={cn(featured && 'sm:col-span-2 lg:col-span-2 lg:row-span-2')}
              >
                <div
                  className={cn(
                    'group relative flex h-full flex-col overflow-hidden rounded-card p-7 transition-all duration-300',
                    featured
                      ? 'border border-primary/30 bg-primary-highlight hover:border-primary/50'
                      : 'border border-divider bg-surface-raised hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]'
                  )}
                >
                  {featured ? (
                    <span aria-hidden className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40" />
                  ) : (
                    <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
                  )}

                  <span
                    className={cn(
                      'relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-none transition-colors',
                      featured
                        ? 'bg-primary text-on-accent'
                        : 'border border-divider bg-surface text-text-muted group-hover:text-primary'
                    )}
                  >
                    <SponsorGlyph icon={vp.icon} size={featured ? 28 : 24} />
                  </span>

                  <h3 className={cn('relative mb-2 font-display font-bold text-text', featured ? 'text-2xl lg:text-3xl' : 'text-xl')}>
                    {vp.title}
                  </h3>
                  <p className={cn('relative flex-1 leading-relaxed text-text-muted text-pretty', featured ? 'text-base max-w-md' : 'text-sm')}>
                    {vp.description}
                  </p>

                  {vp.proof && (
                    <span className="hud-label relative mt-5 inline-flex w-fit items-center gap-2 rounded-none border border-divider bg-surface px-2.5 py-1 text-text-muted">
                      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                      {vp.proof}
                    </span>
                  )}
                </div>
              </TiltCard>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'

const CTAS = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Join the Team',
    description: 'We recruit passionate engineers, scientists, and leaders from BRAC University every semester.',
    href: '/join',
    cta: 'See Open Positions',
    primary: true,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
      </svg>
    ),
    title: 'Read Our Research',
    description: 'Explore our peer-reviewed papers, conference proceedings, and technical white papers.',
    href: '/research',
    cta: 'Browse Publications',
    primary: false,
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
    title: 'Sponsor Us',
    description: 'Help us build the next generation of rovers and give students the chance to compete on a world stage.',
    href: '/sponsors',
    cta: 'Become a Sponsor',
    primary: false,
  },
]

export function CTASection() {
  return (
    <section className="relative py-20 lg:py-28 bg-bg">
      <div className="section-container">
        <SectionHeader align="center" kicker="Get Involved" title="Be Part of the Mission" />

        <Reveal stagger className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 lg:auto-rows-fr">
          {CTAS.map((item) => (
            <div
              key={item.title}
              className={`group relative flex flex-col overflow-hidden rounded-card p-7 transition-all duration-300 ${
                item.primary
                  ? 'sm:col-span-2 lg:col-span-2 lg:row-span-2 border border-primary/30 bg-primary-highlight hover:border-primary/50'
                  : 'border border-divider bg-surface-raised hover:border-primary/40 hover:-translate-y-1 hover:shadow-[0_18px_40px_-24px_rgba(var(--primary-rgb),0.55)]'
              }`}
            >
              {item.primary ? (
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-40"
                />
              ) : (
                <CornerTicks className="text-primary/0 transition-colors group-hover:text-primary/40" />
              )}

              {item.primary && (
                <span className="hud-label relative mb-6 text-primary">Primary Track</span>
              )}

              <div
                className={`relative mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg ${
                  item.primary
                    ? 'bg-primary text-on-accent'
                    : 'border border-divider bg-surface text-text-muted group-hover:text-primary transition-colors'
                }`}
              >
                {item.icon}
              </div>

              <h3
                className={`relative font-display font-bold text-text mb-2 ${
                  item.primary ? 'text-2xl lg:text-3xl' : 'text-xl'
                }`}
              >
                {item.title}
              </h3>
              <p
                className={`relative leading-relaxed text-text-muted flex-1 mb-6 ${
                  item.primary ? 'text-base max-w-md' : 'text-sm'
                }`}
              >
                {item.description}
              </p>

              <Link
                href={item.href}
                className={`relative inline-flex items-center gap-2 rounded-md text-sm font-semibold transition-colors duration-150 ${
                  item.primary
                    ? 'self-start bg-primary px-5 py-3 text-on-accent hover:bg-primary-hover'
                    : 'self-start border border-border px-5 py-3 text-text-muted hover:border-primary hover:text-primary'
                }`}
              >
                {item.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="transition-transform group-hover:translate-x-0.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

import Link from 'next/link'

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
    <section className="py-20 bg-bg">
      <div className="section-container">
        <div className="text-center mb-12">
          <div className="inline-block accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Get Involved</p>
          </div>
          <h2 className="font-display font-bold text-3xl lg:text-4xl text-text">
            Be Part of the Mission
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6">
          {CTAS.map((item) => (
            <div
              key={item.title}
              className={`rounded-xl border p-7 flex flex-col ${
                item.primary
                  ? 'bg-primary-highlight border-primary/30'
                  : 'bg-surface border-divider'
              }`}
            >
              <div className={`mb-5 ${item.primary ? 'text-primary' : 'text-text-muted'}`}>
                {item.icon}
              </div>
              <h3 className="font-display font-bold text-xl text-text mb-2">{item.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed flex-1 mb-6">
                {item.description}
              </p>
              <Link
                href={item.href}
                className={`inline-flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-md transition-colors duration-150 ${
                  item.primary
                    ? 'bg-primary hover:bg-primary-hover text-white'
                    : 'border border-border hover:border-primary text-text-muted hover:text-primary'
                }`}
              >
                {item.cta}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'
import { ThemeLogo } from '@/components/ui/ThemeLogo'

const footerLinks = {
  Team: [
    { href: '/about', label: 'About Us' },
    { href: '/team', label: 'Members' },
    { href: '/outreach', label: 'Outreach' },
    { href: '/contact', label: 'Contact' },
  ],
  Work: [
    { href: '/rovers', label: 'Our Rovers' },
    { href: '/competitions', label: 'Competitions' },
    { href: '/sar-videos', label: 'SAR Videos' },
    { href: '/achievements', label: 'Achievements' },
  ],
  Research: [
    { href: '/research', label: 'Publications' },
    { href: '/news', label: 'News & Blog' },
    { href: '/gallery', label: 'Gallery' },
  ],
  Join: [
    { href: '/join', label: 'Open Positions' },
    { href: '/join/apply', label: 'Apply Now' },
    { href: '/sponsors', label: 'Sponsor Us' },
  ],
}

const socials = [
  {
    href: 'https://www.facebook.com/bracumongoltori',
    label: 'Facebook',
    path: <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />,
  },
  {
    href: 'https://www.linkedin.com/company/bracu-mongoltori',
    label: 'LinkedIn',
    path: (
      <>
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z" />
        <circle cx="4" cy="4" r="2" />
      </>
    ),
  },
  {
    href: 'https://github.com/bracu-mongol-tori',
    label: 'GitHub',
    path: (
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    ),
  },
  {
    href: 'https://www.youtube.com/@bracumongoltori',
    label: 'YouTube',
    path: (
      <>
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" />
        <polygon fill="currentColor" className="text-bg" points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" />
      </>
    ),
  },
]

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-surface border-t border-divider">
      {/* telemetry status row */}
      <div className="border-b border-divider">
        <div className="section-container flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-3">
          <span className="hud-label text-text-faint">
            <span className="text-primary">●</span>&nbsp; Dhaka, Bangladesh — 23.7806° N, 90.4074° E
          </span>
          <span className="hud-label text-text-faint">URC · IRC · ERC</span>
        </div>
      </div>

      <div className="section-container relative py-14 lg:py-20">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-5">
              <ThemeLogo
                lightSrc="/bracu-logo.svg"
                darkSrc="/bracu-logo-dark.svg"
                alt="BRAC University"
                width={80}
                height={32}
                className="h-8 w-auto"
              />
              <div className="w-px h-7 bg-divider shrink-0" />
              <ThemeLogo
                lightSrc="/logo.svg"
                darkSrc="/logo-dark.svg"
                alt="BRACU Mongol-Tori"
                width={120}
                height={32}
                className="h-8 w-auto"
              />
            </Link>
            <p className="text-text-muted text-sm leading-relaxed max-w-xs">
              BRAC University&apos;s competitive Mars rover team — engineering for the red planet,
              one competition at a time.
            </p>
            <div className="flex items-center gap-2.5 mt-6">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 flex items-center justify-center rounded-none border border-divider text-text-faint hover:text-primary hover:border-primary/50 hover:bg-primary-highlight transition-colors duration-150"
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    {s.path}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([group, links]) => (
            <div key={group}>
              <h3 className="hud-label text-text-faint mb-4">{group}</h3>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-muted hover:text-primary transition-colors duration-150"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-divider flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-faint">
            © {new Date().getFullYear()} BRACU Mongol-Tori. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="hud-label text-text-faint">A team of</span>
            <ThemeLogo
              lightSrc="/bracu-logo.svg"
              darkSrc="/bracu-logo-dark.svg"
              alt="BRAC University"
              width={80}
              height={24}
              className="h-6 w-auto opacity-60"
            />
          </div>
        </div>
      </div>

      {/* oversized wordmark watermark */}
      <div
        aria-hidden
        className="pointer-events-none select-none absolute -bottom-6 left-0 right-0 text-center font-display font-bold leading-none text-text/[0.025] text-[22vw] tracking-tighter"
      >
        MONGOL-TORI
      </div>
    </footer>
  )
}

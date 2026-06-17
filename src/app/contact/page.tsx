import { PageLayout } from '@/components/layout/PageLayout'
import { Reveal } from '@/components/motion/Reveal'
import { SectionHeader } from '@/components/ui/SectionHeader'
import { CornerTicks } from '@/components/ui/CornerTicks'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Contact' }

const SOCIALS = [
  {
    name: 'Facebook',
    handle: '@bracumongoltori',
    href: 'https://www.facebook.com/bracumongoltori',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    ),
  },
  {
    name: 'Instagram',
    handle: '@bracumongoltori',
    href: 'https://www.instagram.com/bracumongoltori/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    handle: 'bracu-mongol-tori',
    href: 'https://www.linkedin.com/company/bracu-mongol-tori/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
      </svg>
    ),
  },
  {
    name: 'YouTube',
    handle: 'Mongol-Tori',
    href: 'https://youtube.com/@MongolTori',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58A2.78 2.78 0 0 0 3.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.95A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="white"/>
      </svg>
    ),
  },
]

export default function ContactPage() {
  return (
    <PageLayout>
      {/* Page hero band */}
      <section className="relative overflow-hidden border-b border-divider py-16 lg:py-24">
        <div className="pointer-events-none absolute inset-0 tech-grid-sm mask-radial-fade opacity-60" />
        <div className="section-container relative">
          <Reveal>
            <SectionHeader
              kicker="Get in Touch"
              title="Contact"
              description="Questions about sponsorship, media, collaborations, or just want to say hi?"
            />
          </Reveal>
        </div>
      </section>

      <section className="relative py-20 lg:py-28">
        <div className="section-container">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12">
            {/* Reach Us — contact info + socials */}
            <div>
              <Reveal>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">Reach Us</h2>
                </div>
              </Reveal>

              <Reveal stagger className="flex flex-col gap-4 mb-12">
                {/* General / Email */}
                <div className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5">
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-primary">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="hud-label text-text-faint mb-1.5">General</p>
                      <a href="mailto:mongol-tori@bracu.ac.bd" className="link-underline break-words font-medium text-text hover:text-primary transition-colors">
                        mongol-tori@bracu.ac.bd
                      </a>
                    </div>
                  </div>
                </div>

                {/* Call Us / Phone */}
                <div className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5">
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-primary">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="hud-label text-text-faint mb-1.5">Call Us</p>
                      <a href="tel:+8801783311941" className="link-underline font-medium text-text nums hover:text-primary transition-colors">
                        +880 17833 11941
                      </a>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="group relative rounded-card border border-divider bg-surface-raised p-5 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5">
                  <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-primary">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="hud-label text-text-faint mb-1.5">Location</p>
                      <p className="font-medium text-text leading-relaxed">BRAC University, Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212, Bangladesh</p>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Follow Us */}
              <Reveal>
                <div className="flex items-center gap-2.5 mb-5">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h3 className="hud-label text-primary">Follow Us</h3>
                </div>
              </Reveal>
              <Reveal stagger className="grid sm:grid-cols-2 gap-3">
                {SOCIALS.map((s) => (
                  <a
                    key={s.name}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative flex items-center gap-3 rounded-card border border-divider bg-surface-raised p-4 transition-all duration-300 hover:border-primary/40 hover:-translate-y-0.5"
                  >
                    <CornerTicks className="text-primary/0 group-hover:text-primary/40 transition-colors" />
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-divider bg-surface text-text-faint transition-colors group-hover:text-primary">
                      {s.icon}
                    </span>
                    <span className="min-w-0">
                      <span className="block font-medium text-text transition-colors group-hover:text-primary">{s.name}</span>
                      <span className="block truncate hud-label text-text-faint">{s.handle}</span>
                    </span>
                  </a>
                ))}
              </Reveal>
            </div>

            {/* Send a Message — framed (disabled / coming soon) form panel */}
            <div>
              <Reveal>
                <div className="flex items-center gap-2.5 mb-6">
                  <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
                  <h2 className="hud-label text-primary">Send a Message</h2>
                </div>
              </Reveal>

              <Reveal y={32} blur={6}>
                <div className="relative rounded-card border border-divider bg-surface-raised p-6 lg:p-7">
                  <CornerTicks className="text-primary/40" size="md" />

                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-divider bg-surface px-3 py-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" aria-hidden />
                    <span className="hud-label text-text-muted">Coming Soon</span>
                  </div>

                  <fieldset disabled className="flex flex-col gap-4 opacity-60 cursor-not-allowed">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-name" className="hud-label text-text-faint">Name</label>
                      <input
                        id="contact-name"
                        type="text"
                        placeholder="Your name"
                        className="rounded-md border border-divider bg-surface px-3 py-2.5 text-sm text-text placeholder-text-faint cursor-not-allowed focus:outline-none focus:border-primary transition-colors"
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-email" className="hud-label text-text-faint">Email</label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="you@example.com"
                        className="rounded-md border border-divider bg-surface px-3 py-2.5 text-sm text-text placeholder-text-faint cursor-not-allowed focus:outline-none focus:border-primary transition-colors"
                        disabled
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="contact-message" className="hud-label text-text-faint">Message</label>
                      <textarea
                        id="contact-message"
                        rows={4}
                        placeholder="How can we help?"
                        className="rounded-md border border-divider bg-surface px-3 py-2.5 text-sm text-text placeholder-text-faint cursor-not-allowed focus:outline-none focus:border-primary transition-colors resize-none"
                        disabled
                      />
                    </div>
                  </fieldset>

                  <p className="mt-5 flex items-start gap-2 text-xs text-text-faint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mt-px shrink-0 text-primary" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <path d="M12 16v-4M12 8h.01" />
                    </svg>
                    <span>Contact form coming soon — reach us directly at mongoltori@bracu.ac.bd for now.</span>
                  </p>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  )
}

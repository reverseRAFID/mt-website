import { PageLayout } from '@/components/layout/PageLayout'
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
      <div className="bg-surface border-b border-divider">
        <div className="section-container py-14">
          <div className="accent-line mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-text-faint">Get in Touch</p>
          </div>
          <h1 className="font-display font-bold text-5xl text-text mb-3">Contact</h1>
          <p className="text-text-muted text-lg max-w-xl">
            Questions about sponsorship, media, collaborations, or just want to say hi?
          </p>
        </div>
      </div>

      <div className="section-container py-14">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Reach Us</h2>
            <div className="flex flex-col gap-4 mb-8">
              <div className="bg-surface rounded-xl border border-divider p-5">
                <p className="text-xs text-text-faint uppercase tracking-wide mb-1">General</p>
                <a href="mailto:mongol-tori@bracu.ac.bd" className="font-medium text-text hover:text-primary transition-colors">
                  mongol-tori@bracu.ac.bd
                </a>
              </div>
              <div className="bg-surface rounded-xl border border-divider p-5">
                <p className="text-xs text-text-faint uppercase tracking-wide mb-1">Call Us</p>
                <a href="tel:+8801783311941" className="font-medium text-text hover:text-primary transition-colors">
                  +880 17833 11941
                </a>
              </div>
              <div className="bg-surface rounded-xl border border-divider p-5">
                <p className="text-xs text-text-faint uppercase tracking-wide mb-1">Location</p>
                <p className="font-medium text-text">BRAC University, Kha 224 Pragati Sarani, Merul Badda, Dhaka 1212, Bangladesh</p>
              </div>
            </div>

            <h3 className="font-display font-bold text-lg text-text mb-4">Follow Us</h3>
            <div className="flex flex-col gap-3">
              {SOCIALS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-text-muted hover:text-primary transition-colors group"
                >
                  <span className="text-text-faint group-hover:text-primary transition-colors">{s.icon}</span>
                  <span className="font-medium">{s.name}</span>
                  <span className="text-text-faint text-sm">{s.handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick form placeholder */}
          <div>
            <h2 className="font-display font-bold text-2xl text-text mb-6 accent-line">Send a Message</h2>
            <div className="bg-surface rounded-xl border border-divider p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Name</label>
                <input
                  type="text"
                  placeholder="Your name"
                  className="bg-bg border border-divider rounded-md px-3 py-2 text-sm text-text placeholder-text-faint focus:outline-none focus:border-primary transition-colors"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Email</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="bg-bg border border-divider rounded-md px-3 py-2 text-sm text-text placeholder-text-faint focus:outline-none focus:border-primary transition-colors"
                  disabled
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-text">Message</label>
                <textarea
                  rows={4}
                  placeholder="How can we help?"
                  className="bg-bg border border-divider rounded-md px-3 py-2 text-sm text-text placeholder-text-faint focus:outline-none focus:border-primary transition-colors resize-none"
                  disabled
                />
              </div>
              <p className="text-xs text-text-faint">Contact form coming soon — reach us directly at mongoltori@bracu.ac.bd for now.</p>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

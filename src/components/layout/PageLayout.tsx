import { AnnouncementBarServer } from '@/components/layout/AnnouncementBarServer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { SupportStickyCTAServer } from '@/components/support/SupportStickyCTAServer'

interface PageLayoutProps {
  children: React.ReactNode
}

/**
 * Shared chrome + signature "mission control" backdrop for inner pages:
 * a masked technical grid and twin orange glows behind the content, both
 * theme-aware (tokens drive the colors in light and dark).
 */
export function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <AnnouncementBarServer />
      <Navbar />
      <main className="relative isolate min-h-dvh overflow-hidden bg-bg">
        {/* technical grid, faded toward the edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 tech-grid mask-radial-fade opacity-70"
        />
        {/* twin orange glows */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full glow-orange blur-[120px] opacity-80"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute top-[60vh] -right-24 h-[420px] w-[420px] rounded-full glow-orange blur-[130px] opacity-50"
        />
        <div className="relative z-10">{children}</div>
      </main>
      <Footer />
      {/* Floating crowdfunding prompt. Self-suppresses on the support pages and
          anywhere it would cover a form; absent entirely when the campaign is
          not open. */}
      <SupportStickyCTAServer />
    </>
  )
}

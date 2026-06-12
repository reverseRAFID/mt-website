import { AnnouncementBarServer } from '@/components/layout/AnnouncementBarServer'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'

interface PageLayoutProps {
  children: React.ReactNode
}

export function PageLayout({ children }: PageLayoutProps) {
  return (
    <>
      <AnnouncementBarServer />
      <Navbar />
      <main className="relative isolate min-h-screen overflow-hidden bg-bg">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          aria-hidden="true"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.45) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.45) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        <div
          className="pointer-events-none absolute top-0 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]"
          aria-hidden="true"
        />
        <div className="relative z-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  )
}

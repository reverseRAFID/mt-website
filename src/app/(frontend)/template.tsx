'use client'

import { usePathname } from 'next/navigation'
import { PageTransition } from '@/components/motion/PageTransition'

/**
 * Next.js re-mounts template.tsx on every navigation. We use it to run the
 * page-enter transition. The Payload admin (/admin) is a full app
 * that relies on fixed positioning, so it opts out of the transform wrapper.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  if (pathname?.startsWith('/admin')) {
    return <>{children}</>
  }

  return <PageTransition>{children}</PageTransition>
}

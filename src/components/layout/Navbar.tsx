'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo } from 'react'
import { useTheme } from 'next-themes'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

const navLinks = [
  { href: '/about', label: 'About' },
  { href: '/rovers', label: 'Rovers' },
  { href: '/team', label: 'Team' },
  { href: '/competitions', label: 'Competitions' },
  { href: '/research', label: 'Research' },
  { href: '/news', label: 'News' },
  { href: '/sponsors', label: 'Sponsors' },
]

export function Navbar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function getLogoSrc(surfaceMode: 'transparent' | 'solid-dark' | 'solid-light') {
    if (surfaceMode === 'solid-light') return '/logo.svg'
    return '/logo-dark.svg'
  }

  const navbarSurfaceMode = useMemo<'transparent' | 'solid-dark' | 'solid-light'>(() => {
    if (!mounted) return 'transparent'
    if (!scrolled) return 'transparent'
    return resolvedTheme === 'dark' ? 'solid-dark' : 'solid-light'
  }, [mounted, scrolled, resolvedTheme])
  const logoSrc = getLogoSrc(navbarSurfaceMode)
  const navbarTop = 'var(--announcement-bar-offset, 0px)'

  // Close menu on route change
  useEffect(() => setMenuOpen(false), [pathname])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <header
      style={{ top: navbarTop }}
      className={`sticky left-0 right-0 z-40 transition-[top] duration-300 ${
        scrolled
          ? 'bg-bg/95 backdrop-blur-md border-b border-divider shadow-sm'
          : 'bg-transparent'
      }`}
    >
      <nav className="section-container h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src={logoSrc}
            alt="BRACU Mongol-Tori"
            width={140}
            height={36}
            className="h-9 w-auto transition-opacity duration-200"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-3 py-2 rounded-md text-sm font-bold transition-colors duration-150 ${
                isActive(link.href)
                  ? 'text-primary font-semibold'
                  : 'text-text-muted hover:text-orange-500'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Join CTA + theme toggle + hamburger */}
        <div className="flex items-center gap-1">
          <Link
            href="/join"
            className="hidden sm:inline-flex items-center px-4 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-colors duration-150"
          >
            Join Us
          </Link>

          <ThemeToggle />

          {/* Hamburger — mobile only */}
          <button
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-md text-text-muted hover:text-text hover:bg-surface-offset transition-colors duration-150"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            aria-expanded={menuOpen}
          >
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-bg border-b border-divider">
          <div className="section-container py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive(link.href)
                    ? 'text-primary bg-primary-highlight font-semibold'
                    : 'text-text-muted hover:text-orange-300 hover:bg-surface-offset'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/join"
              className="mt-2 px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-white text-sm font-semibold text-center transition-colors duration-150"
            >
              Join Us
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}

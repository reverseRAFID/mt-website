'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useMemo, useRef } from 'react'
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
  { href: '/support', label: 'Support' },
]

export function Navbar() {
  const pathname = usePathname()
  const { resolvedTheme } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    let raf = 0
    const update = () => {
      const h = document.documentElement
      setScrolled(h.scrollTop > 20)
      const max = h.scrollHeight - h.clientHeight
      const p = max > 0 ? h.scrollTop / max : 0
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
      raf = 0
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    update()
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [menuOpen])

  const navbarSurfaceMode = useMemo<'transparent' | 'solid-dark' | 'solid-light'>(() => {
    if (!mounted || !scrolled) return 'transparent'
    return resolvedTheme === 'dark' ? 'solid-dark' : 'solid-light'
  }, [mounted, scrolled, resolvedTheme])

  // On a transparent (top-of-hero) bar we always want the light logo.
  const logoSrc = navbarSurfaceMode === 'solid-light' ? '/logo.svg' : '/logo-dark.svg'
  const navbarTop = 'var(--announcement-bar-offset, 0px)'

  useEffect(() => setMenuOpen(false), [pathname])

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href + '/'))

  return (
    <header
      style={{ top: navbarTop }}
      className={`sticky left-0 right-0 z-40 transition-[top,background-color,border-color] duration-300 ${
        scrolled
          ? 'bg-bg/80 backdrop-blur-xl border-b border-divider'
          : 'bg-transparent border-b border-transparent'
      }`}
    >
      <nav className="section-container h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 group" aria-label="BRACU Mongol-Tori — home">
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
          {navLinks.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? 'page' : undefined}
                className={`relative px-3 py-2 rounded-none text-sm font-semibold transition-colors duration-150 ${
                  active ? 'text-primary' : 'text-text-muted hover:text-text'
                }`}
              >
                {link.label}
                {/* Support is the campaign link — a small pip lifts it out of
                    the run of seven without adding a second button that would
                    compete with "Join Us". */}
                {link.href === '/support' && (
                  <span
                    aria-hidden
                    className="ml-1.5 inline-block h-1.5 w-1.5 rotate-45 bg-primary align-middle"
                  />
                )}
                <span
                  className={`pointer-events-none absolute left-3 right-3 -bottom-px h-px origin-left bg-primary transition-transform duration-300 ${
                    active ? 'scale-x-100' : 'scale-x-0'
                  }`}
                />
              </Link>
            )
          })}
        </div>

        {/* Right side: Join CTA + theme toggle + hamburger */}
        <div className="flex items-center gap-1.5">
          <Link
            href="/join"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 rounded-none bg-primary hover:bg-primary-hover text-on-accent text-sm font-semibold transition-colors duration-150"
          >
            Join Us
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <ThemeToggle />

          <button
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-none text-text-muted hover:text-text hover:bg-surface-offset transition-colors duration-150"
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

      {/* Scroll progress hairline */}
      <div className="absolute bottom-0 left-0 right-0 h-px overflow-hidden">
        <div ref={progressRef} className="h-full w-full origin-left scale-x-0 bg-primary" />
      </div>

      {/* Mobile menu */}
      <div
        className={`lg:hidden overflow-hidden border-divider bg-bg/95 backdrop-blur-xl transition-[max-height,opacity] duration-300 ease-out ${
          menuOpen ? 'max-h-[80vh] opacity-100 border-b' : 'max-h-0 opacity-0 border-b-0'
        }`}
      >
        <div className="section-container py-4 flex flex-col gap-1">
          {navLinks.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ transitionDelay: menuOpen ? `${i * 30}ms` : '0ms' }}
              className={`flex items-center gap-3 px-3 py-3 rounded-none text-base font-semibold transition-colors duration-150 ${
                isActive(link.href)
                  ? 'text-primary bg-primary-highlight'
                  : 'text-text-muted hover:text-text hover:bg-surface-offset'
              }`}
            >
              <span className="hud-label text-text-faint w-6">{String(i + 1).padStart(2, '0')}</span>
              {link.label}
            </Link>
          ))}
          <Link
            href="/join"
            className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-none bg-primary hover:bg-primary-hover text-on-accent text-sm font-semibold transition-colors duration-150"
          >
            Join the Team
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </header>
  )
}

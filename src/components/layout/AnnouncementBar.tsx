'use client'

import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import type { Announcement } from '@/sanity/lib/types'

interface AnnouncementBarProps {
  announcements: Announcement[]
}

export function AnnouncementBar({ announcements }: AnnouncementBarProps) {
  const [visible, setVisible] = useState(false)
  const [current, setCurrent] = useState(0)
  const [slideIn, setSlideIn] = useState(false)
  const barRef = useRef<HTMLDivElement | null>(null)
  const heightKey = announcementHeightKey(announcements, current)

  useLayoutEffect(() => {
    const updateOffset = () => {
      const height = barRef.current?.getBoundingClientRect().height ?? 0
      document.documentElement.style.setProperty('--announcement-bar-offset', visible ? `${height}px` : '0px')
    }

    updateOffset()

    const resizeObserver = typeof ResizeObserver !== 'undefined' && barRef.current
      ? new ResizeObserver(updateOffset)
      : null

    if (resizeObserver && barRef.current) {
      resizeObserver.observe(barRef.current)
    }

    return () => {
      resizeObserver?.disconnect()
      document.documentElement.style.setProperty('--announcement-bar-offset', '0px')
    }
  }, [visible, heightKey])

  useEffect(() => {
    if (announcements.length > 0) {
      setVisible(true)
      setTimeout(() => setSlideIn(true), 50)
    }

    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % announcements.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [announcements.length])

  if (!visible || announcements.length === 0) return null

  const announcement = announcements[current]

  return (
    <div
      ref={barRef}
      className={`sticky top-0 z-50 overflow-hidden border-b border-primary/40 bg-[#0a0a0a] text-primary transition-transform duration-500 ${
        slideIn ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="banner"
    >
      {/* faint scanning sheen */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_50%,rgba(255,107,26,0.18),transparent_30%),radial-gradient(circle_at_85%_50%,rgba(255,107,26,0.10),transparent_26%)]" />
      <div className="section-container relative flex min-h-[44px] flex-nowrap items-center justify-between gap-2 py-2.5 sm:min-h-[52px] sm:gap-4">
        <div className="flex min-w-0 flex-1 items-center gap-2.5 sm:gap-3.5">
          <span className="hidden shrink-0 items-center gap-1.5 rounded-none border border-primary/40 bg-primary/10 px-2.5 py-1 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" />
            <span className="hud-label text-[9px] text-primary sm:text-[10px]">Transmission</span>
          </span>
          {/* mobile-only pulse dot */}
          <span className="h-1.5 w-1.5 shrink-0 rounded-none bg-primary animate-pulse-glow sm:hidden" />

          <div className="min-w-0 flex-1 overflow-hidden">
            <span className="block truncate text-[11px] font-semibold leading-tight text-primary/90 sm:text-sm">
              {announcement.message}
            </span>
          </div>
        </div>

        {announcement.link && (
          <Link
            href={announcement.link}
            className="inline-flex shrink-0 items-center gap-1 rounded-none border border-primary/40 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm"
          >
            {announcement.linkLabel ?? 'Learn more'}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:h-3.5 sm:w-3.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}

function announcementHeightKey(announcements: Announcement[], current: number) {
  const announcement = announcements[current]
  return `${announcement?._id ?? ''}:${announcement?.message ?? ''}:${announcement?.link ?? ''}`
}

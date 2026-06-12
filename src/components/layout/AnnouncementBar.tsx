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
  }, [visible, announcementHeightKey(announcements, current)])

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
      className={`sticky top-0 z-50 overflow-hidden border-b border-orange-500 bg-[rgba(0,0,0,0.87)] text-orange-500 backdrop-blur-2xl shadow-[0_16px_50px_rgba(0,0,0,0.28)] transition-transform duration-500 ${
        slideIn ? 'translate-y-0' : '-translate-y-full'
      }`}
      role="banner"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(255, 255, 255, 0.08),transparent_28%),radial-gradient(circle_at_80%_50%,rgba(255,255,255,0.04),transparent_24%)]" />
      <div className="section-container relative flex min-h-[48px] flex-nowrap items-center justify-between gap-2 py-3 sm:min-h-[64px] sm:gap-1">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
          <span className="hidden shrink-0 items-center rounded-full border border-orange-500 bg-orange-500/20 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.18em] text-orange-300 shadow-[0_0_0_1px_rgba(255,255,255,0.03)] sm:inline-flex sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.24em]">
            Announcement
          </span>
          <div className="min-w-0 flex-1 overflow-hidden whitespace-nowrap text-center sm:text-left">
            <span className="block truncate text-[10px] font-bold leading-[1.2] text-orange-300 drop-shadow-[0_1px_1px_rgba(255,146,73,0.08)] sm:text-sm sm:leading-normal">
              {announcement.message}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-end gap-1.5 shrink-0 sm:gap-2">
          {announcement.link && (
            <Link
              href={announcement.link}
              className="inline-flex items-center gap-1 rounded-full border border-orange-500 bg-orange-500/20 px-2.5 py-1 text-[10px] font-semibold text-orange-300 shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur-md transition-colors hover:bg-orange-500/14 sm:gap-1.5 sm:px-4 sm:py-1.5 sm:text-sm"
            >
              {announcement.linkLabel ?? 'Learn more'}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="sm:w-[14px] sm:h-[14px]">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function announcementHeightKey(announcements: Announcement[], current: number) {
  const announcement = announcements[current]
  return `${announcement?._id ?? ''}:${announcement?.message ?? ''}:${announcement?.link ?? ''}`
}

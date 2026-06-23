'use client'

import { useState } from 'react'

/**
 * Click-to-load YouTube facade. Renders the video poster + an accessible play
 * button; the actual iframe is only mounted on interaction, so the heavy embed
 * stays out of first paint. The poster uses a plain <img> (no next/image domain
 * config needed) and falls back from maxres to hq quality.
 */
export function SarFacade({
  id,
  title,
  poster,
}: {
  id: string
  title: string
  poster?: string
}) {
  const [playing, setPlaying] = useState(false)
  const [src, setSrc] = useState(poster ?? `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`)

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`Play ${title}`}
      className="group relative block h-full w-full overflow-hidden outline-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden
        loading="lazy"
        onError={() => setSrc(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span aria-hidden className="pointer-events-none absolute inset-0 scanlines bg-bg/30 transition-colors group-hover:bg-bg/15" />
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-none border border-primary/60 bg-bg/70 backdrop-blur-sm transition-all duration-300 group-hover:scale-105 group-hover:border-primary group-hover:bg-primary group-focus-visible:scale-105 group-focus-visible:border-primary group-focus-visible:bg-primary"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5 text-primary transition-colors group-hover:text-on-accent group-focus-visible:text-on-accent" aria-hidden>
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
      <span aria-hidden className="absolute bottom-3 right-3 hud-label text-text-faint [text-shadow:0_1px_2px_rgba(0,0,0,0.4)]">
        Click to load feed
      </span>
    </button>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

const STATS = [
  { value: 10, label: 'Years Active', suffix: '+' },
  { value: 12, label: 'Competitions', suffix: '+' },
  { value: 70, label: 'Team Members', suffix: '+' },
  { value: 3, label: 'Continents Competed', suffix: '' },
]

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!start) return
    const step = target / (duration / 16)
    let current = 0
    const timer = setInterval(() => {
      current += step
      if (current >= target) {
        setCount(target)
        clearInterval(timer)
      } else {
        setCount(Math.floor(current))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration, start])

  return count
}

function StatItem({ value, label, suffix, started }: { value: number; label: string; suffix: string; started: boolean }) {
  const count = useCountUp(value, 1800, started)
  return (
    <div className="text-center">
      <div className="font-display font-bold text-4xl lg:text-5xl text-primary tabular-nums">
        {count}{suffix}
      </div>
      <div className="text-sm text-white/70 mt-1 font-medium">{label}</div>
    </div>
  )
}

export function Hero() {
  const [statsStarted, setStatsStarted] = useState(false)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true) },
      { threshold: 0.3 }
    )
    if (statsRef.current) observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden bg-[#050505]">
      {/* Background grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '48px 48px',
        }}
      />

      {/* Orange glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />

      <div className="section-container relative z-10 pt-24 pb-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-6">
            {/* <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> */}
            <span className="text-xs text-white/70 font-medium tracking-wide uppercase">
              Built by Dreamers and Problem Solvers
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-display font-bold text-5xl sm:text-6xl lg:text-7xl xl:text-8xl text-white leading-[0.95] tracking-tight mb-6">
            Engineered for{' '}
            <span className="text-primary">Mars.</span>
          </h1>

          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto leading-relaxed mb-10">
            BRACU Mongol-Tori designs and builds Mars rovers to compete at URC, IRC, and ERC —
            pushing the boundaries of engineering, autonomy, and science at the undergraduate level.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/rovers"
              className="inline-flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-md font-semibold text-sm transition-colors duration-150"
            >
              Explore Our Rovers
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-md font-semibold text-sm border border-white/10 transition-colors duration-150"
            >
              Join the Team
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div
          ref={statsRef}
          className="mt-20 max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 border-t border-white/10 pt-12"
        >
          {STATS.map((stat) => (
            <StatItem key={stat.label} {...stat} started={statsStarted} />
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30">
        <span className="text-xs tracking-widest uppercase">Scroll</span>
        <div className="w-px h-8 bg-gradient-to-b from-white/30 to-transparent" />
      </div>
    </section>
  )
}

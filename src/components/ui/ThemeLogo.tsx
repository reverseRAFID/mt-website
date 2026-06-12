'use client'

import Image from 'next/image'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

interface ThemeLogoProps {
  lightSrc?: string
  darkSrc?: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}

export function ThemeLogo({ lightSrc, darkSrc, alt, width, height, className, priority }: ThemeLogoProps) {
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Before mount: render an invisible placeholder with same dimensions to avoid layout shift
  if (!mounted) {
    return <div style={{ width, height }} className={className} />
  }

  const src = (resolvedTheme === 'dark' ? darkSrc : lightSrc) ?? lightSrc ?? darkSrc

  // No usable source: render a placeholder rather than passing an empty src to next/image
  if (!src) {
    return <div style={{ width, height }} className={className} />
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  )
}

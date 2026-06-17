import { type ReactNode } from 'react'

interface SectionHeaderProps {
  /** Zero-padded section index, e.g. "01". */
  index?: string
  /** Mono telemetry kicker, e.g. "Featured Rover". */
  kicker?: string
  title: ReactNode
  description?: ReactNode
  align?: 'left' | 'center'
  /** Right-aligned action (desktop), e.g. a "View all" link. */
  action?: ReactNode
  className?: string
  titleClassName?: string
  /** Heading element for the title. Use `h1` for a page's primary header. Defaults to `h2`. */
  as?: 'h1' | 'h2'
}

/**
 * Shared section header — the consistent kicker + heading lockup used across
 * every section and page. Keeps typographic rhythm identical site-wide.
 */
export function SectionHeader({
  index,
  kicker,
  title,
  description,
  align = 'left',
  action,
  className = '',
  titleClassName = '',
  as: Heading = 'h2',
}: SectionHeaderProps) {
  const centered = align === 'center'

  return (
    <div
      className={`flex flex-col gap-5 sm:flex-row sm:items-end ${
        centered ? 'sm:flex-col sm:items-center text-center' : 'justify-between'
      } ${className}`}
    >
      <div className={centered ? 'max-w-2xl mx-auto' : 'max-w-2xl'}>
        {kicker && (
          <div
            className={`flex items-center gap-2.5 mb-4 ${centered ? 'justify-center' : ''}`}
          >
            <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
            <span className="hud-label text-primary">
              {index && <span className="text-text-faint">{index} / </span>}
              {kicker}
            </span>
          </div>
        )}
        <Heading
          className={`font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-text tracking-tight text-balance leading-[1.05] ${titleClassName}`}
        >
          {title}
        </Heading>
        {description && (
          <p
            className={`mt-4 text-base sm:text-lg text-text-muted leading-relaxed text-pretty ${
              centered ? 'mx-auto' : ''
            }`}
          >
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0 hidden sm:block">{action}</div>}
    </div>
  )
}

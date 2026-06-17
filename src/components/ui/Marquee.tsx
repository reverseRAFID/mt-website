interface MarqueeProps {
  items: string[]
  className?: string
}

/**
 * Seamless kinetic marquee band. Two identical rows translate -50% so the loop
 * is gapless; pauses on hover and stills under reduced-motion (global rule).
 */
export function Marquee({ items, className = '' }: MarqueeProps) {
  const Row = ({ hidden }: { hidden?: boolean }) => (
    <ul className="flex shrink-0 items-center gap-10 pr-10" aria-hidden={hidden}>
      {items.map((t, i) => (
        <li key={`${t}-${i}`} className="flex items-center gap-10">
          <span className="display-figure text-2xl uppercase tracking-tight text-text/70 sm:text-3xl">
            {t}
          </span>
          <span className="text-primary" aria-hidden>
            ◆
          </span>
        </li>
      ))}
    </ul>
  )

  return (
    <div className={`relative overflow-hidden border-y border-divider bg-surface py-5 ${className}`}>
      <div className="flex w-max animate-marquee pause-on-hover">
        <Row />
        <Row hidden />
      </div>
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-surface to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-surface to-transparent" />
    </div>
  )
}

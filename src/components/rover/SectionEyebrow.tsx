/**
 * The one canonical mission-control eyebrow used by every numbered rover
 * section, so the 01..08 sequence and styling live in a single place.
 * Server component — purely presentational.
 */
export function SectionEyebrow({
  index,
  label,
  className = '',
}: {
  /** Two-digit section number, e.g. "02". Omit for unnumbered sections. */
  index?: string
  label: string
  className?: string
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <span className="h-1.5 w-1.5 rotate-45 bg-primary" aria-hidden />
      <span className="hud-label text-primary">
        {index && <span className="text-text-faint">{index} / </span>}
        {label}
      </span>
    </div>
  )
}

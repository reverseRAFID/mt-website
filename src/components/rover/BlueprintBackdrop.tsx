import { CornerTicks } from '@/components/ui/CornerTicks'

/**
 * On-brand telemetry/blueprint backdrop used wherever a rover image is missing.
 * Pure CSS/SVG, decorative, theme-aware — keeps image-less rovers cinematic
 * instead of showing an empty grey box. Drop inside a `relative` frame.
 */
export function BlueprintBackdrop({
  label = 'NO VISUAL FEED',
  watermark,
  className = '',
}: {
  label?: string
  watermark?: string
  className?: string
}) {
  return (
    <div aria-hidden className={`absolute inset-0 overflow-hidden bg-surface-2 ${className}`}>
      <div className="absolute inset-0 tech-grid-sm opacity-50" />
      {/* radar rings + crosshair */}
      <svg
        className="absolute left-1/2 top-1/2 h-[120%] w-[120%] -translate-x-1/2 -translate-y-1/2 text-primary/25"
        viewBox="0 0 400 400"
        fill="none"
        stroke="currentColor"
      >
        <circle cx="200" cy="200" r="60" strokeWidth="0.75" />
        <circle cx="200" cy="200" r="110" strokeWidth="0.75" strokeDasharray="3 5" />
        <circle cx="200" cy="200" r="160" strokeWidth="0.75" strokeDasharray="1 7" />
        <path d="M200 20V380M20 200H380" strokeWidth="0.5" className="text-primary/15" />
        <circle cx="200" cy="200" r="3" fill="currentColor" stroke="none" />
      </svg>
      {watermark && (
        <span className="absolute inset-0 flex select-none items-center justify-center font-display text-[22vw] font-bold uppercase leading-none tracking-tighter text-text/[0.04] lg:text-[12vw]">
          {watermark}
        </span>
      )}
      <span className="absolute bottom-3 left-3 hud-label text-text-faint">{label}</span>
      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-none bg-primary animate-pulse-glow" />
        <span className="hud-label text-[9px] text-text-faint">STANDBY</span>
      </span>
      <CornerTicks className="text-primary/30" size="md" />
    </div>
  )
}

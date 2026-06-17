const NOISE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E"

/**
 * Cinematic film grain — a fixed, non-interactive overlay that shimmers via the
 * mt-grain keyframe (auto-stilled under reduced-motion by the global rule).
 */
export function GrainOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden mix-blend-soft-light">
      <div
        className="absolute -inset-1/2 h-[200%] w-[200%] opacity-[0.06] motion-safe:animate-[mt-grain_0.8s_steps(4)_infinite]"
        style={{ backgroundImage: `url("${NOISE}")`, backgroundSize: '140px 140px' }}
      />
    </div>
  )
}

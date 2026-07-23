import { rankTier, type RankTierKey } from '@/lib/crowdfunding'
import { cn } from '@/lib/utils'

/**
 * Per-tier styling. Ranks 1–3 use the metal tokens; 4–5 fall back to the house
 * orange (solid, then outline) so the badge band reads as a gradient of
 * prominence rather than five competing colours.
 */
const TIER_STYLES: Record<RankTierKey, string> = {
  gold: 'border-rank-gold/45 bg-rank-gold-bg text-rank-gold',
  silver: 'border-rank-silver/45 bg-rank-silver-bg text-rank-silver',
  bronze: 'border-rank-bronze/45 bg-rank-bronze-bg text-rank-bronze',
  core: 'border-primary/50 bg-primary text-on-accent',
  'core-outline': 'border-primary/50 bg-transparent text-primary',
}

/** Row accents for the honour-roll table — left rule + faint row tint. */
export const ROW_STYLES: Record<RankTierKey, string> = {
  gold: 'border-l-rank-gold bg-rank-gold-bg/50',
  silver: 'border-l-rank-silver bg-rank-silver-bg/50',
  bronze: 'border-l-rank-bronze bg-rank-bronze-bg/50',
  core: 'border-l-primary bg-primary-highlight/40',
  'core-outline': 'border-l-primary/60 bg-primary-highlight/25',
}

/** The rank readout's own colour, so `#01` matches its badge. */
export const RANK_TEXT: Record<RankTierKey, string> = {
  gold: 'text-rank-gold',
  silver: 'text-rank-silver',
  bronze: 'text-rank-bronze',
  core: 'text-primary',
  'core-outline': 'text-primary',
}

/**
 * Badge for a top-ranked supporter. Renders nothing past the highlighted band,
 * so callers can drop it into every row unconditionally.
 */
export function RankBadge({ rank, className }: { rank: number; className?: string }) {
  const tier = rankTier(rank)
  if (!tier) return null

  return (
    <span
      className={cn(
        'hud-label inline-flex items-center gap-1.5 whitespace-nowrap rounded-none border px-2 py-1',
        TIER_STYLES[tier.key],
        className
      )}
    >
      <span aria-hidden className="h-1 w-1 rotate-45 bg-current" />
      {tier.label}
      {/* The visible label repeats across ranks 4 and 5; the ordinal keeps
          each badge distinguishable to a screen reader. */}
      <span className="sr-only"> — {tier.description}</span>
    </span>
  )
}

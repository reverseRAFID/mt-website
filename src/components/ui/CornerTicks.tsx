/**
 * Mission-control corner brackets. Drop inside any `relative` container.
 * Color is inherited via `border-current`, so set a text color + opacity on
 * the wrapper (e.g. `text-primary/40`). Decorative only.
 */
export function CornerTicks({
  className = 'text-primary/40',
  size = 'sm',
}: {
  className?: string
  size?: 'sm' | 'md'
}) {
  const s = size === 'md' ? 'w-3 h-3' : 'w-2.5 h-2.5'
  return (
    <span aria-hidden className={`pointer-events-none absolute inset-0 ${className}`}>
      <span className={`absolute left-0 top-0 ${s} border-l border-t border-current`} />
      <span className={`absolute right-0 top-0 ${s} border-r border-t border-current`} />
      <span className={`absolute left-0 bottom-0 ${s} border-l border-b border-current`} />
      <span className={`absolute right-0 bottom-0 ${s} border-r border-b border-current`} />
    </span>
  )
}

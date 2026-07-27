import type { PublicOrder } from '@/sanity/lib/types'
import { ORDER_TIMELINE, timelineLabel } from '@/lib/shop'

/**
 * Where the order has got to.
 *
 * A cancelled order does not render a progress track at all. Showing five steps
 * with a line stopped part-way, next to the word "cancelled", invites the
 * reader to wonder whether it might still be coming.
 *
 * Server component — nothing here is interactive.
 */
export function OrderTimeline({ order }: { order: PublicOrder }) {
  if (order.status === 'cancelled') {
    return (
      <div className="border border-divider bg-surface-raised p-5">
        <div className="flex items-center gap-3">
          <span aria-hidden className="h-2.5 w-2.5 rotate-45 bg-text-faint" />
          <h2 className="font-display text-lg font-bold uppercase tracking-tight text-text">
            Cancelled
          </h2>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-text-muted">
          {order.cancellationReason
            ? order.cancellationReason
            : 'This order was cancelled. Nothing was charged — it was cash on delivery.'}
        </p>
      </div>
    )
  }

  // Timestamps come from the audit trail rather than being inferred, so a step
  // shows the moment it actually happened.
  const timestamps = new Map(
    (order.statusHistory ?? []).map((event) => [event.status, event.at])
  )
  const currentIndex = ORDER_TIMELINE.indexOf(order.status)

  return (
    <div className="border border-divider bg-surface-raised p-5">
      <h2 className="hud-label mb-5 text-text-muted">Progress</h2>
      <ol className="flex flex-col">
        {ORDER_TIMELINE.map((status, index) => {
          const done = index <= currentIndex
          const current = index === currentIndex
          const at = timestamps.get(status)
          const isLast = index === ORDER_TIMELINE.length - 1

          return (
            <li key={status} className="flex gap-4">
              {/* Marker column: dot plus the connector down to the next step. */}
              <div className="flex flex-col items-center">
                <span
                  aria-hidden
                  className={`mt-0.5 h-3 w-3 shrink-0 rotate-45 border-2 transition-colors ${
                    current
                      ? 'border-primary bg-primary'
                      : done
                        ? 'border-primary bg-primary'
                        : 'border-divider bg-surface'
                  }`}
                />
                {!isLast && (
                  <span
                    aria-hidden
                    className={`w-px flex-1 ${index < currentIndex ? 'bg-primary' : 'bg-divider'}`}
                  />
                )}
              </div>

              <div className={`flex-1 ${isLast ? 'pb-0' : 'pb-6'}`}>
                <p
                  className={`text-sm font-semibold ${
                    done ? 'text-text' : 'text-text-faint'
                  }`}
                >
                  {timelineLabel(status, order.deliveryMethod)}
                  {current && (
                    <span className="ml-2 text-xs font-bold uppercase tracking-wider text-primary">
                      Now
                    </span>
                  )}
                </p>
                {at && (
                  <time
                    dateTime={at}
                    className="mt-0.5 block text-xs text-text-faint nums"
                  >
                    {new Date(at).toLocaleString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </time>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

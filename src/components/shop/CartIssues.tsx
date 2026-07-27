'use client'

import type { CartIssue } from '@/lib/orders'

/**
 * What changed in the customer's cart since they filled it.
 *
 * Every message comes from the server already written for a human — the client
 * does not re-phrase them, because the server is the only side that knows which
 * product and which variant, and duplicating that copy here would let the two
 * drift.
 *
 * Rendered as an alert with `aria-live` because it appears in response to an
 * action the customer took and explains why the page is not what they expected.
 */
export function CartIssues({ issues }: { issues: CartIssue[] }) {
  if (issues.length === 0) return null

  return (
    <div
      role="alert"
      aria-live="polite"
      className="border border-primary/40 bg-primary-highlight px-4 py-4"
    >
      <p className="hud-label mb-2 text-primary">
        {issues.length === 1 ? 'One item changed' : `${issues.length} items changed`}
      </p>
      <ul className="flex flex-col gap-1.5">
        {issues.map((issue, index) => (
          <li
            key={`${issue.productId}-${issue.variantKey}-${issue.code}-${index}`}
            className="flex gap-2 text-sm leading-relaxed text-text"
          >
            <span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rotate-45 bg-primary" />
            {issue.message}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-text-muted">
        Prices and stock are checked live, so this reflects what is actually available right now.
      </p>
    </div>
  )
}

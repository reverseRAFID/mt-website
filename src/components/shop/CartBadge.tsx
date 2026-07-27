'use client'

import Link from 'next/link'
import { useCart } from '@/providers/CartProvider'

/**
 * Cart link with a live item count, for the navbar.
 *
 * The count renders only once the cart has hydrated from localStorage. Before
 * that the server-rendered markup and the client's first render must agree, and
 * the server has no way to know what is in this browser — showing a "0" that
 * immediately becomes "3" is both a hydration mismatch and a visible flicker.
 */
export function CartBadge({ className = '' }: { className?: string }) {
  const { count, hydrated } = useCart()
  const showCount = hydrated && count > 0

  return (
    <Link
      href="/shop/cart"
      aria-label={showCount ? `Cart — ${count} item${count === 1 ? '' : 's'}` : 'Cart'}
      className={`relative flex h-11 w-11 items-center justify-center rounded-none text-text-muted transition-colors duration-150 hover:bg-surface-offset hover:text-text ${className}`}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
      </svg>

      {showCount && (
        <span
          aria-hidden
          className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center bg-primary px-1 text-[10px] font-bold leading-none text-on-accent nums"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

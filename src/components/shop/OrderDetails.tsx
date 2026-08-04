import Image from 'next/image'
import Link from 'next/link'
import type { PublicOrder } from '@/lib/orders'
import { DELIVERY_METHOD_LABELS, formatMoney } from '@/lib/shop'

/**
 * The order's items, totals and delivery summary.
 *
 * ── PRIVACY ───────────────────────────────────────────────────
 * Everything rendered here arrives already masked from
 * `getOrderByTrackId()` — `maskedPhone` is the last three digits and
 * `maskedAddress` is area and city only. This page is reachable by anyone
 * holding the track ID, so it shows enough for the buyer to recognise their own
 * order and nothing that would help a stranger find or contact them.
 *
 * Never reach past PublicOrder for a fuller shape to render here.
 */
export function OrderDetails({ order }: { order: PublicOrder }) {
  const unpaid = order.paymentStatus === 'unpaid' && order.status !== 'cancelled'

  return (
    <div className="flex flex-col gap-5">
      <div className="border border-divider bg-surface-raised">
        <h2 className="hud-label border-b border-divider px-5 py-4 text-text-muted">
          {order.items.length === 1 ? '1 item' : `${order.items.length} items`}
        </h2>

        <ul>
          {order.items.map((item, index) => (
            <li
              key={`${item.productId}-${item.variantKey}-${index}`}
              className={`flex gap-4 p-5 ${index > 0 ? 'border-t border-divider' : ''}`}
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-divider bg-surface">
                {item.imageUrl ? (
                  <Image src={item.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-[10px] text-text-faint">
                    No image
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                {/* Links only when the product still exists on the site. A
                    discontinued product leaves the order intact but has no page
                    left to point at. */}
                {item.productSlug ? (
                  <Link
                    href={`/shop/${item.productSlug}`}
                    className="font-display text-sm font-bold uppercase leading-tight tracking-tight text-text transition-colors hover:text-primary"
                  >
                    {item.productTitle}
                  </Link>
                ) : (
                  <span className="font-display text-sm font-bold uppercase leading-tight tracking-tight text-text">
                    {item.productTitle}
                  </span>
                )}
                <p className="mt-0.5 text-xs text-text-faint">
                  {item.variantLabel}
                  {item.sku ? ` · ${item.sku}` : ''}
                </p>
                <p className="mt-1 text-sm text-text-muted nums">
                  {item.quantity} × {formatMoney(item.unitPrice)}
                </p>
              </div>

              <span className="shrink-0 font-display text-sm font-bold text-text nums">
                {formatMoney(item.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="flex flex-col gap-2 border-t border-divider p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Subtotal</dt>
            <dd className="font-semibold text-text nums">{formatMoney(order.subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">
              {order.deliveryMethod === 'campus' ? 'Campus handover' : 'Home delivery'}
            </dt>
            <dd className="font-semibold text-text nums">
              {order.deliveryFee === 0 ? 'Free' : formatMoney(order.deliveryFee)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-divider pt-3">
            <dt className="font-display text-base font-bold uppercase text-text">Total</dt>
            <dd className="font-display text-base font-bold text-text nums">
              {formatMoney(order.total)}
            </dd>
          </div>
        </dl>
      </div>

      {unpaid && (
        <div className="border-2 border-primary/50 bg-primary-highlight px-5 py-4">
          <p className="hud-label text-primary">Cash on delivery</p>
          <p className="mt-1 text-sm leading-relaxed text-text">
            Have <span className="font-semibold nums">{formatMoney(order.total)}</span> ready
            {order.deliveryMethod === 'campus' ? ' when you collect' : ' when it arrives'}.
          </p>
        </div>
      )}

      <div className="border border-divider bg-surface-raised p-5">
        <h2 className="hud-label mb-3 text-text-muted">
          {order.deliveryMethod === 'campus' ? 'Collection' : 'Delivering to'}
        </h2>
        <div className="flex flex-col gap-1 text-sm text-text">
          <span className="font-semibold">{order.customerName}</span>
          <span className="text-text-muted">
            {order.deliveryMethod === 'campus'
              ? order.campusHandoverPoint || DELIVERY_METHOD_LABELS.campus
              : order.maskedAddress}
          </span>
          <span className="text-text-muted nums">{order.maskedPhone}</span>
        </div>
        <p className="mt-3 border-t border-divider pt-3 text-xs leading-relaxed text-text-faint">
          Your full address and phone number are hidden here on purpose — anyone with this link
          could otherwise read them. We hold the complete details.
        </p>
      </div>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { headers } from 'next/headers'
import { PageLayout } from '@/components/layout/PageLayout'
import { CornerTicks } from '@/components/ui/CornerTicks'
import { TrackForm } from '@/components/shop/TrackForm'
import { OrderTimeline } from '@/components/shop/OrderTimeline'
import { OrderDetails } from '@/components/shop/OrderDetails'
import { getOrderByTrackId } from '@/lib/orders'
import { getShopConfigInternal } from '@/lib/shop-server'
import { rateLimit } from '@/lib/rate-limit'
import { ORDER_STATUS_LABELS } from '@/lib/shop'

interface Props {
  params: Promise<{ trackId: string }>
  searchParams: Promise<{ placed?: string }>
}

// Reads a specific order every time — never prerender or cache this.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Order Status',
  // Kept out of search results deliberately. The page is reachable by anyone
  // holding the ID, and an indexed order page would put a real person's order
  // one search away.
  robots: { index: false, follow: false, nocache: true },
}

/**
 * Lookups per IP per minute.
 *
 * The track ID carries ~40 bits of entropy, so brute force is already
 * infeasible — this exists to stop a scripted sweep burning API quota, not as
 * the primary defence. Loose enough that a customer refreshing to watch for a
 * status change is never blocked.
 */
const RATE = { limit: 30, windowMs: 60 * 1000 } as const

export default async function TrackDetailPage({ params, searchParams }: Props) {
  const { trackId } = await params
  const { placed } = await searchParams

  const headerList = await headers()
  const ip = headerList.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const limited = rateLimit(`shop-track:${ip}`, RATE.limit, RATE.windowMs)

  const config = await getShopConfigInternal()
  // Everything this renders is already masked by getOrderByTrackId — the full
  // address, phone and email never leave the server. See src/lib/orders.ts.
  const order = limited.ok ? await getOrderByTrackId(trackId, config) : null

  return (
    <PageLayout>
      <section className="relative border-b border-divider py-10 lg:py-14">
        <div className="section-container">
          <nav aria-label="Breadcrumb" className="mb-6">
            <Link href="/shop" className="hud-label text-text-faint transition-colors hover:text-primary">
              ← Back to the store
            </Link>
          </nav>

          {!limited.ok ? (
            <NotFoundPanel
              title="Too many lookups"
              body="You have checked a lot of references in a short time. Wait a minute and try again."
            />
          ) : !order ? (
            <NotFoundPanel
              title="We could not find that order"
              body="Check the reference against your confirmation email — it is easy to mistype. It looks like MT-7K4QX2ZP."
              showForm
            />
          ) : (
            <>
              {placed === '1' && (
                <div
                  role="status"
                  className="mb-8 border-2 border-primary/50 bg-primary-highlight px-5 py-4"
                >
                  <p className="font-display text-lg font-bold uppercase tracking-tight text-primary">
                    Order placed — thank you
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text">
                    We have emailed your receipt and this tracking link. Save the reference below;
                    it is how you find this page again.
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <span className="hud-label text-primary">
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                  <h1 className="mt-2 font-display text-3xl font-bold uppercase leading-none tracking-tight text-text sm:text-4xl">
                    {order.trackId}
                  </h1>
                  <p className="mt-2 text-sm text-text-muted">
                    Placed{' '}
                    <time dateTime={order.placedAt} className="nums">
                      {new Date(order.placedAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </time>
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {order && (
        <section className="relative py-10 lg:py-14">
          <div className="section-container">
            <div className="grid gap-6 lg:grid-cols-[340px_1fr] lg:items-start">
              <OrderTimeline order={order} />
              <OrderDetails order={order} />
            </div>

            {(config.supportEmail || config.supportPhone) && (
              <p className="mt-8 text-sm text-text-muted">
                Something not right? Quote <span className="font-mono font-semibold text-text">{order.trackId}</span> and
                {config.supportEmail && (
                  <>
                    {' '}email{' '}
                    <a href={`mailto:${config.supportEmail}`} className="font-semibold text-primary underline underline-offset-4">
                      {config.supportEmail}
                    </a>
                  </>
                )}
                {config.supportPhone && (
                  <>
                    {config.supportEmail ? ' or call ' : ' call '}
                    <a href={`tel:${config.supportPhone.replace(/\s/g, '')}`} className="font-semibold text-primary underline underline-offset-4">
                      {config.supportPhone}
                    </a>
                  </>
                )}
                .
              </p>
            )}
          </div>
        </section>
      )}
    </PageLayout>
  )
}

function NotFoundPanel({
  title,
  body,
  showForm = false,
}: {
  title: string
  body: string
  showForm?: boolean
}) {
  return (
    <div className="relative mx-auto max-w-xl border border-divider bg-surface-raised p-6 sm:p-8">
      <CornerTicks className="text-primary/20" />
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight text-text">
        {title}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-text-muted">{body}</p>
      {showForm && (
        <div className="mt-6 border-t border-divider pt-6">
          <TrackForm />
        </div>
      )}
    </div>
  )
}

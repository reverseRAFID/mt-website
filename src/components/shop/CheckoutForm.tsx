'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useCart } from '@/providers/CartProvider'
import { useHydratedCart } from '@/components/shop/CartView'
import { CartIssues } from '@/components/shop/CartIssues'
import { CornerTicks } from '@/components/ui/CornerTicks'
import {
  BD_PHONE_RE,
  CAMPUS_DELIVERY_FEE,
  EMAIL_RE,
  LIMITS,
  formatMoney,
  normalizePhone,
  type DeliveryMethod,
} from '@/lib/shop'

// Lifted from SupportForm so every form on the site is indistinguishable.
const inputCls =
  'w-full min-h-[44px] rounded-none border border-divider bg-surface px-3.5 py-2.5 text-sm text-text placeholder-text-faint transition-colors hover:border-border focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30'
const textareaCls = `${inputCls} resize-none leading-relaxed`

type FieldErrors = Partial<Record<string, string>>

/**
 * Checkout.
 *
 * Collects identity and delivery, then posts cart identities — never prices —
 * to /api/shop/order, which recomputes every figure from Sanity. The totals
 * shown here come from /api/shop/cart for the same reason: one server-computed
 * truth, displayed rather than calculated.
 */
export function CheckoutForm() {
  const router = useRouter()
  const { items, hydrated, clear } = useCart()
  const { data, loading, reload } = useHydratedCart()

  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('standard')
  const [form, setForm] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    line1: '',
    line2: '',
    area: '',
    city: '',
    postcode: '',
    handoverPoint: '',
    bracuId: '',
    customerNote: '',
    // Honeypot. Never shown, never filled by a human.
    website: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const ids = useId()
  const startedAt = useRef(Date.now())

  /**
   * Stable per checkout attempt, so a double-click or a retried request is
   * recognised as the same order rather than creating a second one. Regenerated
   * only after a rejection that changed the cart, because at that point the
   * customer is genuinely placing a different order.
   */
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID())

  const shop = data?.shop
  // Memoised because `?? []` would mint a new array every render, which would
  // change the summary's useMemo dependencies each time and defeat the memo.
  const lines = useMemo(() => data?.lines ?? [], [data])
  const subtotal = data?.subtotal ?? 0

  const campusAvailable = shop?.campusDeliveryEnabled !== false
  const handoverPoints = shop?.campusHandoverPoints ?? []

  const deliveryFee =
    deliveryMethod === 'campus' ? CAMPUS_DELIVERY_FEE : (shop?.standardDeliveryFee ?? 0)
  const total = subtotal + deliveryFee

  // If the team turns campus handover off while someone is mid-checkout, do not
  // leave them on an option the server will reject.
  useEffect(() => {
    if (!campusAvailable && deliveryMethod === 'campus') setDeliveryMethod('standard')
  }, [campusAvailable, deliveryMethod])

  const set = (field: keyof typeof form) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}

    if (!form.customerName.trim()) next.customerName = 'We need a name for the parcel.'
    else if (form.customerName.length > LIMITS.name) next.customerName = 'That is too long.'

    const email = form.customerEmail.trim().toLowerCase()
    if (!email) next.customerEmail = 'Your receipt and tracking link go here.'
    else if (!EMAIL_RE.test(email)) next.customerEmail = 'That does not look like an email address.'

    const phone = normalizePhone(form.customerPhone)
    if (!form.customerPhone.trim()) next.customerPhone = 'We call this number on delivery.'
    else if (!BD_PHONE_RE.test(phone))
      next.customerPhone = 'Enter a Bangladeshi mobile number, e.g. 01712345678.'

    if (deliveryMethod === 'standard') {
      if (!form.line1.trim()) next.line1 = 'Street address is required.'
      if (!form.area.trim()) next.area = 'Area or thana is required.'
      if (!form.city.trim()) next.city = 'City or district is required.'
    } else if (!form.handoverPoint.trim()) {
      next.handoverPoint = 'Tell us where on campus to meet you.'
    }

    if (form.customerNote.length > LIMITS.note) next.customerNote = 'That note is too long.'

    return next
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (submitting) return

    const found = validate()
    setErrors(found)
    if (Object.keys(found).length > 0) {
      // Move focus to the first problem rather than leaving the customer to
      // hunt for the red text.
      const firstKey = Object.keys(found)[0]!
      document.getElementById(`${ids}-${firstKey}`)?.focus()
      return
    }

    setSubmitting(true)
    setServerError(null)

    try {
      const res = await fetch('/api/shop/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items,
          customerName: form.customerName.trim(),
          customerEmail: form.customerEmail.trim().toLowerCase(),
          customerPhone: normalizePhone(form.customerPhone),
          deliveryMethod,
          ...(deliveryMethod === 'standard'
            ? {
                deliveryAddress: {
                  line1: form.line1.trim(),
                  line2: form.line2.trim(),
                  area: form.area.trim(),
                  city: form.city.trim(),
                  postcode: form.postcode.trim(),
                },
              }
            : {
                campusDetails: {
                  handoverPoint: form.handoverPoint.trim(),
                  bracuId: form.bracuId.trim(),
                },
              }),
          customerNote: form.customerNote.trim(),
          idempotencyKey,
          // Lets the server refuse to charge a total the customer never saw.
          expectedTotal: total,
          website: form.website,
          elapsedMs: Date.now() - startedAt.current,
        }),
      })

      const json = await res.json()

      if (res.ok && json.ok && json.trackId) {
        // Cleared only on a confirmed order. Clearing optimistically would lose
        // the cart if the request had actually failed.
        clear()
        router.push(`/shop/track/${encodeURIComponent(json.trackId)}?placed=1`)
        return
      }

      if (json.code === 'cart_changed' || json.code === 'total_changed') {
        // The order is genuinely different now, so the previous key must not be
        // reused — it would replay the comparison against the old attempt.
        setIdempotencyKey(crypto.randomUUID())
        await reload()
      }

      setServerError(json.error || 'We could not place your order. Please try again.')
    } catch {
      setServerError('Could not reach the shop. Check your connection and try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const summary = useMemo(
    () => (
      <aside className="border border-divider bg-surface-raised p-5 lg:sticky lg:top-24">
        <CornerTicks className="text-primary/20" />
        <h2 className="hud-label mb-4 text-text-muted">Your order</h2>

        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <li key={`${line.productId}-${line.variantKey}`} className="flex gap-3">
              <div className="relative h-12 w-12 shrink-0 overflow-hidden border border-divider bg-surface">
                {line.imageUrl && (
                  <Image src={line.imageUrl} alt="" fill sizes="48px" className="object-cover" />
                )}
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center bg-text px-1 text-[10px] font-bold text-bg nums">
                  {line.quantity}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text">{line.productTitle}</p>
                <p className="text-xs text-text-faint">{line.variantLabel}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold text-text nums">
                {formatMoney(line.lineTotal)}
              </span>
            </li>
          ))}
        </ul>

        <dl className="mt-4 flex flex-col gap-2 border-t border-divider pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-text-muted">Subtotal</dt>
            <dd className="font-semibold text-text nums">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-text-muted">
              {deliveryMethod === 'campus' ? 'Campus handover' : 'Home delivery'}
            </dt>
            <dd className="font-semibold text-text nums">
              {deliveryFee === 0 ? 'Free' : formatMoney(deliveryFee)}
            </dd>
          </div>
          <div className="mt-1 flex justify-between border-t border-divider pt-3">
            <dt className="font-display text-base font-bold uppercase text-text">Total</dt>
            <dd className="font-display text-base font-bold text-text nums">
              {formatMoney(total)}
            </dd>
          </div>
        </dl>

        <div className="mt-4 border border-primary/40 bg-primary-highlight px-3 py-2.5">
          <p className="hud-label text-primary">Cash on delivery</p>
          <p className="mt-1 text-xs leading-relaxed text-text">
            Have <span className="font-semibold nums">{formatMoney(total)}</span> ready when your
            order arrives. Nothing is charged now.
          </p>
        </div>

        {shop?.estimatedDeliveryDays && (
          <p className="mt-3 text-xs text-text-faint">
            Estimated delivery: {shop.estimatedDeliveryDays}
          </p>
        )}
      </aside>
    ),
    [lines, subtotal, deliveryFee, total, deliveryMethod, shop?.estimatedDeliveryDays]
  )

  if (!hydrated || (loading && !data)) {
    return <div className="h-64 animate-pulse border border-divider bg-surface-raised" />
  }

  if (lines.length === 0) {
    return (
      <div className="border border-divider bg-surface-raised px-6 py-16 text-center">
        <p className="hud-label text-text-faint">Nothing to check out</p>
        <p className="mt-3 text-text-muted">Your cart is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded-none bg-primary px-6 py-3 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover"
        >
          Browse the store
        </Link>
      </div>
    )
  }

  if (shop?.status !== 'open') {
    return (
      <div className="border border-divider bg-surface-raised px-6 py-12 text-center">
        <p className="hud-label text-text-faint">Checkout closed</p>
        <p className="mx-auto mt-3 max-w-lg text-text-muted">
          {shop?.closedMessage || 'The shop is not taking orders right now.'}
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
      <div className="flex flex-col gap-6">
        {data && data.issues.length > 0 && <CartIssues issues={data.issues} />}

        {/* ── Contact ── */}
        <fieldset className="border border-divider bg-surface-raised p-5">
          <legend className="hud-label px-2 text-text-muted">Your details</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <Field id={`${ids}-customerName`} label="Full name" required error={errors.customerName} className="sm:col-span-2">
              <input
                id={`${ids}-customerName`}
                className={inputCls}
                value={form.customerName}
                onChange={(e) => set('customerName')(e.target.value)}
                maxLength={LIMITS.name}
                autoComplete="name"
                aria-invalid={Boolean(errors.customerName)}
              />
            </Field>

            <Field id={`${ids}-customerEmail`} label="Email" required hint="receipt + tracking" error={errors.customerEmail}>
              <input
                id={`${ids}-customerEmail`}
                type="email"
                className={inputCls}
                value={form.customerEmail}
                onChange={(e) => set('customerEmail')(e.target.value)}
                maxLength={LIMITS.email}
                autoComplete="email"
                aria-invalid={Boolean(errors.customerEmail)}
              />
            </Field>

            <Field id={`${ids}-customerPhone`} label="Mobile" required error={errors.customerPhone}>
              <input
                id={`${ids}-customerPhone`}
                type="tel"
                inputMode="tel"
                placeholder="01712345678"
                className={inputCls}
                value={form.customerPhone}
                onChange={(e) => set('customerPhone')(e.target.value)}
                maxLength={LIMITS.phone}
                autoComplete="tel"
                aria-invalid={Boolean(errors.customerPhone)}
              />
            </Field>
          </div>
        </fieldset>

        {/* ── Delivery ── */}
        <fieldset className="border border-divider bg-surface-raised p-5">
          <legend className="hud-label px-2 text-text-muted">Delivery</legend>

          <div role="radiogroup" aria-label="Delivery method" className="mt-2 grid gap-3 sm:grid-cols-2">
            <MethodOption
              checked={deliveryMethod === 'standard'}
              onSelect={() => setDeliveryMethod('standard')}
              title="Home delivery"
              price={formatMoney(shop?.standardDeliveryFee ?? 0)}
              description="By courier, anywhere in Bangladesh."
            />
            {campusAvailable && (
              <MethodOption
                checked={deliveryMethod === 'campus'}
                onSelect={() => setDeliveryMethod('campus')}
                title="Pick up at BRACU"
                price="Free"
                description="We hand it over on campus."
              />
            )}
          </div>

          {deliveryMethod === 'standard' ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id={`${ids}-line1`} label="Address" required error={errors.line1} className="sm:col-span-2">
                <input
                  id={`${ids}-line1`}
                  className={inputCls}
                  placeholder="House / road"
                  value={form.line1}
                  onChange={(e) => set('line1')(e.target.value)}
                  maxLength={LIMITS.addressLine}
                  autoComplete="address-line1"
                  aria-invalid={Boolean(errors.line1)}
                />
              </Field>
              <Field id={`${ids}-line2`} label="Apartment, floor" className="sm:col-span-2">
                <input
                  id={`${ids}-line2`}
                  className={inputCls}
                  value={form.line2}
                  onChange={(e) => set('line2')(e.target.value)}
                  maxLength={LIMITS.addressLine}
                  autoComplete="address-line2"
                />
              </Field>
              <Field id={`${ids}-area`} label="Area / thana" required error={errors.area}>
                <input
                  id={`${ids}-area`}
                  className={inputCls}
                  placeholder="e.g. Mirpur"
                  value={form.area}
                  onChange={(e) => set('area')(e.target.value)}
                  maxLength={LIMITS.area}
                  aria-invalid={Boolean(errors.area)}
                />
              </Field>
              <Field id={`${ids}-city`} label="City / district" required error={errors.city}>
                <input
                  id={`${ids}-city`}
                  className={inputCls}
                  placeholder="e.g. Dhaka"
                  value={form.city}
                  onChange={(e) => set('city')(e.target.value)}
                  maxLength={LIMITS.city}
                  autoComplete="address-level2"
                  aria-invalid={Boolean(errors.city)}
                />
              </Field>
              <Field id={`${ids}-postcode`} label="Postcode">
                <input
                  id={`${ids}-postcode`}
                  className={inputCls}
                  value={form.postcode}
                  onChange={(e) => set('postcode')(e.target.value)}
                  maxLength={LIMITS.postcode}
                  autoComplete="postal-code"
                />
              </Field>
            </div>
          ) : (
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Field id={`${ids}-handoverPoint`} label="Where on campus" required error={errors.handoverPoint} className="sm:col-span-2">
                {handoverPoints.length > 0 ? (
                  <select
                    id={`${ids}-handoverPoint`}
                    className={`${inputCls} cursor-pointer`}
                    value={form.handoverPoint}
                    onChange={(e) => set('handoverPoint')(e.target.value)}
                    aria-invalid={Boolean(errors.handoverPoint)}
                  >
                    <option value="">Choose a spot…</option>
                    {handoverPoints.map((point) => (
                      <option key={point} value={point}>
                        {point}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    id={`${ids}-handoverPoint`}
                    className={inputCls}
                    placeholder="e.g. UB Ground Floor"
                    value={form.handoverPoint}
                    onChange={(e) => set('handoverPoint')(e.target.value)}
                    maxLength={LIMITS.handoverPoint}
                    aria-invalid={Boolean(errors.handoverPoint)}
                  />
                )}
              </Field>
              <Field id={`${ids}-bracuId`} label="BRACU ID" hint="optional — speeds up handover" className="sm:col-span-2">
                <input
                  id={`${ids}-bracuId`}
                  className={inputCls}
                  value={form.bracuId}
                  onChange={(e) => set('bracuId')(e.target.value)}
                  maxLength={LIMITS.bracuId}
                />
              </Field>
            </div>
          )}

          <div className="mt-4">
            <Field id={`${ids}-customerNote`} label="Note for the team" hint="landmarks, timing, anything" error={errors.customerNote}>
              <textarea
                id={`${ids}-customerNote`}
                rows={3}
                className={textareaCls}
                value={form.customerNote}
                onChange={(e) => set('customerNote')(e.target.value)}
                maxLength={LIMITS.note}
              />
            </Field>
          </div>
        </fieldset>

        {/* Honeypot — off-screen rather than display:none, which some bots skip. */}
        <div aria-hidden className="absolute left-[-9999px] top-0 h-0 w-0 overflow-hidden">
          <label htmlFor={`${ids}-website`}>Website</label>
          <input
            id={`${ids}-website`}
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => set('website')(e.target.value)}
          />
        </div>

        {serverError && (
          <p role="alert" className="border border-primary/50 bg-primary-highlight px-4 py-3 text-sm font-semibold text-primary">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-none bg-primary px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:bg-surface-offset disabled:text-text-faint"
        >
          {submitting ? 'Placing your order…' : `Place order · ${formatMoney(total)}`}
        </button>

        <p className="text-xs leading-relaxed text-text-faint">
          By placing this order you agree to pay {formatMoney(total)} in cash on delivery. We will
          email you a receipt and a tracking link.
        </p>
      </div>

      {summary}
    </form>
  )
}

function Field({
  id,
  label,
  required,
  hint,
  error,
  className = '',
  children,
}: {
  id: string
  label: string
  required?: boolean
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="hud-label text-text-muted">
        {label}
        {required && (
          <span className="ml-1 text-primary" aria-hidden>
            *
          </span>
        )}
        {hint && (
          <span className="ml-2 font-normal normal-case tracking-normal text-text-faint">
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-xs font-semibold text-primary">
          {error}
        </span>
      )}
    </div>
  )
}

function MethodOption({
  checked,
  onSelect,
  title,
  price,
  description,
}: {
  checked: boolean
  onSelect: () => void
  title: string
  price: string
  description: string
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      onClick={onSelect}
      className={`flex flex-col items-start gap-1 rounded-none border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
        checked
          ? 'border-primary bg-primary-highlight'
          : 'border-divider bg-surface hover:border-border'
      }`}
    >
      <span className="flex w-full items-center justify-between gap-2">
        <span className="font-display text-sm font-bold uppercase tracking-tight text-text">
          {title}
        </span>
        <span className={`text-sm font-semibold nums ${checked ? 'text-primary' : 'text-text-muted'}`}>
          {price}
        </span>
      </span>
      <span className="text-xs leading-relaxed text-text-muted">{description}</span>
    </button>
  )
}

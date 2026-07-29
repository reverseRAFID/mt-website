// ============================================================
// Order email templates — SERVER ONLY.
//
// Hand-written table-based HTML with inline styles. That is not nostalgia:
// Gmail strips <style> blocks, Outlook renders through Word's engine, and
// neither supports flexbox or grid. The site's Tailwind design system cannot
// come along, so the palette is restated here as literal hex values.
//
// ── ESCAPING ──────────────────────────────────────────────────
// `h()` is escapeHtml. EVERY interpolated value goes through it. Customer
// names, delivery notes and cancellation reasons are all attacker-supplied
// free text landing inside markup. The only exceptions are values this module
// computed itself — numbers it formatted, and its own literal copy.
// ============================================================

import {
  DELIVERY_METHOD_LABELS,
  formatMoney,
  timelineLabel,
  type OrderStatus,
} from '@/lib/shop'
import type { OrderInternal } from '@/lib/orders'
import type { ShopConfigInternal } from '@/lib/cms/shop'
import { escapeHtml as h, type MailMessage } from './client'

// ── Palette ───────────────────────────────────────────────────
// Mirrors globals.css light mode. Restated because email cannot use CSS vars.
const INK = '#0a0a0a'
const MUTED = '#4a4a4a'
const FAINT = '#767676'
const RULE = '#d4d4d4'
const ACCENT = '#f05a00'
const PAPER = '#ffffff'
const WASH = '#f7f7f7'

const FONT =
  "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://bracumongoltori.com').replace(/\/$/, '')
}

export function trackUrl(trackId: string): string {
  return `${siteUrl()}/shop/track/${encodeURIComponent(trackId)}`
}

/**
 * Wrap body markup in the shared shell.
 *
 * `preheader` is the grey line a mail client shows next to the subject in the
 * inbox list. Left unset, clients grab the first text they find — usually the
 * wordmark, which tells the reader nothing.
 */
function layout(options: { preheader: string; heading: string; body: string }): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${h(options.heading)}</title>
</head>
<body style="margin:0;padding:0;background:${WASH};font-family:${FONT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${h(options.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${WASH};padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:${PAPER};border:1px solid ${RULE};">
      <tr>
        <td style="padding:24px 28px;border-bottom:3px solid ${ACCENT};">
          <div style="font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${INK};">
            BRACU Mongol&#8209;Tori
          </div>
          <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};padding-top:4px;">
            Merch Store
          </div>
        </td>
      </tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 16px;font-size:22px;line-height:1.25;font-weight:700;color:${INK};">
          ${h(options.heading)}
        </h1>
        ${options.body}
      </td></tr>
      <tr>
        <td style="padding:20px 28px;background:${WASH};border-top:1px solid ${RULE};font-size:12px;line-height:1.6;color:${FAINT};">
          BRACU Mongol&#8209;Tori · BRAC University, Dhaka<br>
          You are receiving this because you placed an order on our store.
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${MUTED};">${text}</p>`
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr><td style="background:${ACCENT};">
      <a href="${h(href)}" style="display:inline-block;padding:13px 26px;font-size:14px;font-weight:700;letter-spacing:0.5px;color:#ffffff;text-decoration:none;">${h(label)}</a>
    </td></tr>
  </table>`
}

/** The track ID, set as the reference the customer quotes back to us. */
function trackIdBlock(trackId: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border:1px solid ${RULE};background:${WASH};">
    <tr><td style="padding:14px 18px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${FAINT};">Tracking reference</div>
      <div style="font-size:22px;font-weight:700;letter-spacing:2px;color:${INK};padding-top:4px;">${h(trackId)}</div>
    </td></tr>
  </table>`
}

function itemsTable(order: OrderInternal): string {
  const rows = (order.items ?? [])
    .map(
      (item) => `<tr>
      <td style="padding:10px 0;border-bottom:1px solid ${RULE};font-size:14px;color:${INK};">
        ${h(item.productTitle)}
        ${item.variantLabel ? `<div style="font-size:12px;color:${FAINT};padding-top:2px;">${h(item.variantLabel)}${item.sku ? ` · ${h(item.sku)}` : ''}</div>` : ''}
      </td>
      <td align="center" style="padding:10px 8px;border-bottom:1px solid ${RULE};font-size:14px;color:${MUTED};white-space:nowrap;">
        ${h(item.quantity ?? 0)} &times; ${h(formatMoney(item.unitPrice ?? 0))}
      </td>
      <td align="right" style="padding:10px 0;border-bottom:1px solid ${RULE};font-size:14px;font-weight:600;color:${INK};white-space:nowrap;">
        ${h(formatMoney(item.lineTotal ?? 0))}
      </td>
    </tr>`
    )
    .join('')

  const totalRow = (label: string, value: string, strong = false) =>
    `<tr>
      <td colspan="2" style="padding:${strong ? '12px 0 0' : '8px 0 0'};font-size:${strong ? '16px' : '14px'};${strong ? 'font-weight:700;' : ''}color:${strong ? INK : MUTED};">${h(label)}</td>
      <td align="right" style="padding:${strong ? '12px 0 0' : '8px 0 0'};font-size:${strong ? '16px' : '14px'};font-weight:${strong ? '700' : '600'};color:${strong ? INK : MUTED};white-space:nowrap;">${h(value)}</td>
    </tr>`

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 8px;">
    ${rows}
    ${totalRow('Subtotal', formatMoney(order.subtotal))}
    ${totalRow(
      order.deliveryMethod === 'campus' ? 'Campus handover' : 'Delivery',
      order.deliveryFee === 0 ? 'Free' : formatMoney(order.deliveryFee)
    )}
    ${totalRow('Total', formatMoney(order.total), true)}
  </table>`
}

function deliveryBlock(order: OrderInternal): string {
  const lines =
    order.deliveryMethod === 'campus'
      ? [
          DELIVERY_METHOD_LABELS.campus,
          order.campusDetails?.handoverPoint,
          order.campusDetails?.bracuId ? `BRACU ID: ${order.campusDetails.bracuId}` : null,
        ]
      : [
          DELIVERY_METHOD_LABELS.standard,
          order.deliveryAddress?.line1,
          order.deliveryAddress?.line2,
          [order.deliveryAddress?.area, order.deliveryAddress?.city].filter(Boolean).join(', '),
          order.deliveryAddress?.postcode,
        ]

  const body = lines
    .filter((line): line is string => Boolean(line && String(line).trim()))
    .map((line) => h(line))
    .join('<br>')

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border-top:1px solid ${RULE};">
    <tr><td style="padding:16px 0 0;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${FAINT};padding-bottom:6px;">Delivering to</div>
      <div style="font-size:14px;line-height:1.6;color:${INK};">${h(order.customerName)}<br>${body}<br>${h(order.customerPhone)}</div>
    </td></tr>
  </table>`
}

function supportLine(config: ShopConfigInternal): string {
  const bits = [
    config.supportEmail ? `email ${config.supportEmail}` : null,
    config.supportPhone ? `call ${config.supportPhone}` : null,
  ].filter(Boolean)
  if (bits.length === 0) return ''
  return paragraph(
    `Something not right? Quote your tracking reference and ${h(bits.join(' or '))}.`
  )
}

/** Plain-text alternative. Some clients show it, and spam filters like seeing it. */
function textVersion(order: OrderInternal, heading: string, intro: string): string {
  const items = (order.items ?? [])
    .map(
      (item) =>
        `  ${item.quantity ?? 0} x ${item.productTitle}${item.variantLabel ? ` (${item.variantLabel})` : ''} — ${formatMoney(item.lineTotal ?? 0)}`
    )
    .join('\n')

  const address =
    order.deliveryMethod === 'campus'
      ? `Campus handover${order.campusDetails?.handoverPoint ? ` — ${order.campusDetails.handoverPoint}` : ''}`
      : [
          order.deliveryAddress?.line1,
          order.deliveryAddress?.line2,
          [order.deliveryAddress?.area, order.deliveryAddress?.city].filter(Boolean).join(', '),
          order.deliveryAddress?.postcode,
        ]
          .filter(Boolean)
          .join(', ')

  return [
    heading,
    '',
    intro,
    '',
    `Tracking reference: ${order.trackId}`,
    `Track it: ${trackUrl(order.trackId)}`,
    '',
    'ITEMS',
    items,
    '',
    `Subtotal: ${formatMoney(order.subtotal)}`,
    `Delivery: ${order.deliveryFee === 0 ? 'Free' : formatMoney(order.deliveryFee)}`,
    `Total: ${formatMoney(order.total)}`,
    '',
    `Deliver to: ${order.customerName}, ${address}, ${order.customerPhone}`,
    '',
    'BRACU Mongol-Tori — BRAC University, Dhaka',
  ].join('\n')
}

// ── 1. Order confirmation / invoice ───────────────────────────

export function orderConfirmationEmail(
  order: OrderInternal,
  config: ShopConfigInternal
): MailMessage {
  const heading = 'Order confirmed'
  const intro = `Thanks ${order.customerName.split(' ')[0] ?? 'there'} — we have your order and will start getting it ready.`

  // COD is the only payment method, so the single most useful thing this email
  // can do is tell the customer exactly what cash to have ready at the door.
  const dueBlock = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;border:2px solid ${ACCENT};">
    <tr><td style="padding:14px 18px;">
      <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${ACCENT};">Cash on delivery</div>
      <div style="font-size:20px;font-weight:700;color:${INK};padding-top:4px;">Have ${h(formatMoney(order.total))} ready</div>
      <div style="font-size:13px;color:${MUTED};padding-top:4px;">Pay when your order arrives. Nothing to pay now.</div>
    </td></tr>
  </table>`

  const body = [
    paragraph(h(intro)),
    trackIdBlock(order.trackId),
    itemsTable(order),
    dueBlock,
    deliveryBlock(order),
    config.estimatedDeliveryDays
      ? paragraph(`Estimated delivery: <strong>${h(config.estimatedDeliveryDays)}</strong>.`)
      : '',
    order.customerNote
      ? paragraph(`Your note: &ldquo;${h(order.customerNote)}&rdquo;`)
      : '',
    button(trackUrl(order.trackId), 'Track this order'),
    supportLine(config),
  ].join('')

  return {
    to: order.customerEmail,
    subject: `Order ${order.trackId} confirmed — ${formatMoney(order.total)}`,
    html: layout({ preheader: `${intro} Total ${formatMoney(order.total)}.`, heading, body }),
    text: `${textVersion(order, heading, intro)}\n\nPay ${formatMoney(order.total)} in cash on delivery.`,
    replyTo: config.supportEmail,
  }
}

// ── 2. Status update ──────────────────────────────────────────

interface StatusCopy {
  subject: string
  heading: string
  intro: string
}

/**
 * Copy per status.
 *
 * `placed` is absent on purpose — the confirmation email above is that
 * notification, and duplicating it would mean two emails for one event.
 */
function statusCopy(order: OrderInternal, config: ShopConfigInternal): StatusCopy | null {
  const first = order.customerName.split(' ')[0] ?? 'there'

  switch (order.status) {
    case 'confirmed':
      return {
        subject: `Order ${order.trackId} confirmed`,
        heading: 'Your order is confirmed',
        intro: `Thanks ${first} — we have checked your order and it is going into the queue.`,
      }
    case 'processing':
      return {
        subject: `Order ${order.trackId} is being packed`,
        heading: 'We are packing your order',
        intro: `Your items are being picked and packed${config.estimatedDeliveryDays ? `, and should reach you within ${config.estimatedDeliveryDays}` : ''}.`,
      }
    case 'dispatched':
      return order.deliveryMethod === 'campus'
        ? {
            subject: `Order ${order.trackId} is ready to collect`,
            heading: 'Ready for pickup',
            intro: `Your order is packed and waiting${order.campusDetails?.handoverPoint ? ` at ${order.campusDetails.handoverPoint}` : ' on campus'}. Bring your tracking reference and ${formatMoney(order.total)} in cash.`,
          }
        : {
            subject: `Order ${order.trackId} is on its way`,
            heading: 'Your order is out for delivery',
            intro: `It is with the courier now. Please have ${formatMoney(order.total)} in cash ready, and keep your phone reachable.`,
          }
    case 'delivered':
      return {
        subject: `Order ${order.trackId} delivered`,
        heading: order.deliveryMethod === 'campus' ? 'Collected — thank you' : 'Delivered — thank you',
        intro: `That is your order complete, ${first}. Thank you for backing the team — wear it well.`,
      }
    case 'cancelled':
      return {
        subject: `Order ${order.trackId} cancelled`,
        heading: 'Your order has been cancelled',
        intro: order.cancellationReason
          ? `We have cancelled this order. Reason: ${order.cancellationReason}`
          : 'We have cancelled this order. Nothing has been charged — it was cash on delivery.',
      }
    default:
      return null
  }
}

/** Returns null when a status has no customer-facing email. */
export function orderStatusEmail(
  order: OrderInternal,
  config: ShopConfigInternal
): MailMessage | null {
  const copy = statusCopy(order, config)
  if (!copy) return null

  const showItems = order.status !== 'cancelled'

  const body = [
    paragraph(h(copy.intro)),
    trackIdBlock(order.trackId),
    showItems ? itemsTable(order) : '',
    showItems ? deliveryBlock(order) : '',
    order.status === 'delivered'
      ? ''
      : button(trackUrl(order.trackId), 'Track this order'),
    supportLine(config),
  ].join('')

  return {
    to: order.customerEmail,
    subject: copy.subject,
    html: layout({ preheader: copy.intro, heading: copy.heading, body }),
    text: textVersion(order, copy.heading, copy.intro),
    replyTo: config.supportEmail,
  }
}

// ── 3. Admin alert ────────────────────────────────────────────

/**
 * Tell the team an order came in.
 *
 * Deep-links to the Studio document, because the next action is always the
 * same: open it and confirm. Carries full PII — it goes only to
 * `adminNotifyEmails`, never to a customer.
 */
export function adminNewOrderEmail(
  order: OrderInternal,
  config: ShopConfigInternal
): MailMessage | null {
  const recipients = config.adminNotifyEmails ?? []
  if (recipients.length === 0) return null

  const adminUrl = `${siteUrl()}/admin/collections/orders/${encodeURIComponent(String(order.id))}`
  const summary = (order.items ?? [])
    .map((item) => `${item.quantity} × ${item.productTitle} (${item.variantLabel})`)
    .join(', ')

  const body = [
    paragraph(
      `<strong>${h(order.customerName)}</strong> just ordered ${h(formatMoney(order.total))}, ${h(order.deliveryMethod === 'campus' ? 'for campus handover' : 'for home delivery')}.`
    ),
    trackIdBlock(order.trackId),
    itemsTable(order),
    deliveryBlock(order),
    paragraph(`Contact: ${h(order.customerEmail)} · ${h(order.customerPhone)}`),
    order.customerNote ? paragraph(`Note: &ldquo;${h(order.customerNote)}&rdquo;`) : '',
    button(adminUrl, 'Open in Studio'),
  ].join('')

  return {
    to: recipients,
    subject: `🆕 ${order.trackId} — ${formatMoney(order.total)} — ${order.customerName}`,
    html: layout({
      preheader: `${summary} · ${formatMoney(order.total)}`,
      heading: 'New order',
      body,
    }),
    text: [
      'NEW ORDER',
      '',
      `${order.trackId} — ${formatMoney(order.total)}`,
      `${order.customerName} · ${order.customerEmail} · ${order.customerPhone}`,
      `${order.deliveryMethod === 'campus' ? 'Campus handover' : 'Home delivery'}`,
      '',
      summary,
      '',
      `Open: ${adminUrl}`,
    ].join('\n'),
  }
}

/** Exported for the status-email dedupe in the webhook. */
export function hasCustomerEmail(status: OrderStatus): boolean {
  return status !== 'placed'
}

/** Human label for logs and the Studio. */
export function statusHeadline(status: OrderStatus, method: OrderInternal['deliveryMethod']): string {
  return timelineLabel(status, method)
}

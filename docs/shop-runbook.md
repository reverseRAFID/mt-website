# Merch Shop Runbook

Everything the team needs to run the store, and everything the next developer
needs to not break it.

---

## 0. Before the first real order — launch checklist

| # | Item | Who | Status |
|---|---|---|---|
| 1 | **Dataset is Private** — `npm run check:privacy` passes | Sanity account owner | ⛔ **BLOCKER** |
| 2 | `RESEND_API_KEY` set + sender domain verified | Team | Orders work without it; no emails go out |
| 3 | `SANITY_WEBHOOK_SECRET` set in Vercel **and** sanity.io/manage | Team | No status emails / no stock restore without it |
| 4 | Every product has at least one image | Team | Schema requires it |
| 5 | Delivery fee checked in Shop Settings | Team | Seeded at ৳120 |
| 6 | `adminNotifyEmails` filled in | Team | No new-order alerts otherwise |
| 7 | Shop status set to **🟢 Open** | Team | Seeds closed on purpose |

### 1 is a blocker, and here is why

Order documents hold a **real name, email address, mobile number and home
address**, tied to a purchase. On a public dataset, anyone can read all of it
with one request — the GROQ projections in this repo are irrelevant, because an
attacker writes their own query:

```bash
curl 'https://aslda7ok.api.sanity.io/v2024-01-01/data/query/production?query=*[_type=="order"]'
```

**Fix:** sanity.io/manage → project `aslda7ok` → Datasets → `production` →
Visibility → **Private**. Then confirm `SANITY_API_TOKEN` is set in Vercel for
**both** Production and Preview, or a private dataset means a blank site.

Verify with `npm run check:privacy`. See `docs/privacy-runbook.md` §1 for what
does *not* break when it goes private (images, server reads, the Studio).

---

## 1. Handling an order

New orders land in **Studio → Shop → New Orders**, oldest first.

1. **Check it.** Does the address look real? Is the phone number reachable? Is
   the stock physically there?
2. **Confirm** → status **✅ Confirmed**. The customer is emailed automatically.
3. **Pack** → **📦 Packing** (optional; skip it if you dispatch same-day).
4. **Send** → **🚚 Dispatched**. The customer is told it is on its way — or, for
   a campus order, that it is ready to collect.
5. **Hand over** → **🎉 Delivered**, and set **Payment** to **✅ Paid** once the
   cash is actually in hand.

Everything except the fulfilment fields is read-only on purpose: rewriting what
a customer submitted destroys the record the parcel and invoice were built from.

### Cancelling

Set status to **⛔ Cancelled** and write a **Cancellation Reason** — the customer
receives it verbatim in the cancellation email, so write it for them to read.
Use **Internal Notes** for anything they should not see.

Cancelling **automatically returns the stock**. It happens once and only once,
even if the document is saved repeatedly.

> **Cancelled is final.** The status field locks afterwards. The stock has gone
> back on the shelf and may since have sold to somebody else, so re-opening the
> order could silently oversell. If the customer changes their mind again, place
> a new order.

### The customer emailed and wants to change their address

Order fields are read-only. Note the new address in **Internal Notes** and ship
to that instead — or cancel and have them re-order, which is cleaner if anything
about the items is changing too.

---

## 2. Stock

Stock lives on each **variant**, never on the product. A product with no real
options still has one variant called `Standard` — that is what holds its count.

- **Ordering decrements it automatically.** Cancelling puts it back.
- Only edit stock by hand to reflect a **real physical recount**.
- **Studio → Shop → Low Stock** lists anything at or below its own alert
  threshold.
- To stop selling something without losing its count, turn off
  **Available** on the variant, or **Listed in the shop** on the product.
- **Made-to-order items:** turn off **Track stock**. They never run out, and
  cancelling one returns nothing.

### Can we oversell?

No. Placing an order runs one atomic Sanity transaction containing every stock
decrement and the order document, each decrement guarded by a compare-and-set on
the product's revision. If two customers race for the last unit, one commits and
the other is told it sold out. Verified with ten concurrent orders against a
stock of one: exactly one succeeded and stock never went negative.

---

## 3. Email

Three emails, all through Resend:

| Trigger | Goes to | Contains |
|---|---|---|
| Order placed | Customer | Full invoice, cash due on delivery, track link |
| Status change | Customer | What changed; wording differs for campus vs home |
| Order placed | `adminNotifyEmails` | Everything + a deep link into the Studio |

**Each status is emailed at most once**, however many times you save the
document. Moving a status backwards to fix a misclick will not re-send.

### A confirmation email failed

Check **Studio → Shop → Email Problems**. On the order, tick **Re-send the
confirmation email** and save. It sends and unticks itself.

`Skipped` means `RESEND_API_KEY` was not configured when the order came in. The
order is completely fine — the customer just never got their receipt.

### Setting up the webhook (one-time)

Status emails and cancellation stock-restores are driven by a Sanity webhook.
Without it, **changing a status silently does nothing**.

1. sanity.io/manage → project → **API** → **Webhooks** → **Create webhook**
2. Fill in:
   - **Name** — `Shop orders`
   - **URL** — `https://bracumongoltori.com/api/shop/webhook`
   - **Dataset** — `production`
   - **Trigger on** — ✅ Create, ✅ Update  (leave Delete off)
   - **Filter** — `_type == "order"`
   - **Projection** — leave empty (the route re-reads the order itself)
   - **HTTP method** — `POST`
   - **API version** — `v2024-01-01`
   - **Include drafts** — off
   - **Secret** — paste the same value as `SANITY_WEBHOOK_SECRET` in Vercel
3. Save, then change any test order's status and check the webhook's delivery
   log for a `200`.

The route **fails closed**: with no secret set it rejects every request, because
an unauthenticated caller could otherwise trigger emails to customers and move
stock.

---

## 4. Shop settings

**Studio → Shop → Shop Settings** (one document, always).

| Setting | Notes |
|---|---|
| **Status** | 🟢 Open / 🟡 Paused (browsable, no checkout) / 🔴 Closed. Enforced server-side. |
| **Home Delivery Fee** | Flat, whole taka. Seeded at ৳120. |
| **Campus handover** | Always free — there is no fee field, by design. |
| **Restrict campus to BRACU email** | **Off.** Turn on only if free handover gets abused; it also locks out alumni and guests. |
| **Max Quantity per Item** | Stops one person clearing out a size. |
| **Track ID Prefix** | Changing it does not rewrite IDs already issued — old ones keep working. |
| **Notify These Addresses** | Never published. Empty = no new-order alerts. |

---

## 5. What is never published

The track page is reachable by anyone holding the ID, so it shows enough for the
buyer to recognise their own order and nothing more.

| Field | On the track page |
|---|---|
| `customerName` | ✅ Shown — they need to recognise the order |
| `customerPhone` | Masked to the last 3 digits |
| `deliveryAddress` | Reduced to area + city; street line and postcode never leave |
| `customerEmail` | ❌ Never |
| `campusDetails.bracuId` | ❌ Never |
| `adminNotes` | ❌ Never |
| `idempotencyKey` | ❌ Never |
| `cancellationReason` | ✅ Shown — written for the customer. Use Internal Notes otherwise. |

Enforced by `getOrderByTrackId()` → `toPublicOrder()` in `src/lib/orders.ts`,
which builds its result field by field rather than spreading the order — so a
field added to the schema in future stays private until someone deliberately
publishes it.

`npm run check:privacy` fails the build if an order query loses its
`_INTERNAL_QUERY` suffix, if a client component imports the server layer, if
`PublicOrder` grows a private field, or if the masking helpers stop masking.

---

## 6. Retention

Nothing expires automatically. At least once per term:

- Delete **cancelled** orders once they are resolved.
- On **delivered** orders older than the return window, consider clearing
  `customerPhone`, `customerEmail` and `deliveryAddress`. The line items and
  totals are enough for the treasury record.
- The same applies to `application` and `donation` documents — see
  `docs/privacy-runbook.md` §5.

---

## 7. Developer notes

| Concern | Where |
|---|---|
| Domain constants, statuses, money, track IDs | `src/lib/shop.ts` (isomorphic — no Node built-ins, no secrets) |
| Cart operations | `src/lib/cart.ts` (pure; never stores a price) |
| Pricing, reservation, restore, masked lookup | `src/lib/orders.ts` (server only) |
| Catalogue reads | `src/lib/shop-server.ts` (server only) |
| Email | `src/lib/email/` (server only; `safeSend` never throws) |
| Schemas | `src/sanity/schemas/{product,productCategory,shopConfig,order}.ts` |

**The pricing rule.** The browser never sends a price. It sends
`{productId, variantKey, quantity}` and nothing else that costs money. Every
figure on an invoice is recomputed server-side from Sanity at request time. If
you find yourself trusting a number from the client, stop.

**Seeding a demo catalogue:**

```bash
node scripts/seed-shop.mjs          # 4 categories, 6 products, config (shop stays CLOSED)
node scripts/seed-shop.mjs --open   # …and open the shop
node scripts/seed-shop.mjs --clean  # remove every seed-shop-* document
```

**End-to-end test** (needs a dev server and a write-capable token):

```bash
npm run dev
node scripts/test-shop-flow.mjs
```

It exercises overselling under concurrency, price tampering, campus fee forcing,
idempotent replay, cancellation restore, and track-page masking — then cleans up
after itself.

**Never run `npm run build` while `next dev` is running.** They share `.next`
and the build output gets corrupted, which shows up as a site served with empty
CSS. Stop dev and wipe `.next` first.

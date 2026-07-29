# Architecture

How the BRACU Mongol-Tori site is put together: the stack, where things live, how data flows, and how pages are rendered.

---

## 1. Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | React Server Components by default |
| UI runtime | **React 19** | |
| CMS | **Payload 3** | Admin at `/admin`, in this app. Content read through the Local API — no network hop. |
| Database | **MongoDB** (replica set) | Everything: content, media metadata, orders, donations, applications, CMS users |
| Styling | **Tailwind CSS v4** | Via `@tailwindcss/postcss`; no `tailwind.config.ts` (v4 is CSS-first, configured in `globals.css`) |
| Theming | **next-themes** | Light/dark, system default |
| File storage | **Vercel Blob** in production, local disk in dev | Enabled by the presence of a token |
| Hosting | **Vercel** | See [DEPLOYMENT.md](DEPLOYMENT.md) |
| Language | **TypeScript** | Strict; CI runs `tsc --noEmit` |

---

## 2. Directory Layout

```
payload.config.ts                # CMS root config: collections, globals, db, admin
next.config.mjs                  # Image remote patterns; wraps the config in withPayload
docker-compose.yml               # Local MongoDB (single-node replica set)

src/
├─ app/
│  ├─ (frontend)/                # The website. Route groups do not appear in URLs.
│  │  ├─ layout.tsx              # Root layout — fonts, ThemeProvider, Navbar, Footer
│  │  ├─ page.tsx                # Home (/)
│  │  ├─ globals.css             # Tailwind v4 entry + design tokens
│  │  ├─ rovers|team|news|…      # Listings + [slug] details
│  │  └─ api/                    # apply, donate, shop/cart, shop/order
│  └─ (payload)/                 # The admin. A SECOND root layout — Payload
│     ├─ admin/[[...segments]]/  # renders its own <html>, so it cannot live
│     └─ payload-api/[...slug]/  # inside the site's layout tree.
│
├─ payload/
│  ├─ collections/               # One file per collection; each declares `access`
│  ├─ globals/                   # Recruitment, Crowdfunding, Shop
│  ├─ fields/                    # slug, richText editors, subteam options
│  ├─ access/                    # Named predicates: anyone, staff, adminOnly, nobody
│  └─ hooks/                     # revalidate (cache busting), orderEffects
│
├─ lib/
│  ├─ cms/                       # THE READ LAYER — the only place that talks to Payload
│  │  ├─ client.ts               #   getCms()
│  │  ├─ cache.ts                #   cachedRead(): tag by collection, bust on save
│  │  ├─ content.ts              #   public content reads
│  │  ├─ shop.ts, donations.ts, recruitment.ts
│  │  ├─ media.ts, richtext.tsx, relations.ts, types.ts
│  ├─ orders.ts                  # Pricing, stock reservation, the masked track read
│  └─ shop.ts, cart.ts, crowdfunding.ts   # Isomorphic domain constants
│
├─ components/
│  ├─ layout|sections|ui|rover|shop|support|team
│
└─ payload-types.ts              # GENERATED — `npm run generate:types`

scripts/
├─ migrate-from-sanity.ts        # One-off import from the old dataset
├─ check-shop-privacy.mjs        # Static privacy guards
├─ check-donation-privacy.mjs    # …and the whole-database access audit
└─ test-shop-flow.mjs            # End-to-end access + checkout test
```

> Never call `getPayload()` from a page. Every read goes through
> `src/lib/cms/`, which is what makes caching and `select` discipline
> reviewable in one place.

---

## 3. Rendering Strategy

The site is **statically generated with Incremental Static Regeneration (ISR)**.

- Content pages are React Server Components that read through `src/lib/cms/`.
- Those reads are wrapped in `cachedRead`, tagged per collection, and the
  collection's `afterChange` hook clears the tag on save — so a page is cached
  until its content actually changes, not for a fixed window.
- Detail routes (`rovers/[slug]`, `competitions/[slug]`, `team/[member-slug]`, `research/[slug]`, `news/[slug]`) are **dynamic** (`ƒ`) — server-rendered on demand, so newly-published documents appear without a rebuild.
- `/api/apply` is a dynamic Node route (POST only).
- `/admin/[[...segments]]` is the Payload admin — a client-rendered SPA, always dynamic.

Net effect: **a content edit appears on the site immediately — no redeploy, and no waiting for a revalidation window.** A redeploy is only required for *code* changes.

See the build output table in [DEPLOYMENT.md](DEPLOYMENT.md) for which routes are Static (`○`) vs Dynamic (`ƒ`).

---

## 4. Data Flow

```
Editor → /admin (Payload, same app) ──┐
                                      ▼
Server Component → src/lib/cms/* → Payload Local API → MongoDB
                          │              (in-process function call)
                          └─ cachedRead: tagged by collection,
                             busted by the collection's afterChange hook

Visitor → a form → POST /api/{apply,donate,shop/order} → Local API → MongoDB
```

The single biggest change from the Sanity architecture: **there is no network
hop to read content.** The CMS is a library inside this application, not a
service it calls.

- **Reads** live in `src/lib/cms/` — never call `getPayload()` from a page.
- **Caching** is tag-based rather than time-based. Sanity reads were fetches
  with `revalidate: 60`; a Local API call is not a fetch, so `cachedRead` wraps
  reads with a per-collection tag and the collection's `afterChange` hook clears
  it on save. Content is cached until it changes, so publishing is immediate
  rather than up to a minute late, and nothing refetches on a timer.
- **Anything that must be fresh reads uncached** and says why: stock at
  checkout, the shop and campaign gates, order lookups.
- **Writes** go through the Local API from route handlers. The collections set
  `create: nobody`, so those handlers are the only door — every row that gets in
  has been through the validator, the rate limiter and the gate.

### Access control vs. select

The Local API runs with `overrideAccess: true`, so collection access rules do
not apply to the site reading its own database — and should not. Two controls,
two jobs: `access` protects `/payload-api` from the outside world, and `select`
protects the rendered page from fetching something it must not publish. See
[privacy-runbook.md](privacy-runbook.md) §1.

---

## 5. CMS Integration

- **Config:** `payload.config.ts`. The REST API is mounted at `/payload-api`,
  not the default `/api`, because this app already owns `/api/apply`,
  `/api/donate` and `/api/shop/*`. GraphQL is disabled — nothing uses it, and it
  would be a second door into collections holding personal data.
- **Collections:** `src/payload/collections/`. Every one declares explicit
  `access` for all four operations; `npm run check:privacy` fails otherwise.
- **Generated types:** `src/payload-types.ts`. Never edited by hand — run
  `npm run generate:types` after any collection change.
- **Two root layouts:** the site lives in `src/app/(frontend)/` and the admin in
  `src/app/(payload)/`, because Payload's admin renders its own `<html>`. Route
  groups do not appear in URLs, so nothing moved.
- **Content types** are documented field-by-field in [CONTENT-MODEL.md](CONTENT-MODEL.md).

---

## 6. Styling & Theming

- **Tailwind v4** is configured CSS-first in `src/app/globals.css` (design tokens like surface/divider/text colors and the orange accent), not a JS config file.
- **Design rule:** white/black surfaces with **orange** (`#f05a00` light / `#ff6b1a` dark) as the *only* accent — used for primary buttons, active nav, stat numbers, the announcement bar, tags, and section accent lines.
- **Fonts:** Cabinet Grotesk (headings), Satoshi (body), JetBrains Mono (specs/code).
- **Theme:** `ThemeProvider` (next-themes) defaults to system preference. `ThemeLogo` swaps light/dark logo assets after mount (renders a sized placeholder pre-mount to avoid layout shift); both sources are optional with graceful fallback.

---

## 7. Notable Config

- **`next.config.mjs`** — wraps the config in `withPayload`, and allow-lists image hosts: `img.youtube.com`, Vercel Blob, and the site's own origin (derived from `NEXT_PUBLIC_SITE_URL`, because Payload builds upload URLs from it).
- **`vercel.json`** — pins `framework: "nextjs"` so Vercel uses `.next` output handling (the project had been misconfigured to look for a `dist/` directory).

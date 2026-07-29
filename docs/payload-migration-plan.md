# Sanity → Payload CMS migration plan

**Branch:** `feat/payload-cms`
**Database:** MongoDB (via `@payloadcms/db-mongodb`)
**Target:** Payload 3.x embedded in the existing Next.js 15 App Router app. Sanity
removed entirely — no `@sanity/*` package, no GROQ, no `/studio`, no Sanity webhook.

---

## 0. Why this is bigger than "swap the client"

`grep` says ~90 files and ~11,800 lines touch Sanity. But the code that actually
*matters* is narrower than that, and it is worth naming up front, because these
are the parts where a careless migration silently breaks something real:

1. **Privacy.** Three document types hold personal data — `order` (name, email,
   phone, home address), `donation` (name, account number, transaction ID,
   contact details) and `application` (name, email, student ID). Today the
   protection is *GROQ projections that never select the private fields*, because
   Next serialises fetched data into the RSC flight payload whether or not a
   component renders it. That lesson has to survive the migration: in Payload the
   equivalent control is `select` on the Local API call plus collection-level
   `access.read`, and the existing `npm run check:privacy` static checks must be
   rewritten to enforce the new idiom, not deleted.

2. **No-oversell ordering.** `reserveAndCreateOrder()` decrements stock and
   creates the order in one Sanity transaction, using `ifRevisionId` as a
   compare-and-set token, retried five times. MongoDB has no `_rev`, so the
   equivalent has to be rebuilt from Mongo primitives — a conditional
   `$inc` guarded by `stock >= qty` in the filter, inside a session transaction.
   This is the single highest-risk piece of the migration.

3. **At-least-once webhook effects.** The Sanity webhook (`/api/shop/webhook`)
   sends status emails and restores stock on cancellation, guarded by
   `notifiedStatuses[]` and `stockRestoredAt`. Payload replaces the whole HTTP
   round trip with an `afterChange` collection hook — better, but the idempotency
   guards still matter because a hook can run on any save.

4. **Images.** 37 `urlFor(...)` calls build Sanity CDN URLs with width/height/crop.
   Payload generates fixed image sizes at upload time instead. Needs a real
   replacement, not a stub.

Everything else — content collections, pages, listing queries — is mechanical.

---

## 1. Architecture after the migration

```
payload.config.ts                 Payload root config (collections, globals, db, admin)
src/payload/
  collections/                    one file per collection
  globals/                        the three singletons
  fields/                         shared field factories (slug, seo, portable-ish richtext)
  hooks/                          revalidation + order side effects
  access/                         named access-control predicates
src/app/(payload)/
  admin/[[...segments]]/          Payload admin UI            → /admin
  payload-api/[...slug]/          Payload REST API            → /payload-api/*
  layout.tsx                      Payload's own root layout
src/lib/cms/
  client.ts                       cached getPayload() instance
  media.ts                        image URL + srcset helpers (replaces urlFor)
  richtext.tsx                    Lexical → React renderer (replaces PortableText)
  content.ts, shop.ts, orders.ts, donations.ts, recruitment.ts
                                  typed read functions (replace src/sanity/lib/queries.ts)
src/payload-types.ts              generated — never edited by hand
```

**Route collision.** Payload's REST API defaults to `/api`, which the app already
uses for `/api/apply`, `/api/donate`, `/api/shop/*`. Two route trees resolving
under the same prefix (one of them a catch-all) is a Next build error, so
Payload's API is moved to `/payload-api` via `routes.api` in the config. The app's
own `/api/*` routes are untouched.

**Admin URL.** `/admin`, replacing `/studio`.

**Caching.** Sanity reads were `fetch()` calls with `next: { revalidate: 60 }`.
The Payload Local API is a direct function call, so ISR has to come from
`unstable_cache` with tags. Each collection's `afterChange`/`afterDelete` hook
calls `revalidateTag`, which makes publishing *instant* instead of up-to-60s
stale — a genuine improvement. Anything that must never be cached (stock reads
at checkout, the shop open/closed gate, order lookups) calls Payload directly
with no cache wrapper, exactly as it used `revalidate: 0` before.

---

## 2. Content model mapping

| Sanity type          | Payload            | Kind       | Notes |
| -------------------- | ------------------ | ---------- | ----- |
| `announcement`       | `announcements`    | collection | |
| `member`             | `members`          | collection | |
| `rover`              | `rovers`           | collection | biggest; 6 field groups → tabs |
| `competition`        | `competitions`     | collection | |
| `research`           | `research`         | collection | |
| `post`               | `posts`            | collection | body: portable text → Lexical |
| `sponsor`            | `sponsors`         | collection | |
| `testimonial`        | `testimonials`     | collection | |
| `sarVideo`           | `sar-videos`       | collection | |
| `productCategory`    | `product-categories` | collection | |
| `product`            | `products`         | collection | variants as array; stock lives here |
| `application`        | `applications`     | collection | **private** |
| `donation`           | `donations`        | collection | **private** |
| `order`              | `orders`           | collection | **private**; hooks replace the webhook |
| `recruitmentConfig`  | `recruitment`      | global     | |
| `crowdfundingConfig` | `crowdfunding`     | global     | |
| `shopConfig`         | `shop`             | global     | |
| (Sanity assets)      | `media`            | collection | upload, with generated sizes |
| —                    | `users`            | collection | **new** — Payload owns auth now |

### Field-shape differences that ripple into the frontend

| Sanity                          | Payload                          | Frontend impact |
| ------------------------------- | -------------------------------- | --------------- |
| `_id`                           | `id`                             | 151 occurrences |
| `slug: { current: string }`     | `slug: string`                   | 40 occurrences |
| `_key` on array members         | `id` on array rows               | 32 occurrences — variant keys, order items |
| `SanityImage` (`asset._ref`)    | `Media` doc (`url`, `sizes`, …)  | 24 files |
| `urlFor(img).width(n).url()`    | `imageUrl(media, 'card')`        | 37 calls |
| Portable Text `[]`              | Lexical `SerializedEditorState`  | 3 render sites |
| `reference` → resolved via `->` | `relationship` + `depth`         | every join |
| File asset + `getFileUrl()`     | `Media` doc `url`                | PDFs, `.glb` |

`_key` deserves a note: order line items and product variants both key off it.
Payload gives array rows a stable `id`. The order document stores `variantKey` as
a plain string copied from the variant row's `id`, so the reservation and the
cancellation restore keep working the same way — the value changes, the mechanism
does not.

---

## 3. Step-by-step

Each numbered step is one commit. Every step ends green: `npx tsc --noEmit`
passes, and from step 30 on, `npm run build` passes too.

Sanity and Payload **coexist** from step 1 to step 46. That is deliberate: it lets
every intermediate commit compile and run, so a mistake is caught in the step that
caused it rather than at the end of a 90-file rewrite.

### Phase A — Foundation (steps 1–9)

1. Plan document (this file).
2. `docker-compose.yml` — MongoDB 7 as a single-node **replica set** (`rs0`).
   A replica set, not a standalone, because the order reservation needs
   multi-document transactions and standalone `mongod` refuses them.
3. Install Payload: `payload`, `@payloadcms/next`, `@payloadcms/db-mongodb`,
   `@payloadcms/richtext-lexical`, `@payloadcms/ui`, `graphql`, `sharp`.
4. `payload.config.ts` with `users` + `media` only; `withPayload()` in
   `next.config.mjs`; `routes.api = '/payload-api'`.
5. `src/app/(payload)/` route group — admin, REST, layout, `importMap`.
6. Env: `DATABASE_URI`, `PAYLOAD_SECRET`; update `.env.local.example`.
7. `npm run generate:types` wired into `package.json`; commit `src/payload-types.ts`.
8. Boot check: admin loads, first user creates, media upload works.
9. `src/lib/cms/client.ts` — memoised `getPayload()`.

### Phase B — Collections (steps 10–26)

One collection per step, in dependency order so relationships always point at
something that already exists.

10. `media` (upload; sizes: `thumb` 160², `card` 640w, `hero` 1600w; focal point).
11. `users` (auth; `role: admin | editor`; access predicates in `src/payload/access`).
12. `announcements`
13. `members`
14. `competitions` (relationship → members, rovers — rovers added in 15, so the
    rover field is added in 15 to keep the graph acyclic at every commit)
15. `rovers` (+ back-fill `competitions.rover`)
16. `research`
17. `posts`
18. `sponsors`
19. `testimonials`
20. `sar-videos`
21. `product-categories`
22. `products`
23. Globals: `recruitment`, `crowdfunding`, `shop`
24. `applications` (private)
25. `donations` (private)
26. `orders` (private) — fields only; hooks land in step 41.

Every collection gets, explicitly and without relying on defaults:

- `access: { read, create, update, delete }` — public collections read `() => true`,
  private ones `() => false` for anonymous and role-gated for staff.
- `admin.group` + `admin.defaultColumns` + `admin.useAsTitle`, reproducing the
  Sanity desk structure (Shop → New Orders / To Fulfil / …, Crowdfunding →
  Pending Verification / …) as filtered list presets.
- Field-level `access` where a field is admin-only (`amount`, `adminNotifyEmails`,
  `senderAccount`, …) so even an authenticated editor cannot leak it through the
  REST API.
- `admin.description` carried over verbatim from the Sanity schema — the
  descriptions are how the team actually knows what a field means.

### Phase C — Data layer (steps 27–30)

27. `src/lib/cms/media.ts` — `imageUrl(media, size)`, `imageProps(media, size)`
    returning `{src, width, height, alt}` for `next/image`, and blur handling.
28. `src/lib/cms/richtext.tsx` — Lexical renderer with the converters the old
    Portable Text config supported (h2/h3, blockquote, bold/italic/code, links,
    inline images, YouTube embeds).
29. `src/lib/cms/cache.ts` — `cachedQuery(tag, fn)` over `unstable_cache`, plus
    `revalidateCollection()` used by hooks.
30. `src/lib/cms/content.ts` — every read function replacing `queries.ts`, typed
    against `payload-types.ts`, with `select` used everywhere a private field
    could otherwise be pulled into a page.

### Phase D — Frontend cutover (steps 31–43)

One content domain per step. Each step rewrites the pages and components for that
domain against `src/lib/cms/*`, deletes nothing from `src/sanity/` yet, and ends
with a passing typecheck.

31. Layout + announcements (`AnnouncementBarServer`, `Footer`).
32. Rovers — `/rovers`, `/rovers/[slug]`, 13 `src/components/rover/*`.
33. Team — `/team`, `/team/[member-slug]`, `TeamDirectory`, `MemberHero`, …
34. Competitions — `/competitions`, `/competitions/[slug]`, `/achievements`.
35. Research — `/research`, `/research/[slug]`, `ResearchExplorer`, `FeaturedPaper`.
36. News — `/news`, `/news/[slug]`, `NewsStrip`.
37. Sponsors, testimonials, SAR videos, gallery, `/about`, `/outreach`.
38. Home page (`src/app/page.tsx` + the ~10 `src/components/sections/*`).
39. Recruitment — `/join`, `/join/apply`, `POST /api/apply`.
40. Crowdfunding — `/support`, `/support/donate`, `POST /api/donate`,
    `src/lib/donations.ts`.
41. Shop reads — `/shop`, `/shop/[slug]`, `src/lib/shop-server.ts`.
42. Shop writes — `src/lib/orders.ts` reservation on Mongo transactions,
    `POST /api/shop/order`, `POST /api/shop/cart`.
43. Order side effects — `orders` collection `afterChange` hook replaces
    `/api/shop/webhook`; the route is deleted along with `@sanity/webhook`.

### Phase E — Data migration (steps 44–45)

44. `scripts/migrate-from-sanity.mjs`:
    - streams every document type out of Sanity via the export API,
    - downloads each referenced asset and uploads it to `media`, recording
      `sanityAssetId → payload media id`,
    - inserts documents in dependency order, recording `sanity _id → payload id`,
    - second pass rewrites relationship fields using the id map,
    - converts Portable Text → Lexical,
    - is **idempotent**: re-running updates rather than duplicating, keyed on a
      `legacySanityId` field kept on every migrated document.
45. Run it against the live dataset into the local Mongo; verify counts and spot-check.

### Phase F — Remove Sanity (step 46)

46. Delete `src/sanity/`, `sanity.config.ts`, `src/app/studio/`, the four seed
    scripts, `@sanity/*` + `next-sanity` + `sanity` from `package.json`; drop
    `cdn.sanity.io` from `next.config.mjs` `remotePatterns`; drop the `/studio`
    header rule; update `.env.local.example`.

### Phase G — Production readiness (steps 47–54)

47. Media storage for serverless: `@payloadcms/storage-vercel-blob`, enabled when
    `BLOB_READ_WRITE_TOKEN` is present, local disk otherwise. Vercel's filesystem
    is ephemeral, so local-disk uploads would vanish on every deploy — this is not
    optional for production.
48. Rewrite `scripts/check-shop-privacy.mjs` + `check-donation-privacy.mjs` for
    Payload idioms (assert `select` on order/donation reads; assert no private
    field name appears in a `'use client'` module; assert `access.read` is
    explicit on every collection).
49. New `scripts/check-access.mjs` — boots the app and asserts the public REST API
    returns 403/401 for `orders`, `donations`, `applications`, `users`.
50. Port `scripts/test-shop-flow.mjs` to Payload, including a concurrency test that
    two simultaneous checkouts for one remaining unit produce exactly one order.
51. `scripts/seed-dev.mjs` — a small deterministic dataset for local work.
52. Full `npm run build` + `next start` smoke test across every route, plus a
    re-run of the flight-payload PII assertion on `/shop/track/[trackId]`.
53. Docs: rewrite `ARCHITECTURE.md`, `CONTENT-MODEL.md`, `CONTENT-EDITING.md`,
    `DEVELOPMENT.md`, `DEPLOYMENT.md`, `privacy-runbook.md`, `shop-runbook.md`.
54. Open the PR.

---

## 4. Decisions taken, and their reasons

- **Payload's API moved to `/payload-api`** rather than moving the app's four
  existing API routes. Those routes are public contracts — the checkout form, the
  apply form and the donate form all post to them, and one of them is referenced
  from a Sanity webhook config that lives outside this repo.

- **Frontend types go Payload-native** (`id`, `slug: string`, `Media`) instead of
  keeping a Sanity-shaped adapter. An adapter would have been a smaller diff, but
  it would leave `slug.current` in a codebase with no Sanity in it, and every
  future reader would have to learn a vocabulary for a system that is gone.
  TypeScript makes the rename safe: every missed site is a compile error.

- **MongoDB replica set even in dev.** Transactions are the whole basis of the
  no-oversell guarantee. Developing against a standalone `mongod` that silently
  cannot do transactions would mean the guarantee is only ever exercised in
  production.

- **Compare-and-set becomes a filtered `$inc`.** Sanity's `ifRevisionId` has no
  Mongo equivalent, but it does not need one: `updateOne({_id, variants.id, variants.stock: {$gte: qty}}, {$inc: {'variants.$.stock': -qty}})` is atomic at the
  document level and fails (matchedCount 0) exactly when someone else got there
  first. Wrapped in a session transaction alongside the order insert, this gives
  the same all-or-nothing property with a stronger per-line guarantee.

- **The webhook becomes a hook.** `/api/shop/webhook` existed only because Sanity
  is a separate system. Payload runs in-process, so `afterChange` on `orders` is
  strictly better: no HMAC, no retry semantics, no secret to rotate. The
  idempotency guards stay, because an admin can still save a document twice.

- **Sanity content is migrated, not re-entered.** The team seeded real content
  (news, research, SAR videos, testimonials, 8 rovers, member skills). Asking them
  to retype it would be the actual cost of this migration, and it is avoidable.

## 5. Known risks

| Risk | Mitigation |
| ---- | ---------- |
| Mongo transactions unavailable (standalone prod DB) | Detect at boot; log loudly; fall back to compensating writes with a documented, narrower guarantee |
| Image sizes differ from Sanity's on-the-fly crops | Generate the three sizes the design actually uses; verify each page visually |
| Lexical conversion loses Portable Text nuance | Only 3 render sites and a handful of documents; convert then spot-check each |
| Payload admin bundle inflates the build | Admin is its own route group, code-split from the site; measure before/after |
| Public REST API leaks a private collection | Explicit `access.read` on every collection + `scripts/check-access.mjs` in CI |

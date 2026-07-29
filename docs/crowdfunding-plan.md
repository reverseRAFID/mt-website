# Crowdfunding / Supporters — Feature Plan

> **Historical.** This is the design document written when the crowdfunding
> feature was built on Sanity, kept because it records *why* the privacy rules
> are what they are — the reasoning survived the migration even though the
> mechanics did not. For how it works now, see
> [privacy-runbook.md](privacy-runbook.md); for the current field list, see
> [CONTENT-MODEL.md](CONTENT-MODEL.md). References below to GROQ projections,
> `_id` and the Sanity Studio describe the previous implementation.

Individual-donor crowdfunding for BRACU Mongol-Tori. Donors pay through a mobile
financial service (bKash / Nagad / Rocket / Upay) or bank transfer, then declare
that payment through a form on the site. An admin verifies the payment manually in
Sanity Studio, records the amount, and approves it. Approved supporters appear on a
public honour roll ranked by amount — **without the amount ever being public**.

---

## 1. Product spec

### 1.1 Donor journey

```
/support
  │
  ├─ 1. Read the campaign pitch
  ├─ 2. Pick a payment channel card → tap "Copy" on the account number
  ├─ 3. Leave the site, send money in the bKash/Nagad/bank app
  ├─ 4. Come back, fill the declaration form:
  │        • channel used            (required)
  │        • account you sent from   (required — how the admin matches it)
  │        • transaction ID          (optional but speeds verification)
  │        • your name               (required — always recorded)
  │        • "list me as Anonymous"  (checkbox)
  │        • affiliation             (optional, e.g. "BRACU CSE '22")
  │        • public message          (optional, ≤ 160 chars)
  │        • email / phone           (optional, for the thank-you)
  │        • "I confirm I sent this" (required)
  └─ 5. Submit → status: pending → "We'll verify within N hours"
```

### 1.2 Admin journey

```
Sanity Studio → Crowdfunding
  ├─ ⏳ Pending Verification   ← new declarations land here
  │      1. Match sender account / trx ID against the bKash statement
  │      2. Type the verified amount  (required to approve)
  │      3. Set Verified At
  │      4. Status → ✅ Approved      → appears publicly within 60s (ISR)
  │      or  Status → ⛔ Rejected     + reason (never shown publicly)
  ├─ ✅ Approved   (ordered by amount desc — the live leaderboard)
  ├─ ⛔ Rejected
  ├─ 📋 All Donations
  └─ ⚙️ Crowdfunding Config (singleton)
```

### 1.3 Public honour roll

Table layout, ranked. Rank is derived purely from position in an
`order(amount desc)` query — **the amount itself is never projected**.

| RANK | SUPPORTER              | BADGE           | NOTE            | VERIFIED   |
|------|------------------------|-----------------|-----------------|------------|
| #01  | Tanvir Rahman · CSE'19 | GOLD PATRON     | "Go get gold."  | 12 Jul 2026 |
| #02  | Anonymous              | SILVER PATRON   | —               | 09 Jul 2026 |
| #03  | Nusrat Jahan           | BRONZE PATRON   | —               | 08 Jul 2026 |
| #04  | Anonymous              | TOP SUPPORTER   | —               | 04 Jul 2026 |
| #05  | Rafid Hasan · EEE'21   | TOP SUPPORTER   | —               | 02 Jul 2026 |
| 06   | Sadia Islam            | —               | —               | 01 Jul 2026 |
| …    |                        |                 |                 |            |

Ties (equal amounts) break on earlier `approvedAt`, then `_createdAt` — stable
and deterministic.

### 1.4 Homepage section

A `CrowdfundingSection` between `Testimonials` and `CTASection`:
supporter count + top-5 mini table + **"See all supporters" → `/support`**
(the "see more" button) + a primary "Support the mission" CTA.

---

## 2. Privacy architecture — the load-bearing decision

> **The Sanity `production` dataset is currently PUBLIC.** Verified with an
> unauthenticated request:
> `curl 'https://aslda7ok.api.sanity.io/v2024-01-01/data/query/production?query=count(*[_type=="sponsor"])'`
> → `{"result":17}`.
>
> On a public dataset **every field of every document is world-readable**, no
> matter what the site's own GROQ projections select. Donation amounts, sender
> account numbers, and donor emails would all be one `curl` away.

**Decision: make the `production` dataset private.**
(sanity.io/manage → project `aslda7ok` → Datasets → production → Visibility → Private)

Why this is safe for the existing site:

| Concern | Status |
|---|---|
| Server-side reads | Already tokened — `readClient` in `src/sanity/lib/client.ts` uses `SANITY_API_READ_TOKEN ?? SANITY_API_TOKEN`. |
| Client-side reads | None. No `'use client'` component calls `sanityFetch`/`.fetch` — they only import `urlFor` and types. |
| Images | Sanity **assets stay publicly served from `cdn.sanity.io` regardless of dataset visibility**. `next/image` keeps working. |
| Studio `/studio` | Uses interactive Sanity login, unaffected. |
| Seed scripts | Already token-authenticated. |
| Vercel | `SANITY_API_TOKEN` must be set in Production **and** Preview. It already is — the apply form requires it. |

Bonus: this also closes an existing hole — `application` documents (applicant
name, email, phone, student ID) are currently world-readable. There are 0 today,
so nothing has leaked, but the next recruitment cycle would expose all of it.

### 2.1 Defence in depth (code-side, independent of dataset visibility)

1. **Private fields are never projected.** The public GROQ query selects only
   `_id, displayName, affiliation, message, approvedAt`. `amount`,
   `senderAccount`, `transactionId`, `contactEmail`, `contactPhone`,
   `adminNotes`, `rejectionReason`, and the real `donorName` of an anonymous
   donor are never in a payload that reaches a browser.
2. **Anonymity is resolved server-side, in GROQ**, not in React:
   `"displayName": select(isAnonymous == true => "Anonymous", donorName)`.
   The real name of an anonymous donor never leaves Sanity.
3. **Rank is computed from array position**, never from the amount value.
   Sanity does the `order(amount desc)` internally and returns rows without it.
4. **No aggregate figures.** No "total raised", no goal thermometer, no
   averages — nothing an attacker could difference against known ranks.
   Supporter *count* only.
5. **A privacy guard script** (`npm run check:privacy`) fails the build if any
   public query string mentions a private field, and probes the live API to
   assert the dataset is not anonymously readable.

---

## 3. Sub-modules

| # | Module | Files |
|---|---|---|
| A | Shared domain constants | `src/lib/crowdfunding.ts` |
| B | Sanity schema | `src/sanity/schemas/donation.ts`, `crowdfundingConfig.ts`, `index.ts` |
| C | Studio structure | `sanity.config.ts` |
| D | Types + queries | `src/sanity/lib/types.ts`, `queries.ts` |
| E | Server data layer | `src/lib/donations.ts`, `src/lib/rate-limit.ts` |
| F | Submission API | `src/app/api/donate/route.ts` |
| G | Design tokens | `src/app/globals.css` (rank metal tokens) |
| H | UI primitives | `src/components/ui/CopyButton.tsx` |
| I | Support components | `src/components/support/*` |
| J | Pages + wiring | `src/app/support/page.tsx`, `src/app/page.tsx`, `Navbar`, `Footer` |
| K | Ops | `.env.local.example`, `docs/`, `scripts/check-donation-privacy.mjs`, `scripts/seed-donations.mjs` |

### 3.1 `donation` document

**Public-safe** (projected to the site)

| Field | Type | Notes |
|---|---|---|
| `status` | string | `pending` \| `approved` \| `rejected`. Initial `pending`. |
| `donorName` | string | Always recorded. Replaced by `"Anonymous"` in the public projection when `isAnonymous`. |
| `isAnonymous` | boolean | |
| `affiliation` | string | Optional, e.g. `BRACU CSE '22`. Suppressed when anonymous. |
| `message` | text | Optional public note, ≤ 160 chars. |
| `donatedAt` | datetime | Set by the API on submission. |
| `approvedAt` | datetime | Set by admin. Required when approving. |

**Admin-only** (never projected)

| Field | Type | Notes |
|---|---|---|
| `amount` | number | BDT. **Required and > 0 to approve.** |
| `paymentMethod` | string | Channel the donor used. |
| `senderAccount` | string | Number the donor sent from. |
| `transactionId` | string | Optional. Unique-checked on submit. |
| `contactEmail` / `contactPhone` | string | Optional. |
| `adminNotes` | text | Internal. |
| `verifiedBy` | string | Internal. |
| `rejectionReason` | string | Internal. |

All donor-supplied fields are `readOnly` in the Studio (same convention as
`application`) so verification can't silently rewrite a declaration. Only
`status`, `amount`, `approvedAt`, `verifiedBy`, `adminNotes`, and
`rejectionReason` are editable.

### 3.2 `crowdfundingConfig` singleton (`_id: crowdfunding-config`)

`status` (`open`/`paused`/`closed`, gates the API server-side) · `headline` ·
`pitch` · `closedMessage` · `verificationHours` · `showSupporterCount` ·
`channels[]` (method, accountName, accountNumber, accountType, note, bankName,
branch, routingNumber) · `steps[]` · `faqItems[]`.

The account numbers donors copy live here, so the team can rotate them without
a deploy.

---

## 4. Design system compliance

Everything reuses the existing mission-control language — no new patterns:

- `PageLayout` + `PageHero` (watermark `SUPPORT`) for the page shell
- `SectionHeader` with numbered kickers, `GhostText` watermarks per section
- `Reveal` for scroll entrances, `Counter` for the supporter tally
- `CornerTicks`, `hud-label`, `nums`, `surface-lift`, `rounded-card` (= 0 radius),
  `tech-grid`, `Accordion` for the FAQ
- Form styling copied verbatim from `ApplyForm` (`inputCls` / `SectionTitle` /
  numbered fieldsets / focus rings / 44px min targets)
- Single hot accent preserved. The only new hues are three **metal** tokens for
  ranks 1–3 (gold/silver/bronze), which read as medals rather than as a second
  brand colour; ranks 4–5 use the existing orange (solid vs outline).

New tokens in `globals.css`, light + dark, registered in `@theme inline`:
`--rank-gold`, `--rank-gold-bg`, `--rank-silver`, `--rank-silver-bg`,
`--rank-bronze`, `--rank-bronze-bg`.

---

## 5. Implementation plan — 30 steps

Branch: **`feat/crowdfunding`**. Every step is one commit, pushed immediately.

### Phase 0 — Branch
- **S00** Branch off `main`; commit the pending working-tree work (brutalist type
  system + `GhostText.tsx`) as the branch baseline so the branch builds standalone.
- **S01** Commit this plan.

### Phase 1 — Data layer
- **S02** `src/lib/crowdfunding.ts` — payment methods, rank tiers, display helpers, validators.
- **S03** `crowdfundingConfig` schema.
- **S04** `donation` schema.
- **S05** Register both in `schemas/index.ts`.
- **S06** Studio structure: Crowdfunding group (Pending / Approved / Rejected / All / Config).
- **S07** Types in `src/sanity/lib/types.ts`.
- **S08** GROQ in `src/sanity/lib/queries.ts` — public-safe projections.

### Phase 2 — Server
- **S09** `src/lib/rate-limit.ts`.
- **S10** `POST /api/donate`.
- **S11** `src/lib/donations.ts` — fetch + rank derivation.

### Phase 3 — Tokens
- **S12** Rank metal tokens in `globals.css`.

### Phase 4 — Components
- **S13** `CopyButton`.
- **S14** `RankBadge`.
- **S15** `SupportersTable` (search + show-more + responsive).
- **S16** `PaymentChannels`.
- **S17** `SupportForm`.
- **S18** `HowItWorks`.
- **S19** `SupportFaq`.
- **S20** `SupportersHonourRoll` section wrapper + empty state.

### Phase 5 — Pages
- **S21** `/support` page + metadata.
- **S22** `CrowdfundingSection` (homepage).
- **S23** Wire into homepage.
- **S24** Navbar + Footer links.

### Phase 6 — Ops
- **S25** `.env.local.example` + privacy runbook doc.
- **S26** `scripts/check-donation-privacy.mjs` + `npm run check:privacy`.
- **S27** `scripts/seed-donations.mjs` (demo rows, `seed-` prefixed like the others).

### Phase 7 — Verification
- **S28** Typecheck + lint + production build.
- **S29** Runtime smoke: dev server, every route, API happy path + each rejection path.
- **S30** Browser pass across widths; privacy audit; final push.

---

## 6. Production-readiness — verification results

### Verified

- [x] `npm run lint` — no ESLint warnings or errors
- [x] `tsc --noEmit` — clean
- [x] `next build` — 29/29 pages, `/support` prerendered (8.29 kB, ISR 30s),
      `/api/donate` dynamic
- [x] All routes 200 (`/`, `/support`, `/sponsors`, `/join/apply`, `/team`,
      `/rovers`, `/news`, `/research`); no server errors logged
- [x] **`POST /api/donate` rejection paths**, each returning the intended code:

      missing name        400   bad email          400
      bad channel         400   over-length field  400
      bad account format  400   invalid JSON       400
      not confirmed       400   campaign closed    403
      honeypot            200 (decoy)   rate limit  429 + Retry-After: 3600
      too-fast submit     200 (decoy)

- [x] **Campaign fails shut** — with the config singleton absent, `/support`
      renders the closed state and the API returns 403. A Sanity outage cannot
      accidentally reopen a campaign.
- [x] **The rank mechanism, proven against the live Sanity API.** Two queries
      over the same documents, one projecting the sort key and one not,
      returned *identical order* — while the non-projecting query omitted the
      sort key entirely and `select()` replaced the matching rows with
      `"Anonymous"` and a null affiliation. This is exactly how amount-ordering
      and anonymity behave for donations.
- [x] **Rendering** against fixtures: ranks 1–5 badged gold/silver/bronze/
      orange/orange-outline, 6+ plain; anonymous rows show no affiliation;
      metal tokens resolve; `lg:table-cell` / `md:table-cell` column hiding and
      `overflow-x-auto` present; sr-only caption states amounts are not
      published; no currency-like token anywhere in visible text.
- [x] `npm run check:privacy` static checks pass, **and were proven to catch
      regressions** — injecting `amount` into the public projection, and
      replacing the anonymity `select()` with a bare `donorName`, were both
      detected.

### Blocked — needs an Editor token

The `SANITY_API_TOKEN` in `.env.local` is read-scoped (`create` denied), so
these could not be exercised:

- [ ] `POST /api/donate` happy path creating a real `pending` document
- [ ] Duplicate transaction-ID guard (409) — needs an existing document
- [ ] End-to-end roll rendering from real approved donations, with the HTML
      grepped for the actual seeded amounts

`scripts/seed-donations.mjs` is written and dry-run verified for exactly this;
it needs an Editor token to run.

### Outstanding action — REQUIRED before launch

- [ ] **Dataset visibility → Private.** `npm run check:privacy` currently
      FAILS on this: an anonymous request to the production dataset still
      succeeds. Until it is flipped, every donation amount, sender account and
      donor phone number would be world-readable regardless of the code.
      See `docs/privacy-runbook.md` §1.

### Not covered

- [ ] Browser pass at 375 / 768 / 1440 in light and dark (the Chrome extension
      was not connected; responsive behaviour was verified from markup only)

---

## 7. Phase 2 — site-wide CTAs + dedicated donate page

### 7.1 Why the flow is split

`/support` is the **why** (story, where the money goes, how it works, honour
roll, FAQ). `/support/donate` is the **how** — copy a number, pay, declare,
and nothing else on the page competing for that click. The form was moved off
`/support` rather than duplicated: two live forms split both attention and
whatever analytics get added later.

### 7.2 CTA placement

Crowdfunding is impulse-led, so the ask sits next to the proof rather than in a
generic banner. Each of 18 routes gets one contextual band whose copy names
what the visitor just read — parts on rover pages, freight on competition and
achievement pages, the students on team pages, end-of-article on news.

Two are conversion plays rather than filler:

- **`/join`** — people who wanted to join and cannot (BRACU students only).
  Highest-intent audience on the site, previously a dead end.
- **`/sponsors`** — individuals who are not there on a company's behalf.

Plus three chrome placements on every page: a floating sticky (suppressed on
`/support*`, `/join/apply`, and `/sponsors` where it would collide with the
existing sticky), a quiet footer strip, and a fourth card in the homepage
Get Involved grid.

### 7.3 Fail-quiet rules

Every piece of CTA copy self-suppresses rather than saying something weak:

| Condition | Behaviour |
|---|---|
| Campaign not `open` | **Every** CTA site-wide disappears — 18 bands, sticky, footer strip. Asking for money that cannot be received is the fastest way to lose a donor. |
| Sanity unreachable | `getSupportCtaData` fails **closed**, so an outage hides CTAs rather than inviting payments. |
| Deadline passed | No countdown. Never renders "-3 days left". |
| Deadline > 21 days out | No countdown — a months-long timer stops being noticed by the time it matters. |
| Deadline < 48h | "Last day to contribute", not "1 days left". |
| Supporters < 5 | No social-proof line — "Join 2 supporters" is worse than silence. |
| `showSupporterCount` off | Count suppressed in CTAs, hero, and honour roll; the roll itself still lists people. |
| Campaign open, 0 channels | Donate page routes to `/contact` instead of showing a form nobody could have paid into. |

### 7.4 Verification — CTA state matrix

A fixture harness drove `getCrowdfundingConfig` / `getSupporters` /
`getSupporterCount` so all ten campaign states could be rendered and asserted
against. **63 assertions, 0 failures.** Harness reverted afterwards; the
committed tree contains none of it.

Scenarios: campaign open · paused · open-with-zero-channels · deadline at 6d /
90d / past / <48h · 3 supporters · 0 supporters · `showSupporterCount` off.

Two findings worth recording:

1. **Real bug caught** — `/sponsors` was missing from the rollout map, silently
   dropping one of the two best-placed CTAs. Fixed.
2. When the campaign is closed the sticky **client island is not shipped at
   all** (only the server wrapper module appears in the payload), confirmed by
   diffing the flight output between open and paused.

Also confirmed against the real Sanity dataset: with no config document the
campaign resolves closed, and the prerendered `/rovers` build output contains
zero CTA strings while `/support/donate` renders the closed notice with no
form.

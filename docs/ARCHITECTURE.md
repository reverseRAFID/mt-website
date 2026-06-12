# Architecture

How the BRACU Mongol-Tori site is put together: the stack, where things live, how data flows, and how pages are rendered.

---

## 1. Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router) | React Server Components by default |
| UI runtime | **React 19** | |
| CMS | **Sanity v3** | Embedded Studio at `/studio`; content fetched via GROQ |
| Styling | **Tailwind CSS v4** | Via `@tailwindcss/postcss`; no `tailwind.config.ts` (v4 is CSS-first, configured in `globals.css`) |
| Theming | **next-themes** | Light/dark, system default |
| Database | **Neon** (serverless Postgres) | Only the recruitment form (`/api/apply`) |
| Hosting | **Vercel** | See [DEPLOYMENT.md](DEPLOYMENT.md) |
| Language | **TypeScript** | Strict; CI runs `tsc --noEmit` |

---

## 2. Directory Layout

```
src/
├─ app/                          # App Router: routes are folders with page.tsx
│  ├─ layout.tsx                 # Root layout — fonts, ThemeProvider, Navbar, Footer
│  ├─ page.tsx                   # Home (/)
│  ├─ globals.css                # Tailwind v4 entry + design tokens (colors, fonts)
│  ├─ about|achievements|...     # Static content pages
│  ├─ rovers/                    # Listing + rovers/[slug] detail
│  ├─ competitions/              # Listing + competitions/[slug] detail
│  ├─ team/                      # Listing + team/[member-slug] portfolio
│  ├─ research/                  # Listing + research/[slug] detail
│  ├─ news/                      # Listing + news/[slug] article
│  ├─ join/                      # Recruitment landing + join/apply (form)
│  ├─ api/apply/route.ts         # POST handler → writes application to Neon
│  └─ studio/[[...tool]]/        # Sanity Studio mount (catch-all route)
│
├─ components/
│  ├─ layout/                    # Navbar, Footer, PageLayout, AnnouncementBar(+Server)
│  ├─ sections/                  # Home/page sections (Hero, RoverSpotlight, NewsStrip, …)
│  └─ ui/                        # Small reusables (ThemeToggle, ThemeLogo)
│
├─ sanity/
│  ├─ schemas/                   # One file per content type + index.ts (schemaTypes[])
│  └─ lib/
│     ├─ client.ts               # Canonical Sanity client + urlFor() + sanityFetch()
│     ├─ queries.ts              # All GROQ queries (single source of truth)
│     └─ types.ts                # TypeScript types for query results
│
├─ lib/
│  ├─ db.ts                      # Lazy Neon client — getSql()
│  └─ utils.ts                   # cn(), formatDate(), estimateReadTime()
│
└─ providers/
   └─ ThemeProvider.tsx          # Wraps next-themes

sanity.config.ts                 # Studio config: projectId, dataset, desk structure
next.config.mjs                  # Image remote patterns + /studio iframe headers
vercel.json                      # { "framework": "nextjs" }
```

> All Sanity reads go through the single client in `src/sanity/lib/client.ts`.

---

## 3. Rendering Strategy

The site is **statically generated with Incremental Static Regeneration (ISR)**.

- Content pages are React Server Components that call `sanityFetch()` at build time.
- `sanityFetch()` sets `next: { revalidate }` (default **60s**, home/listing pages use **30s**), so Vercel re-renders a page in the background at most once per window after the first request following an edit.
- Detail routes (`rovers/[slug]`, `competitions/[slug]`, `team/[member-slug]`, `research/[slug]`, `news/[slug]`) are **dynamic** (`ƒ`) — server-rendered on demand, so newly-published documents appear without a rebuild.
- `/api/apply` is a dynamic Node route (POST only).
- `/studio/[[...tool]]` is a client-rendered SPA (the Sanity Studio), dynamic.

Net effect: **content edits in Sanity appear on the site within the revalidation window — no redeploy needed.** A redeploy is only required for *code* changes.

See the build output table in [DEPLOYMENT.md](DEPLOYMENT.md) for which routes are Static (`○`) vs Dynamic (`ƒ`).

---

## 4. Data Flow

```
Editor → Sanity Studio (/studio) → Sanity dataset (cloud)
                                        │  GROQ over HTTPS
                                        ▼
   Server Component → sanityFetch(QUERY) → renders HTML  (ISR-cached)
                                        ▲
                                        │  images
                          cdn.sanity.io (next/image remote pattern)

Visitor → /join/apply (form) → POST /api/apply → getSql() → Neon Postgres
```

- **Reads** (all public content): GROQ queries in `src/sanity/lib/queries.ts`, executed via `sanityFetch()`. No API token needed for public reads.
- **Images**: served from `cdn.sanity.io`, transformed via `urlFor()` (allow-listed in `next.config.mjs`).
- **Writes** (applications): the only write path. The browser POSTs JSON to `/api/apply`, which validates, lazily connects to Neon via `getSql()`, ensures the `applications` table exists, and inserts a row.

### Why `getSql()` is lazy
`src/lib/db.ts` creates the Neon client **on first query**, not at module import. If it connected at import time, `next build` would crash while statically analyzing the route whenever `DATABASE_URL` is unset (e.g. on the Vercel build runner). Lazy init keeps the build env-free; a missing `DATABASE_URL` only surfaces as a graceful 500 at runtime.

---

## 5. Sanity Integration

- **Client:** `src/sanity/lib/client.ts` — `createClient` from `next-sanity` with `useCdn: false` for fresh ISR data. Exports `sanityClient`, `urlFor()`, `getYouTubeID()`, `getFileUrl()`, and the typed `sanityFetch<T>()`.
- **Queries:** all GROQ lives in `src/sanity/lib/queries.ts`. Add new queries there rather than inline, so projections stay consistent and typeable.
- **Types:** `src/sanity/lib/types.ts` mirrors query shapes.
- **Studio:** `sanity.config.ts` mounts the Studio at `basePath: '/studio'` and defines the desk structure (grouped document lists + the `recruitment-config` singleton). The catch-all route `app/studio/[[...tool]]/page.tsx` renders it.
- **Content types** are documented field-by-field in [CONTENT-MODEL.md](CONTENT-MODEL.md).

---

## 6. Styling & Theming

- **Tailwind v4** is configured CSS-first in `src/app/globals.css` (design tokens like surface/divider/text colors and the orange accent), not a JS config file.
- **Design rule:** white/black surfaces with **orange** (`#f05a00` light / `#ff6b1a` dark) as the *only* accent — used for primary buttons, active nav, stat numbers, the announcement bar, tags, and section accent lines.
- **Fonts:** Cabinet Grotesk (headings), Satoshi (body), JetBrains Mono (specs/code).
- **Theme:** `ThemeProvider` (next-themes) defaults to system preference. `ThemeLogo` swaps light/dark logo assets after mount (renders a sized placeholder pre-mount to avoid layout shift); both sources are optional with graceful fallback.

---

## 7. Notable Config

- **`next.config.mjs`** — allows images from `cdn.sanity.io` and `img.youtube.com`; sets `X-Frame-Options: SAMEORIGIN` on `/studio/*` so the Studio loads in a same-origin iframe.
- **`vercel.json`** — pins `framework: "nextjs"` so Vercel uses `.next` output handling (the project had been misconfigured to look for a `dist/` directory).

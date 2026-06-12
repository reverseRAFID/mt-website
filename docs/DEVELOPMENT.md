# Development Guide

Local setup, conventions, the branching/PR workflow, and how to do common tasks.

---

## Prerequisites

- **Node.js 20+** (CI uses 20; works on 24)
- npm
- A Sanity project id + dataset (ask the current team lead, or create your own at sanity.io)

---

## Setup

```bash
git clone https://github.com/reverseRAFID/mt-website.git
cd mt-website
npm install
cp .env.local.example .env.local     # fill in values
npm run dev
```

- App → http://localhost:3000
- Studio → http://localhost:3000/studio

If `/studio` shows a CORS error, add `http://localhost:3000` to your Sanity project's
**API → CORS Origins** (see [DEPLOYMENT.md](DEPLOYMENT.md#sanity-setup)).

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | **Yes** | Site renders against a placeholder without it (reads 404) |
| `NEXT_PUBLIC_SANITY_DATASET` | **Yes** | Usually `production` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | OG/canonical URLs |
| `SANITY_API_TOKEN` | Only for write testing | Editor token; server-only |
| `DATABASE_URL` | Only to test `/api/apply` | Neon connection string; server-only |

`.env.local` is gitignored — never commit it.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build — **runs ESLint + type-check**; mirrors what fails CI |
| `npm start` | Serve the built output |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type-check (CI gate) |

> Before pushing, run `npm run build` locally. ESLint errors (e.g. unused imports)
> are **fatal** to `next build`, so a clean local build is the best pre-push check.

---

## Project conventions

- **Server Components by default.** Only add `'use client'` when you need state, effects, or browser APIs (e.g. the apply form, theme toggle, announcement bar).
- **All GROQ lives in `src/sanity/lib/queries.ts`.** Don't inline queries in pages — add a named query there and a matching type in `types.ts`.
- **Fetch via `sanityFetch<T>(QUERY, params, revalidate)`** so ISR caching stays consistent. Listing/home pages use ~30s; default is 60s.
- **Images:** use `next/image` with `urlFor(source)` for Sanity assets. New external image hosts must be allow-listed in `next.config.mjs`.
- **Styling:** Tailwind v4 utility classes + the design tokens in `globals.css`. Keep orange as the only accent (see [ARCHITECTURE.md §6](ARCHITECTURE.md#6-styling--theming)).
- **Helpers:** `cn()`, `formatDate()`, `estimateReadTime()` in `src/lib/utils.ts`.
- **Env access:** server-only secrets (`DATABASE_URL`, `SANITY_API_TOKEN`) must never be read in client components or prefixed `NEXT_PUBLIC_`.

---

## Common tasks

### Add a new page
1. Create `src/app/<route>/page.tsx` (a Server Component).
2. If it needs CMS data, add a query to `queries.ts` + type to `types.ts`, then `sanityFetch()` it.
3. Wrap content in `PageLayout` for consistent nav/footer.
4. Add a nav entry in `src/components/layout/Navbar.tsx` if it's top-level.

### Add a new Sanity field or content type
1. Edit/add a schema in `src/sanity/schemas/` (register new types in `index.ts`).
2. Add it to the desk structure in `sanity.config.ts` if it's a new document type.
3. Update the relevant GROQ projection in `queries.ts` and the type in `types.ts`.
4. Restart `npm run dev`; the change appears at `/studio`.
5. Document the change in [CONTENT-MODEL.md](CONTENT-MODEL.md).

### Add a new section component
Put it in `src/components/sections/`, keep it a Server Component unless it needs interactivity, and pass already-fetched data in as props (fetch in the page, not the section).

---

## Branching & PRs

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production | Live site (auto) |
| `develop` | Staging | Vercel preview URL |
| `feature/<name>` | A single feature/fix | — (PR into `develop`) |

Workflow:
1. Branch off `develop`: `git checkout -b feature/my-thing`.
2. Commit small, run `npm run build` before pushing.
3. Open a PR into `develop`. **At least 1 review** before merging toward `main`.
4. Promote `develop` → `main` to release.

> CI runs a type-check on every push to `main`/`develop` and deploys. Keep `tsc --noEmit` green.

---

## Gotchas

- **Build needs the Sanity env vars** — pages prerender against the dataset. A missing `NEXT_PUBLIC_SANITY_PROJECT_ID` causes a 404/placeholder build failure.
- **`/api/apply` needs `DATABASE_URL` at runtime** but **not at build time** (the Neon client is lazy via `getSql()`). Locally, the form 500s until you set a real connection string.
- **One Sanity client:** import from `src/sanity/lib/client.ts` (the single source). Don't reintroduce a duplicate client under `src/lib/`.
- **Windows shells:** prefer git-bash for `vercel`/`gh` CLI work; PowerShell pipes append `\r` which corrupts piped values (see [DEPLOYMENT.md](DEPLOYMENT.md#adding-env-vars-via-cli--important-gotcha)).

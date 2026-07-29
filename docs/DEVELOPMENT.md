# Development Guide

Local setup, conventions, the branching/PR workflow, and how to do common tasks.

---

## Prerequisites

- **Node.js 20.9+** (Next 16 minimum; works on 24)
- npm
- **Docker**, for the local MongoDB

---

## Setup

```bash
git clone https://github.com/reverseRAFID/mt-website.git
cd mt-website
npm install
cp .env.local.example .env.local     # fill in values — see below
npm run db:up                        # MongoDB replica set on :27017
npm run dev
```

- Site → http://localhost:3000
- Admin → http://localhost:3000/admin

The first time you open `/admin` it asks you to create an account. That first
account is forced to the `admin` role; everyone after it defaults to `editor`
and only an admin can promote them.

An empty database is a working site — every page renders its empty state. To
work with real content, either add some in the admin or run the Sanity import
(see [the migration script](../scripts/migrate-from-sanity.ts)).

### Why MongoDB runs as a replica set

`docker-compose.yml` starts a single-node **replica set**, not a standalone
`mongod`. Placing an order reserves stock and writes the order in one
transaction, and a standalone server refuses to start one. Against a standalone
database every page would load and every checkout would fail — and you would
only find out in production.

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URI` | **Yes** | Must be a replica set. `npm run db:up` gives you one. |
| `PAYLOAD_SECRET` | **Yes** | Signs admin sessions. Generate one; do not share it between environments. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | **Must match the environment.** Payload builds upload URLs from it — a dev server set to the production URL renders `<img>` tags pointing at images that only exist in production. |
| `CLOUDINARY_URL` | Production | File storage and image delivery. Without it uploads go to `./uploads` — right locally, wrong on Vercel. |
| `RESEND_API_KEY` | Optional | Order emails. Unset means orders are still taken and flagged `emailStatus: skipped`. |

`.env.local` is gitignored — never commit it.

---

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the built output |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` — the CI gate |
| `npm run db:up` / `db:down` | Start / stop MongoDB |
| `npm run generate:types` | Regenerate `src/payload-types.ts` — **run after every collection change** |
| `npm run generate:importmap` | Regenerate the admin import map (only needed for custom admin components) |
| `npm run check:privacy` | Static privacy guards (see [privacy-runbook.md](privacy-runbook.md)) |
| `npm run test:shop` | End-to-end access + checkout test against a running server |
| `npm run test:cloudinary` | Cloudinary URL construction — pure functions, no account needed |
| `npm run reupload:media` | Move locally-stored uploads to Cloudinary, in place |
| `npm run migrate:sanity` | One-off import from the old Sanity dataset |

> `next build` no longer runs ESLint (Next 16 removed that). Run
> `npm run lint && npm run typecheck` before pushing — CI does.

---

## Project conventions

- **Server Components by default.** Add `'use client'` only for state, effects
  or browser APIs.
- **All CMS reads live in `src/lib/cms/`.** Don't call `getPayload()` from a
  page — add a named function there. `content.ts` for public content,
  `shop.ts`, `donations.ts`, `recruitment.ts` for their domains, `orders.ts`
  (in `src/lib/`) for anything touching an order.
- **Cache reads with `cachedRead`,** which tags by collection and is busted by
  the collection's `afterChange` hook. Anything that must be fresh — stock at
  checkout, the shop and campaign gates, order lookups — reads uncached, and
  says why in a comment.
- **Never return a private field from inside a cached function.** The return
  value is written to Next's data cache on disk. Map to the public shape
  *inside* the cached function, not after it.
- **Images:** `next/image` with the media document's own `url` (via
  `media()` / `imageProps()`). Sizing is a Cloudinary transformation built by
  `cldUrl()` — nothing is generated at upload, so any size is free and a design
  change costs nothing. `next/image` delegates to Cloudinary through the custom
  loader rather than resizing itself.
- **Relationships are `string | Doc`** depending on query depth. Narrow with
  `rel()` / `rels()` and decide what an unpopulated one should look like —
  usually "do not render this row".
- **Styling:** Tailwind v4 + the tokens in `globals.css`. Orange is the only
  accent (see [ARCHITECTURE.md](ARCHITECTURE.md)).

---

## Common tasks

### Add a page
1. Create `src/app/(frontend)/<route>/page.tsx` as a Server Component.
2. If it needs CMS data, add a read function to `src/lib/cms/content.ts`.
3. Wrap in `PageLayout`; add a nav entry in `Navbar.tsx` if it is top-level.

### Add a field or a collection
1. Edit or add a file in `src/payload/collections/` (register new ones in
   `payload.config.ts`).
2. Give it explicit `access` for all four operations — `npm run check:privacy`
   fails otherwise, and "what happens if I forget" must never be a question.
3. `npm run generate:types`.
4. Update the read function in `src/lib/cms/` and the docs in
   [CONTENT-MODEL.md](CONTENT-MODEL.md).

### Add a section component
Put it in `src/components/sections/`, keep it a Server Component unless it needs
interactivity, and pass already-fetched data in as props — fetch in the page,
not the section.

---

## Branching & PRs

| Branch | Purpose | Deploys to |
|---|---|---|
| `main` | Production | Live site (auto) |
| `feature/<name>` | A single feature or fix | Vercel preview |

Branch off `main`, commit small, run `lint` + `typecheck` before pushing, and
open a PR with at least one review.

---

## Gotchas

- **A stale cache survives a dev restart.** `cachedRead` writes to
  `.next/dev/cache`, so changing `NEXT_PUBLIC_SITE_URL` (or anything else that
  changes what a read *returns* rather than what it queries) needs
  `rm -rf .next`. This will waste your afternoon exactly once.
- **`npm run generate:types` after every collection change.** The generated
  types are what every read function is checked against; a stale file produces
  errors that point everywhere except the collection you edited.
- **Do not `pkill -f "next dev"`** — the pattern matches the shell running it
  and kills your own script mid-command. Match `next-server` instead.
- **Order effects run inside the caller's transaction.** If you add work to the
  `orders` afterChange hook, pass `req` to any Payload write and
  `existingTransactionID` to anything doing raw Mongo. Opening a second
  transaction against the same document deadlocks against the first.

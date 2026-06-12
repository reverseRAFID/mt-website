# BRACU Mongol-Tori Website

Production team website for **BRACU Mongol-Tori**, BRAC University's Mars Rover Team.
A content-managed, statically-rendered site built to survive yearly team handovers.

**Live:** https://mt-website-liart.vercel.app · **Studio (CMS):** https://mt-website-liart.vercel.app/studio

**Stack:** Next.js 15 (App Router) · React 19 · Sanity v3 CMS · Tailwind CSS v4 · Neon (Serverless Postgres) · Vercel

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
npm run dev
```

- App → http://localhost:3000
- CMS Studio → http://localhost:3000/studio

> **Minimum to boot:** `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET`.
> Without them the site renders against a placeholder project and Sanity reads return 404s.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack-free `next dev`) |
| `npm run build` | Production build (`next build`) — runs ESLint + type-check |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint only |
| `npx tsc --noEmit` | Type-check only (also gated in CI) |

---

## Environment Variables

Copy `.env.local.example` → `.env.local`. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#environment-variables) for the full table.

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | **Yes** | Sanity project id (from sanity.io/manage) |
| `NEXT_PUBLIC_SANITY_DATASET` | **Yes** | Usually `production` |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical/OG URL |
| `SANITY_API_TOKEN` | For writes | Editor token (server-side use) |
| `DATABASE_URL` | For the apply form | Neon Postgres connection string |

`NEXT_PUBLIC_*` vars are baked into the client bundle at build time and are **not** secret.
`SANITY_API_TOKEN` and `DATABASE_URL` are server-only secrets.

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, directory layout, rendering/ISR strategy, data flow, key modules |
| [docs/CONTENT-MODEL.md](docs/CONTENT-MODEL.md) | Every Sanity schema, its fields, and how content types relate |
| [docs/CONTENT-EDITING.md](docs/CONTENT-EDITING.md) | Editor's guide to the `/studio` CMS (for non-developers) |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + GitHub Actions deploy, env/secrets setup, troubleshooting |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, branching/PR workflow, conventions, common tasks |

---

## Project Layout (top level)

```
src/
├─ app/            Next.js App Router — pages, /api routes, /studio mount
├─ components/     layout/ (nav, footer, announcement), sections/, ui/
├─ sanity/         schemas/ (content types), lib/ (client, queries, types)
├─ lib/            db.ts (Neon), utils.ts
└─ providers/      ThemeProvider (light/dark)
sanity.config.ts   Studio config + desk structure
vercel.json        Pins framework = nextjs
.github/workflows/ deploy.yml (GitHub Actions → Vercel)
```

Full breakdown in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Deployment (summary)

Production is on **Vercel** (project `mt-website`). Two paths exist:

1. **GitHub Actions → Vercel CLI** (intended CI): push to `main` deploys production, `develop` deploys a preview. Requires repo secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`.
2. **Direct CLI** (`npx vercel --prod`): manual deploy from a linked machine.

Full instructions, secret setup, and a troubleshooting log of issues already solved are in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production (auto-deploy) |
| `develop` | Staging (preview URL) |
| `feature/*` | Feature work — PR into `develop` |

PRs should get **1 review** before merging to `main`. Details in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#branching--prs).

---

## Yearly Handover

- Transfer the **Vercel** project (account tied to `mongoltori.web@g.bracu.ac.bd`).
- Add the new team lead to the **Sanity** project at sanity.io/manage.
- Re-issue secrets (`VERCEL_TOKEN`, `SANITY_API_TOKEN`, `DATABASE_URL`) on the new machine — never commit them.
- Hand over the GitHub repository ownership/access.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#yearly-handover-checklist) for the full checklist.

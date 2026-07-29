# BRACU Mongol-Tori Website

Production team website for **BRACU Mongol-Tori**, BRAC University's Mars Rover Team.
A content-managed, statically-rendered site built to survive yearly team handovers.

**Live:** https://mt-website-liart.vercel.app · **Admin (CMS):** https://mt-website-liart.vercel.app/admin

**Stack:** Next.js 16 (App Router) · React 19 · Payload 3 CMS · MongoDB · Tailwind CSS v4 · Vercel

---

## Quick Start

```bash
npm install
cp .env.local.example .env.local   # then fill in the values (see below)
npm run db:up                      # MongoDB (Docker) — a single-node replica set
npm run dev
```

- Site → http://localhost:3000
- Admin → http://localhost:3000/admin (first visit creates the first account)

> **Minimum to boot:** `DATABASE_URI` and `PAYLOAD_SECRET`. An empty database is
> a working site — every page renders its empty state.
>
> The database must be a **replica set**, which `npm run db:up` gives you.
> Checkout reserves stock and writes the order in one transaction, and a
> standalone `mongod` cannot start one.

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (Turbopack) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` — the CI gate |
| `npm run db:up` / `db:down` | Start / stop the local MongoDB |
| `npm run generate:types` | Regenerate `src/payload-types.ts` after a collection change |
| `npm run check:privacy` | Static privacy and access guards |
| `npm run test:shop` | End-to-end access + checkout test against a running server |

---

## Environment Variables

Copy `.env.local.example` → `.env.local`. See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md#environment-variables) for the full table.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URI` | **Yes** | MongoDB. Must be a replica set. |
| `PAYLOAD_SECRET` | **Yes** | Signs admin sessions. Unique per environment. |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | Canonical/OG URLs **and every upload URL** — must match the environment it runs in. |
| `CLOUDINARY_URL` | Production | File storage **and** image delivery. Without it uploads go to local disk and vanish on the next deploy. |
| `RESEND_API_KEY` | Optional | Order emails. Orders are still taken without it. |

`NEXT_PUBLIC_*` vars are baked into the client bundle at build time and are **not** secret.
Everything else is a server-only secret.

---

## Documentation

| Doc | Contents |
|---|---|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Tech stack, directory layout, rendering/ISR strategy, data flow, key modules |
| [docs/CONTENT-MODEL.md](docs/CONTENT-MODEL.md) | Every collection, its fields, and how content types relate |
| [docs/CONTENT-EDITING.md](docs/CONTENT-EDITING.md) | Editor's guide to the `/admin` CMS (for non-developers) |
| [docs/privacy-runbook.md](docs/privacy-runbook.md) | What must never be published, and the two controls that keep it that way |
| [docs/shop-runbook.md](docs/shop-runbook.md) | Running the merch shop: orders, stock, email, retention |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + GitHub Actions deploy, env/secrets setup, troubleshooting |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Local setup, branching/PR workflow, conventions, common tasks |

---

## Project Layout (top level)

```
src/
├─ app/(frontend)/ The website — pages and /api routes
├─ app/(payload)/  The admin (/admin) and CMS REST API (/payload-api)
├─ payload/        collections/, globals/, fields/, access/, hooks/
├─ lib/cms/        The read layer — the only place that talks to the CMS
├─ lib/            orders.ts (checkout), domain constants, utils
├─ components/     layout/, sections/, ui/, rover/, shop/, support/, team/
└─ providers/      ThemeProvider (light/dark)
payload.config.ts  CMS root config
docker-compose.yml Local MongoDB
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
- Create a CMS account for the new team lead at `/admin` and give them `admin`.
- Re-issue secrets (`VERCEL_TOKEN`, `PAYLOAD_SECRET`, `RESEND_API_KEY`) — never commit them.
- Transfer the **MongoDB Atlas** cluster and rotate the database password.
- Hand over the GitHub repository ownership/access.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#yearly-handover-checklist) for the full checklist.

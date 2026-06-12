# BRACU Mongol-Tori Website

Production-grade team website for BRACU Mongol-Tori, BRAC University's Mars Rover Team.

**Stack:** Next.js 15 · Sanity v3 CMS · Tailwind v4 · Neon Postgres · Vercel

---

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # fill in Sanity + DB credentials
npm run dev
```

- App: http://localhost:3000  
- CMS Studio: http://localhost:3000/studio

---

## Environment Variables

See `.env.local.example`. Key variables:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | From sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | Usually `production` |
| `SANITY_API_TOKEN` | Editor token from Sanity |
| `DATABASE_URL` | Neon Postgres connection string |

---

## Sanity CMS First-Time Setup

1. Create a project at [sanity.io](https://sanity.io)
2. Copy Project ID + Dataset into `.env.local`
3. **API → CORS Origins** → add `http://localhost:3000` + production domain
4. **API → Tokens** → create Editor token → add to `SANITY_API_TOKEN`
5. Visit `/studio` to start adding content

---

## Deployment

Uses **GitHub Actions → Vercel CLI** (workaround for Vercel Hobby + GitHub Org repos).

### One-time setup

1. Run `npx vercel` locally to link the project and get Org ID + Project ID
2. Add these as GitHub repository secrets:

| Secret | Value |
|---|---|
| `VERCEL_TOKEN` | vercel.com/account/tokens |
| `VERCEL_ORG_ID` | From `npx vercel` |
| `VERCEL_PROJECT_ID` | From `npx vercel` |

Push to `main` → auto-deploys. Push to `develop` → Vercel preview URL.

---

## Branching

| Branch | Purpose |
|---|---|
| `main` | Production (auto-deploy) |
| `develop` | Staging (preview URL) |
| `feature/xxx` | Feature work — PR to `develop` |

PRs require 1 review before merging to `main`.

---

## Yearly Handover

- Hand over Vercel account tied to `mongoltori.web@g.bracu.ac.bd`
- Add new team lead to Sanity project at sanity.io/manage
- Copy `.env.local` secrets to the new machine

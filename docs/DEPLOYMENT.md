# Deployment

How this site is deployed, the env/secret setup it needs, and a troubleshooting
log of problems already solved (read this before re-debugging a failed deploy).

---

## Current state

| Thing | Value |
|---|---|
| Live URL | https://mt-website-liart.vercel.app |
| Vercel project | `mt-website` (team `mongol-tori-s-projects`) |
| GitHub repo | `reverseRAFID/mt-website` (private) |
| Production branch | `main` |
| Org/Project IDs | in `.vercel/project.json` (gitignored) |

> The repo currently lives under a personal GitHub account rather than the
> `bracu-mongol-tori` org (the org wasn't accessible at setup time). Transferring
> ownership to the team org is a future handover step.

---

## Two ways to deploy

### A. Direct Vercel CLI (manual)
From a machine that's logged in (`npx vercel login`) and linked (`.vercel/` present):

```bash
npx vercel            # deploy a preview
npx vercel --prod     # deploy production
npx vercel --prod --force   # bypass build cache (use after changing env vars)
```

`--force` matters: Vercel keys its build cache on *source*, not env vars, so after
adding/fixing an env var you must `--force` or it reuses the previous (failed) build.

### B. GitHub Actions → Vercel CLI (CI)
`.github/workflows/deploy.yml` runs on push:

- push to **`main`** → production deploy (`--prod`)
- push to **`develop`** → preview deploy

The workflow checks out, `npm ci`, runs `npx tsc --noEmit`, then deploys via
`amondnet/vercel-action`. It needs three repo secrets (below).

---

## Environment variables (on Vercel)

Set these in **Vercel → Project → Settings → Environment Variables**, or via CLI.
Public (`NEXT_PUBLIC_*`) vars are required at **build** time because pages prerender against Sanity.

| Variable | Scope | Required for |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | all envs | **Build** — without it, prerender hits a `replace-me` placeholder and 404s |
| `NEXT_PUBLIC_SANITY_DATASET` | all envs | **Build** (usually `production`) |
| `NEXT_PUBLIC_SITE_URL` | all envs | OG/canonical URLs |
| `SANITY_API_TOKEN` | production | Server-side Sanity writes (Editor token) |
| `DATABASE_URL` | production | The recruitment form `/api/apply` (Neon) |

Currently set on the project: the three `NEXT_PUBLIC_*` vars (production + development).
**Not yet set:** `SANITY_API_TOKEN` and `DATABASE_URL` — the form will return 500 until `DATABASE_URL` is added.

### Adding env vars via CLI — important gotcha
Set the value from a shell that does **not** append a carriage return. On Windows, use **git-bash**, not PowerShell:

```bash
# git-bash — correct:
printf '%s\n' 'aslda7ok' | npx vercel env add NEXT_PUBLIC_SANITY_PROJECT_ID production
```

- **PowerShell `"value" | vercel env add`** appends `\r`, storing `aslda7ok\r`, which fails the build with `projectId can only contain a-z, 0-9 and dashes`.
- CLI-added vars are stored **write-only / sensitive**, so `vercel env pull` shows them as empty (`=""`). **That does not mean they're unset** — the build can still read them. Verify by deploying, not by pulling.

---

## GitHub Actions secrets

Set under **GitHub → repo → Settings → Secrets and variables → Actions**, or with `gh`:

| Secret | Source | Status |
|---|---|---|
| `VERCEL_ORG_ID` | `.vercel/project.json` → `orgId` | ✅ set |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` → `projectId` | ✅ set |
| `VERCEL_TOKEN` | vercel.com/account/tokens | ❌ **must be added** |

```bash
# requires gh authenticated with repo scope:
printf '%s' 'team_xxx' | gh secret set VERCEL_ORG_ID
printf '%s' 'prj_xxx'  | gh secret set VERCEL_PROJECT_ID
printf '%s' 'vercel_token_here' | gh secret set VERCEL_TOKEN
```

Until `VERCEL_TOKEN` exists, the Actions workflow will fail — but direct CLI deploys still work.

---

## First-time Vercel link (new machine)

```bash
npx vercel login
npx vercel link        # select the mongol-tori team + mt-website project
# this regenerates .vercel/project.json (gitignored)
```

---

## Sanity setup

1. Project lives at [sanity.io/manage](https://www.sanity.io/manage) (project id `aslda7ok`, dataset `production`).
2. **API → CORS Origins:** add `http://localhost:3000` **and** the production domain (e.g. `https://mt-website-liart.vercel.app` / custom domain) — otherwise `/studio` can't talk to the dataset.
3. **API → Tokens:** create an **Editor** token → set as `SANITY_API_TOKEN` (only needed for server-side writes).

---

## Troubleshooting log (already-solved issues)

These were hit during initial deployment. If a build fails, check here first.

| Symptom | Cause | Fix |
|---|---|---|
| `No database connection string was provided to neon()` during *Collecting page data* | Neon client was created at module import; `DATABASE_URL` unset on the build runner | `src/lib/db.ts` now creates the client lazily via `getSql()` |
| `Dataset "production" not found for project ID "replace-me"` during *Generating static pages* | `NEXT_PUBLIC_SANITY_PROJECT_ID` not set on Vercel → fell back to placeholder | Set the `NEXT_PUBLIC_*` Sanity vars on Vercel |
| `projectId can only contain a-z, 0-9 and dashes` | Env value had a trailing `\r` from PowerShell piping | Re-add via git-bash `printf '%s\n'` |
| `No Output Directory named "dist" found` after a successful build | Vercel project's framework preset was wrong | `vercel.json` pins `"framework": "nextjs"` |
| Redeploy "succeeds" instantly with no build, still broken | Build cache reused after only env (not source) changed | Redeploy with `--force` |
| Build fails on `'X' is defined but never used` | ESLint errors are fatal in `next build` | Remove unused imports / fix before pushing |

---

## Verifying a deploy

```bash
npx vercel ls mt-website --prod          # list prod deployments + status
curl -s -o /dev/null -w '%{http_code}' https://mt-website-liart.vercel.app
```

Expect `200` for `/`, `/about`, and `/studio`.

---

## Yearly handover checklist

- [ ] Transfer the **Vercel** project to the team account (`mongoltori.web@g.bracu.ac.bd`).
- [ ] Transfer the **GitHub** repo to the team / `bracu-mongol-tori` org.
- [ ] Add the new lead to the **Sanity** project at sanity.io/manage.
- [ ] Re-issue and set secrets on the new owner: `VERCEL_TOKEN`, `SANITY_API_TOKEN`, `DATABASE_URL`.
- [ ] Update Sanity **CORS origins** if the domain changes.
- [ ] Confirm `.env.local` is recreated on the new machine (never committed).
- [ ] **Revoke** any personal tokens used by the previous lead.

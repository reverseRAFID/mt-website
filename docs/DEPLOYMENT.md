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

The workflow (`.github/workflows/deploy.yml`) runs on **Node 24**, then:
`npm install` → `npx tsc --noEmit` → install `vercel@latest` → `vercel deploy`
(`--prod` on `main`, preview on `develop`). It needs three repo secrets (below).

> **Why `npm install`, not `npm ci`, and not the old `amondnet/vercel-action`** —
> see the troubleshooting log below. Both were deliberate fixes, not oversights.

---

## Environment variables (on Vercel)

Set these in **Vercel → Project → Settings → Environment Variables**, or via CLI.
`DATABASE_URI` is needed at **build** time as well as at runtime, because pages
prerender against the database.

| Variable | Scope | Required for |
|---|---|---|
| `DATABASE_URI` | all envs | **Build and runtime.** A MongoDB Atlas URI. Must be a replica set — every Atlas tier is. |
| `PAYLOAD_SECRET` | all envs | Signs admin sessions. Different value per environment. |
| `NEXT_PUBLIC_SITE_URL` | all envs | Canonical URLs, OG images, **and the URL of every uploaded file**. Must be the origin *that environment* answers on — a preview deploy pointing at the production URL serves production's images. |
| `CLOUDINARY_URL` | all envs | **File storage and image delivery. Not optional.** See below. |
| `RESEND_API_KEY` | production | Order and status emails. Optional by design. |
| `SHOP_FROM_EMAIL` | production | The From address; its domain must be verified in Resend. |

### Cloudinary is not optional

Without credentials, Payload writes uploads to the local filesystem. On Vercel
that filesystem is **ephemeral**: uploads succeed, images appear, and then the
next deploy replaces the container and every one of them 404s. There is no error
to notice — you find out when somebody looks at the site.

Copy the **API Environment variable** from the Cloudinary dashboard
(`cloudinary://key:secret@cloud_name`) into `CLOUDINARY_URL`, or set
`CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET`
separately.

Cloudinary is also the image pipeline, not just storage: nothing is resized at
upload, every size is a URL transformation, and `next/image` delegates to it
through a custom loader. That means **no Vercel image-optimisation usage at
all**, and it is why `images.remotePatterns` is absent from `next.config.mjs`.

If files were uploaded before Cloudinary was configured, `npm run reupload:media`
moves them across in place, keeping every document id and therefore every
relationship pointing at them.

### MongoDB

Use MongoDB Atlas. Any tier works — all of them are replica sets, which is what
the checkout transaction needs. Allow Vercel's egress in **Atlas → Network
Access** (`0.0.0.0/0` if you are not using a static-IP integration) and give the
database user `readWrite` on the app's database only.

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
| `VERCEL_TOKEN` | vercel.com/account/tokens | ✅ set |

All three are set and the Actions pipeline deploys green end-to-end. Re-issue
`VERCEL_TOKEN` at handover (see checklist).

```bash
# requires gh authenticated with repo scope:
printf '%s' 'team_xxx' | gh secret set VERCEL_ORG_ID
printf '%s' 'prj_xxx'  | gh secret set VERCEL_PROJECT_ID
printf '%s' 'vercel_token_here' | gh secret set VERCEL_TOKEN
```

If `VERCEL_TOKEN` is ever removed/expired, the Actions deploy step fails — but direct CLI deploys still work.

---

## First-time Vercel link (new machine)

```bash
npx vercel login
npx vercel link        # select the mongol-tori team + mt-website project
# this regenerates .vercel/project.json (gitignored)
```

---

## First deploy of a new environment

1. Set the env vars above.
2. Deploy.
3. Open `/admin`. The first visit offers to create an account, and that first
   account is forced to the `admin` role. **Do this immediately after the first
   deploy** — until somebody claims it, anyone who finds the URL can.
4. Fill in the three globals under **Settings**: Shop, Crowdfunding,
   Recruitment. All three default to `closed`, so nothing accepts submissions
   until you open it deliberately.

There is no CORS list to maintain and no separate CMS project to invite people
to: the admin is part of this application and its users live in this database.

---

## Troubleshooting log (already-solved issues)

These were hit during initial deployment. If a build fails, check here first.

| Symptom | Cause | Fix |
|---|---|---|
| `No database connection string was provided to neon()` during *Collecting page data* | Neon client was created at module import; `DATABASE_URL` unset on the build runner | `src/lib/db.ts` now creates the client lazily via `getSql()` |
| `projectId can only contain a-z, 0-9 and dashes` | Env value had a trailing `\r` from PowerShell piping | Re-add via git-bash `printf '%s\n'` |
| Images 404 after a deploy that changed nothing | Cloudinary is unconfigured, so uploads went to the ephemeral filesystem and the deploy replaced it | Set the credentials, then `npm run reupload:media` |
| Images load but are never resized (full-size originals over the wire) | `cldTransform` is not matching the URL — check it really is a `res.cloudinary.com` URL with an `/upload/` segment | `npm run test:cloudinary` |
| Every checkout fails with "could not confirm stock" while pages load fine | `DATABASE_URI` points at a standalone `mongod`, which cannot start the reservation transaction | Use a replica set (Atlas always is) |
| `No Output Directory named "dist" found` after a successful build | Vercel project's framework preset was wrong | `vercel.json` pins `"framework": "nextjs"` |
| Redeploy "succeeds" instantly with no build, still broken | Build cache reused after only env (not source) changed | Redeploy with `--force` |
| **CI** `npm ci` fails: `Missing: @emnapi/runtime@1.11.0 from lock file` | `package-lock.json` is generated on Windows, where npm omits Linux-only wasm transitive optional deps (pulled by `@tailwindcss/oxide-wasm32-wasi`). `npm ci` is strict and rejects this on the Linux runner (any npm version). Local Windows npm won't add them, even with `--os=linux`. | Workflow uses `npm install --no-audit --no-fund` instead of `npm ci` (Vercel's build does the same) |
| **CI** deploy step fails: `Your Vercel CLI version is outdated. This endpoint requires version 47.2.2 or later` | `amondnet/vercel-action@v25` bundles Vercel CLI 25.x, which Vercel's API now rejects | Workflow installs `vercel@latest` and runs `vercel deploy` directly instead of the action |
| Build fails on `'X' is defined but never used` | ESLint errors are fatal in `next build` | Remove unused imports / fix before pushing |

---

## Verifying a deploy

```bash
npx vercel ls mt-website --prod          # list prod deployments + status
curl -s -o /dev/null -w '%{http_code}' https://mt-website-liart.vercel.app
```

Expect `200` for `/`, `/about`, and `/admin`.

Then run the end-to-end checks against it:

```bash
BASE_URL=https://your-deployment npm run test:shop
```

Without `ADMIN_PASSWORD` it runs the access assertions only, which is the safe
thing to do against production — it creates no data.

---

## Yearly handover checklist

- [ ] Transfer the **Vercel** project to the team account (`mongoltori.web@g.bracu.ac.bd`).
- [ ] Transfer the **GitHub** repo to the team / `bracu-mongol-tori` org.
- [ ] Create a CMS account for the new lead at `/admin` and give them `admin`.
- [ ] Re-issue and set secrets on the new owner: `VERCEL_TOKEN`, `PAYLOAD_SECRET`, `RESEND_API_KEY`.
- [ ] Transfer or re-create the **MongoDB Atlas** cluster; rotate the database user's password.
- [ ] **Deactivate the departing lead's CMS account** — the data lives in your database now, not a third party's.
- [ ] Confirm `.env.local` is recreated on the new machine (never committed).
- [ ] **Revoke** any personal tokens used by the previous lead.

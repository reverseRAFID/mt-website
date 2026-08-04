# Privacy Runbook

Operational notes for the data this site holds about real people: recruitment
applicants and crowdfunding donors.

---

## 1. Every collection declares its own access

**This is the single control everything else rests on.**

Under Sanity this section said "the dataset must stay private", because a
public Sanity dataset serves every field of every document to anyone who asks,
and the projections in this repo were irrelevant to that — an attacker writes
their own query.

That whole class of problem is gone. There is no shared dataset and no public
query API: the database is reachable only by this application, and the only
HTTP surface is `/payload-api`, where every collection declares explicit
`access` for all four operations. `orders`, `donations`, `applications` and
`users` answer 403 to anyone who is not signed in.

The risk moved rather than disappearing. It is now "somebody adds a collection
and forgets the access block", which is why forgetting is a build failure.

### Verify it

```bash
npm run check:privacy      # static: every collection declares all four ops
npm run test:shop          # live: the private collections actually answer 403
```

`test:shop` runs its access assertions without `ADMIN_PASSWORD`, so it is safe
to point at production — it creates nothing.

### Fix it

Add the missing `access` block to the collection in
`src/payload/collections/`, using a name from `src/payload/access/index.ts`
rather than an inline function — `anyone`, `staff`, `adminOnly`, `nobody`.

### Access control does not protect the site from itself

Worth knowing before you rely on it: the site reads its own database through
Payload's **Local API**, which runs with `overrideAccess: true`. Collection and
field access rules do not apply to it, and they are not supposed to — that is
this application reading its own data, not a request from outside.

So there are two separate controls doing two separate jobs:

| Control | Protects against | Where |
|---|---|---|
| `access` on the collection | Someone querying `/payload-api` directly | `src/payload/collections/*` |
| `select` on the read | The site fetching a private field into a page | `src/lib/cms/*`, `src/lib/orders.ts` |

Neither substitutes for the other. A page that fetches a donor's phone number
publishes it, however locked-down the collection is — see §2.

---

## 2. What must never be published

`src/payload/collections/Donations.ts` says this at the top of the file for
exactly this reason. These must never be fetched into anything that reaches a
browser:

| Field | Why |
|---|---|
| `amount` | The whole point. Rank is public; the figure is not. |
| `senderAccount` | Donor's own wallet/bank number. |
| `transactionId` | Correlatable with a bank statement. |
| `contactEmail`, `contactPhone` | Direct PII. |
| `donorName` **when `isAnonymous`** | Publishing it defeats the donor's explicit choice. |
| `adminNotes`, `rejectionReason`, `verifiedBy` | Internal judgements about a person. |

The public read lives in `src/lib/cms/donations.ts`. Its `PUBLIC_SELECT` asks
for `donorName`, `isAnonymous`, `affiliation`, `message`, `approvedAt` and
nothing else, and what it *returns* is narrower still.

**How rank stays honest without publishing the amount:** the query sorts
`['-amount', 'approvedAt', 'createdAt']` inside MongoDB and does not select
`amount`. Rows arrive already in rank order and are numbered by array position.
Sorting by a field you do not select is the whole trick; the figure never
leaves the database.

**How anonymity is enforced:** in `toPublic()`, on the server, before anything
is returned. GROQ could do this inside the query; Payload has no query-level
conditional, so the substitution happens in TypeScript **inside the cached
read** — which means the real name exists only as a local variable in a server
module and never enters the returned shape, the data cache, or an RSC flight
chunk.

---

## 3. No aggregate figures

The site publishes a supporter **count** and nothing else numeric. No total
raised, no goal thermometer, no averages, no bands.

This is deliberate. Aggregates plus a known rank order let people do
arithmetic: with a published total, the first donor's amount *is* the total,
and each subsequent donation narrows the bounds on the ones around it.

If the team later wants a fundraising thermometer, treat it as a decision to
partially publish amounts and say so out loud to donors — do not add it as a
UI tweak.

---

## 4. Handling a donation

1. New declarations land in **Studio → Crowdfunding → Pending Verification**,
   oldest first.
2. Match `senderAccount` / `transactionId` against the bKash/Nagad/bank
   statement.
3. **Matched** → enter the verified **amount**, set **Verified At**, switch to
   ✅ Approved. The schema refuses to approve without both.
4. **Not matched** → ⛔ Rejected + a reason, and contact the donor on the email
   or phone they supplied. Rejected records are never published.
5. Approved donors appear on `/support` within ~60s (ISR revalidation).

Donor-supplied fields are read-only in the Studio on purpose: rewriting a
declaration destroys the audit trail the statement is matched against. The
public `message` is the one exception — trim anything unsuitable before
approving.

---

## 5. Retention

Nothing here expires automatically. Periodically, and at minimum at the end of
each campaign:

- Delete **rejected** donations once the donor has been told.
- Consider clearing `contactEmail` / `contactPhone` / `senderAccount` /
  `transactionId` on **approved** donations once the campaign is reconciled —
  the public listing does not need them, and the amount alone is enough for the
  treasury record.
- The same applies to `application` documents after a recruitment cycle closes.

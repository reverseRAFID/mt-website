# Privacy Runbook

Operational notes for the data this site holds about real people: recruitment
applicants and crowdfunding donors.

---

## 1. The dataset must stay PRIVATE

**This is the single control everything else rests on.**

A public Sanity dataset serves *every field of every document* to anyone who
asks — GROQ projections in this repo are irrelevant to that, because an
attacker writes their own query:

```bash
curl 'https://aslda7ok.api.sanity.io/v2024-01-01/data/query/production?query=*[_type=="donation"]'
```

On a public dataset that returns donation amounts, donor phone numbers, sender
account numbers, and the real names of donors who asked to be anonymous.

### Verify it

```bash
npm run check:privacy
```

Expected: the anonymous probe is **rejected**. If it returns data, the dataset
is public — fix it immediately.

### Fix it

1. https://www.sanity.io/manage → project `aslda7ok`
2. **Datasets** → `production` → **Visibility** → **Private**
3. Confirm `SANITY_API_TOKEN` is set in Vercel for **Production and Preview**
   (Settings → Environment Variables). Without it, a private dataset means a
   blank site.
4. Re-run `npm run check:privacy`.

### What does *not* break when it goes private

- **Images.** Sanity serves assets from `cdn.sanity.io` publicly regardless of
  dataset visibility. `next/image` and `urlFor()` keep working.
- **Server-side reads.** `readClient` in `src/sanity/lib/client.ts` is already
  tokened and is what every page uses.
- **Client components.** None of them fetch from Sanity — they only import
  `urlFor` and types. Checked, and `check:privacy` re-checks it.
- **The Studio.** `/studio` authenticates interactively.

---

## 2. What must never be published

`src/sanity/schemas/donation.ts` splits fields into groups for exactly this
reason. These must never appear in a GROQ projection that reaches a browser:

| Field | Why |
|---|---|
| `amount` | The whole point. Rank is public; the figure is not. |
| `senderAccount` | Donor's own wallet/bank number. |
| `transactionId` | Correlatable with a bank statement. |
| `contactEmail`, `contactPhone` | Direct PII. |
| `donorName` **when `isAnonymous`** | Publishing it defeats the donor's explicit choice. |
| `adminNotes`, `rejectionReason`, `verifiedBy` | Internal judgements about a person. |

The public projection lives in `APPROVED_DONATIONS_QUERY` /
`TOP_DONATIONS_QUERY` (`src/sanity/lib/queries.ts`) and selects only
`_id`, `displayName`, `affiliation`, `message`, `approvedAt`.

**How rank stays honest without publishing the amount:** Sanity performs
`order(amount desc, approvedAt asc, _createdAt asc)` internally and returns
rows *without* the amount. `src/lib/donations.ts` then numbers them by array
position. The ordering is authoritative; the figure never leaves the dataset.

**How anonymity is enforced:** in GROQ, not React —
`"displayName": select(isAnonymous == true => "Anonymous", donorName)`. The
real name is never projected, so it cannot be recovered from page source, a
hydration payload, or an RSC flight chunk.

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

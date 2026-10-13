/**
 * Rewrites retired sponsor tiers in the database: silver → tech-partner,
 * bronze → in-kind.
 *
 *   npm run migrate:sponsor-tiers          # dry run: lists what would change
 *   APPLY=1 npm run migrate:sponsor-tiers  # writes
 *
 * Optional. The `tier` field's hooks already rename these on read and before
 * validation (src/payload/collections/Sponsors.ts), so the site and admin are
 * correct without it; this just makes the stored data say the same thing.
 *
 * Run it only AFTER the code that knows `tech-partner` is deployed. The old
 * sponsors page looks the tier up in a table without that key and would crash.
 *
 * Queries MongoDB directly, because a Payload read goes through those hooks
 * and would report every sponsor as already migrated.
 */

import { getPayload } from 'payload'

import config from '../payload.config'
import { LEGACY_TIERS } from '../src/payload/collections/Sponsors'

const APPLY = process.env.APPLY === '1'

async function main() {
  const payload = await getPayload({ config })
  const Sponsors = payload.db.collections.sponsors

  const legacy = await Sponsors.find(
    { tier: { $in: Object.keys(LEGACY_TIERS) } },
    { name: 1, tier: 1 }
  ).lean<{ _id: unknown; name: string; tier: string }[]>()

  if (legacy.length === 0) console.log('No sponsors on a retired tier. Nothing to do.')
  for (const doc of legacy) console.log(`${doc.name}: ${doc.tier} → ${LEGACY_TIERS[doc.tier]}`)

  if (legacy.length > 0 && APPLY) {
    for (const [from, to] of Object.entries(LEGACY_TIERS)) {
      const { modifiedCount } = await Sponsors.updateMany({ tier: from }, { $set: { tier: to } })
      console.log(`Updated ${modifiedCount} sponsor(s) from ${from} to ${to}.`)
    }
  } else if (legacy.length > 0) {
    console.log('\nDry run. Re-run with APPLY=1 to write these changes.')
  }

  await payload.destroy()
}

await main().catch((err) => {
  console.error(err)
  process.exit(1)
})

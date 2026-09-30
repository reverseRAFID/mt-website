/**
 * Adds the K-Silver Gold sponsor (logo scripts/assets/k-silver.svg).
 *
 *   npm run seed:sponsor
 *
 * Idempotent: matches the sponsor by name and updates rather than duplicates.
 * The logo is uploaded to Media only if the sponsor has no logo yet.
 */

import { readFileSync } from 'node:fs'

import { getPayload } from 'payload'

import config from '../payload.config'

const NAME = 'K-Silver'
const SVG_PATH = new URL('./assets/k-silver.svg', import.meta.url)

async function main() {
  const payload = await getPayload({ config })

  const existing = await payload.find({
    collection: 'sponsors',
    where: { name: { equals: NAME } },
    limit: 1,
    depth: 0,
  })
  const current = existing.docs[0]

  let logo = current?.logo
  if (!logo && !current?.logoLight) {
    const data = readFileSync(SVG_PATH)
    const media = await payload.create({
      collection: 'media',
      data: { alt: `${NAME} logo` },
      file: { data, mimetype: 'image/svg+xml', name: 'k-silver.svg', size: data.length },
    })
    logo = media.id
  }

  const data = { name: NAME, tier: 'gold' as const, isActive: true, ...(logo ? { logo } : {}) }
  if (current) {
    await payload.update({ collection: 'sponsors', id: current.id, data })
    console.log(`Updated sponsor "${NAME}"`)
  } else {
    await payload.create({ collection: 'sponsors', data })
    console.log(`Created sponsor "${NAME}"`)
  }
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

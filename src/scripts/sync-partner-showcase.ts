import { getPayloadClient } from '@/lib/payload'
import { partnerMockSeedData } from '@/lib/partner-branding'

async function main() {
  const payload = await getPayloadClient()

  for (const partner of partnerMockSeedData) {
    const existing = await payload.find({
      collection: 'partners',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        name: {
          equals: partner.name,
        },
      },
    })

    if (existing.docs[0]) {
      await payload.update({
        id: existing.docs[0].id,
        collection: 'partners',
        data: partner as any,
        overrideAccess: true,
      })
      continue
    }

    await payload.create({
      collection: 'partners',
      data: partner as any,
      overrideAccess: true,
    })
  }

  payload.logger.info(`Synced ${partnerMockSeedData.length} partner showcase records.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

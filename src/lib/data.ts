import type { User } from '@/payload-types'

import { getPayloadClient } from './payload'

export async function getHomepageData() {
  const payload = await getPayloadClient()

  const [needs, partners, cases] = await Promise.all([
    payload.find({
      collection: 'tech-needs',
      depth: 1,
      limit: 3,
      overrideAccess: true,
      sort: '-publishedAt',
    }),
    payload.find({
      collection: 'partners',
      depth: 1,
      limit: 10,
      overrideAccess: true,
      sort: 'sortOrder',
    }),
    payload.find({
      collection: 'case-studies',
      depth: 1,
      limit: 2,
      overrideAccess: true,
      sort: '-publishedAt',
    }),
  ])

  return {
    cases: cases.docs,
    needs: needs.docs,
    partnerCount: partners.totalDocs,
    partners: partners.docs,
  }
}

export async function getDashboardMetrics(user: User) {
  const payload = await getPayloadClient()

  const proposalsWhere =
    user.role === 'admin' || user.role === 'reviewer'
      ? undefined
      : {
          submittedBy: {
            equals: user.id,
          },
        }

  const [proposalCount, needCount, caseCount, partnerCount] = await Promise.all([
    payload.count({
      collection: 'proposals',
      where: proposalsWhere,
    }),
    payload.count({ collection: 'tech-needs' }),
    payload.count({ collection: 'case-studies' }),
    payload.count({ collection: 'partners' }),
  ])

  return {
    caseCount: caseCount.totalDocs,
    needCount: needCount.totalDocs,
    partnerCount: partnerCount.totalDocs,
    proposalCount: proposalCount.totalDocs,
  }
}

export async function resolveLoginEmail(identifier: string) {
  const payload = await getPayloadClient()
  const normalizedIdentifier = identifier.trim()

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedIdentifier)) {
    return normalizedIdentifier.toLowerCase()
  }

  if (!/^1\d{10}$/.test(normalizedIdentifier)) {
    return null
  }

  const user = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      phone: {
        equals: normalizedIdentifier,
      },
    },
  })

  return user.docs[0]?.email || null
}

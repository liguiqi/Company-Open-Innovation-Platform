import type { CollectionBeforeValidateHook } from 'payload'

const NEED_ID_PREFIX = 'RD'
const NEED_ID_SEQUENCE_LENGTH = 3
const NEED_ID_PATTERN = /^RD-(\d{4})-(\d+)$/

function formatNeedId(year: number, sequence: number) {
  return `${NEED_ID_PREFIX}-${year}-${String(sequence).padStart(NEED_ID_SEQUENCE_LENGTH, '0')}`
}

function parseNeedIdSequence(needId: unknown, year: number) {
  if (typeof needId !== 'string') {
    return 0
  }

  const matches = NEED_ID_PATTERN.exec(needId)

  if (!matches || Number(matches[1]) !== year) {
    return 0
  }

  return Number(matches[2]) || 0
}

async function getNextNeedSequence(
  req: Parameters<CollectionBeforeValidateHook>[0]['req'],
  year: number,
) {
  let maxSequence = 0
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await req.payload.find({
      collection: 'tech-needs',
      depth: 0,
      limit: 100,
      overrideAccess: true,
      page,
      where: {
        needId: {
          like: `${NEED_ID_PREFIX}-${year}-%`,
        },
      },
    })

    for (const doc of result.docs) {
      maxSequence = Math.max(maxSequence, parseNeedIdSequence(doc.needId, year))
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  return maxSequence + 1
}

export const generateNeedId: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'update') {
    return {
      ...data,
      needId: originalDoc?.needId || data?.needId,
    }
  }

  if (data?.needId) {
    return data
  }

  const year = new Date().getFullYear()
  const nextSequence = await getNextNeedSequence(req, year)

  return {
    ...data,
    needId: formatNeedId(year, nextSequence),
  }
}

import type { CollectionBeforeValidateHook } from 'payload'

export const generateNeedId: CollectionBeforeValidateHook = async ({ data, req }) => {
  if (data?.needId) {
    return data
  }

  const year = new Date().getFullYear()
  const { totalDocs } = await req.payload.count({
    collection: 'tech-needs',
  })

  return {
    ...data,
    needId: `RD-${year}-${String(totalDocs + 1).padStart(3, '0')}`,
  }
}

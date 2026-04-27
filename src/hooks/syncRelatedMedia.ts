import type { CollectionAfterChangeHook } from 'payload'

import { normalizeMediaAssetCategory } from '@/lib/media'

function getRelationId(value: unknown): number | string | null {
  if (typeof value === 'number' || typeof value === 'string') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const relationId = (value as { id?: number | string | null }).id

    if (typeof relationId === 'number' || typeof relationId === 'string') {
      return relationId
    }
  }

  return null
}

async function syncSingleMedia({
  assetCategory,
  mediaId,
  module,
  payload,
  req,
  proposalId,
  purpose,
  uploadedBy,
}: {
  assetCategory?: string
  mediaId: number | string
  module: string
  payload: {
    findByID: (...args: any[]) => Promise<any>
    update: (...args: any[]) => Promise<any>
  }
  req: unknown
  proposalId?: number | string | null
  purpose: 'document' | 'image'
  uploadedBy?: number | string | null
}) {
  const media = await payload
    .findByID({
      id: mediaId,
      collection: 'media',
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null)

  if (!media) {
    return
  }

  const nextData: Record<string, unknown> = {
    assetCategory:
      assetCategory ||
      normalizeMediaAssetCategory({
        assetCategory: media.assetCategory,
        filename: media.filename,
        mimeType: media.mimeType,
        module,
        purpose,
      }),
    module,
    purpose,
  }

  if (proposalId) {
    nextData.proposal = proposalId
  }

  if (uploadedBy) {
    nextData.uploadedBy = uploadedBy
  }

  const isUnchanged =
    media.module === nextData.module &&
    media.purpose === nextData.purpose &&
    media.assetCategory === nextData.assetCategory &&
    (!proposalId || getRelationId(media.proposal) === proposalId) &&
    (!uploadedBy || getRelationId(media.uploadedBy) === uploadedBy)

  if (isUnchanged) {
    return
  }

  await payload.update({
    id: mediaId,
    collection: 'media',
    data: nextData,
    overrideAccess: true,
    req,
  })
}

export const syncPartnerLogoMedia: CollectionAfterChangeHook = async ({ doc, req }) => {
  const mediaId = getRelationId(doc.logo)

  if (!mediaId) {
    return doc
  }

  await syncSingleMedia({
    mediaId,
    module: 'partners',
    payload: req.payload as any,
    purpose: 'image',
    req,
  })

  return doc
}

export const syncCaseStudyCoverMedia: CollectionAfterChangeHook = async ({ doc, req }) => {
  const mediaId = getRelationId(doc.coverImage)

  if (!mediaId) {
    return doc
  }

  await syncSingleMedia({
    assetCategory: 'case-cover',
    mediaId,
    module: 'case-studies',
    payload: req.payload as any,
    purpose: 'image',
    req,
  })

  return doc
}

export const syncUserAvatarMedia: CollectionAfterChangeHook = async ({ doc, req }) => {
  const mediaId = getRelationId(doc.avatar)

  if (!mediaId) {
    return doc
  }

  await syncSingleMedia({
    assetCategory: 'user-avatar',
    mediaId,
    module: 'users',
    payload: req.payload as any,
    purpose: 'image',
    req,
  })

  return doc
}

export const syncProposalAttachmentMedia: CollectionAfterChangeHook = async ({ doc, req }) => {
  const attachments = Array.isArray(doc.attachments) ? doc.attachments : []
  const uploadedBy = getRelationId(doc.submittedBy)

  await Promise.all(
    attachments.map((attachment: unknown) => {
      const mediaId = getRelationId(attachment)

      if (!mediaId) {
        return Promise.resolve()
      }

      return syncSingleMedia({
        assetCategory: 'proposal-attachment',
        mediaId,
        module: 'proposals',
        payload: req.payload as any,
        req,
        proposalId: doc.id,
        purpose: 'document',
        uploadedBy,
      })
    }),
  )

  return doc
}

import { getPayloadClient } from '@/lib/payload'
import {
  buildMediaStorageKey,
  ensureMediaFileOrganization,
  normalizeMediaAssetCategory,
  normalizeMediaModule,
} from '@/lib/media'

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

async function main() {
  const payload = (await getPayloadClient()) as any
  payload.logger.info('Backfilling media organization metadata ...')

  const [mediaResult, proposalsResult, partnersResult, caseStudiesResult, usersResult] =
    await Promise.all([
      payload.find({
        collection: 'media',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
      }),
      payload.find({
        collection: 'proposals',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
      }),
      payload.find({
        collection: 'partners',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
      }),
      payload.find({
        collection: 'case-studies',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
      }),
      payload.find({
        collection: 'users',
        depth: 0,
        limit: 500,
        overrideAccess: true,
        pagination: false,
      }),
    ])

  const proposalAttachmentMap = new Map<
    number | string,
    { proposalId: number | string; uploadedBy: number | string | null }
  >()
  const partnerLogoSet = new Set<number | string>()
  const caseCoverSet = new Set<number | string>()
  const userAvatarSet = new Set<number | string>()

  for (const proposal of proposalsResult.docs) {
    const proposalId = proposal.id
    const uploadedBy = getRelationId(proposal.submittedBy)

    for (const attachment of Array.isArray(proposal.attachments) ? proposal.attachments : []) {
      const mediaId = getRelationId(attachment)

      if (mediaId) {
        proposalAttachmentMap.set(mediaId, { proposalId, uploadedBy })
      }
    }
  }

  for (const partner of partnersResult.docs) {
    const mediaId = getRelationId(partner.logo)

    if (mediaId) {
      partnerLogoSet.add(mediaId)
    }
  }

  for (const caseStudy of caseStudiesResult.docs) {
    const mediaId = getRelationId(caseStudy.coverImage)

    if (mediaId) {
      caseCoverSet.add(mediaId)
    }
  }

  for (const user of usersResult.docs) {
    const mediaId = getRelationId(user.avatar)

    if (mediaId) {
      userAvatarSet.add(mediaId)
    }
  }

  let updatedCount = 0

  for (const media of mediaResult.docs) {
    const proposalAttachment = proposalAttachmentMap.get(media.id)
    const nextPurpose =
      proposalAttachment?.proposalId || media.purpose === 'document' ? 'document' : 'image'

    const nextModule = proposalAttachment
      ? 'proposals'
      : partnerLogoSet.has(media.id)
        ? 'partners'
        : caseCoverSet.has(media.id)
          ? 'case-studies'
          : userAvatarSet.has(media.id)
            ? 'users'
            : normalizeMediaModule({
                module: media.module,
                purpose: nextPurpose,
              })

    const nextAssetCategory = proposalAttachment
      ? 'proposal-attachment'
      : partnerLogoSet.has(media.id)
        ? normalizeMediaAssetCategory({
            filename: media.filename,
            mimeType: media.mimeType,
            module: 'partners',
            purpose: 'image',
          })
        : caseCoverSet.has(media.id)
          ? 'case-cover'
          : userAvatarSet.has(media.id)
            ? 'user-avatar'
            : normalizeMediaAssetCategory({
                assetCategory: media.assetCategory,
                filename: media.filename,
                mimeType: media.mimeType,
                module: nextModule,
                purpose: nextPurpose,
              })

    const nextProposalId = proposalAttachment?.proposalId ?? getRelationId(media.proposal)
    const nextUploadedBy = proposalAttachment?.uploadedBy ?? getRelationId(media.uploadedBy)
    const nextStorageKey = buildMediaStorageKey({
      assetCategory: nextAssetCategory,
      filename: media.filename,
    })

    if (
      media.module === nextModule &&
      media.assetCategory === nextAssetCategory &&
      media.purpose === nextPurpose &&
      media.storageKey === nextStorageKey &&
      getRelationId(media.proposal) === nextProposalId &&
      getRelationId(media.uploadedBy) === nextUploadedBy
    ) {
      continue
    }

    await ensureMediaFileOrganization({
      filename: media.filename,
      previousStorageKey: media.storageKey,
      storageKey: nextStorageKey,
    })

    await payload.update({
      id: media.id,
      collection: 'media',
      context: {
        skipMediaOrganization: true,
      },
      data: {
        assetCategory: nextAssetCategory,
        module: nextModule,
        proposal: nextProposalId || undefined,
        purpose: nextPurpose,
        storageKey: nextStorageKey,
        uploadedBy: nextUploadedBy || undefined,
      },
      overrideAccess: true,
    })

    updatedCount += 1
  }

  payload.logger.info(`Media organization backfill completed, updated ${updatedCount} records.`)
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })

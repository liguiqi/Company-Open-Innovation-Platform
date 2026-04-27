import type { CollectionBeforeDeleteHook } from 'payload'
import type { CollectionAfterDeleteHook } from 'payload'

import { deleteMediaFiles } from '@/lib/media'

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

async function findRelatedMediaDocs({
  attachmentIds,
  proposalId,
  req,
}: {
  attachmentIds: Array<number | string>
  proposalId: number | string
  req: any
}) {
  const relatedMedia = await req.payload.find({
    collection: 'media',
    depth: 0,
    limit: Math.max(100, attachmentIds.length + 20),
    overrideAccess: true,
    pagination: false,
    req,
    where: {
      or: [
        {
          proposal: {
            equals: proposalId,
          },
        },
        ...(attachmentIds.length
          ? [
              {
                id: {
                  in: attachmentIds,
                },
              },
            ]
          : []),
      ],
    },
  })

  const docsById = new Map<
    number | string,
    { id: number | string; filename?: string | null; storageKey?: string | null }
  >()

  relatedMedia.docs.forEach(
    (mediaDoc: {
      id?: number | string | null
      filename?: string | null
      storageKey?: string | null
    }) => {
      if (mediaDoc.id != null) {
        docsById.set(mediaDoc.id, {
          id: mediaDoc.id,
          filename: mediaDoc.filename,
          storageKey: mediaDoc.storageKey,
        })
      }
    },
  )

  attachmentIds.forEach((attachmentId) => {
    if (!docsById.has(attachmentId)) {
      docsById.set(attachmentId, { id: attachmentId })
    }
  })

  return Array.from(docsById.values())
}

async function deleteMediaDocs({
  mediaDocs,
  req,
}: {
  mediaDocs: Array<{ id: number | string; filename?: string | null; storageKey?: string | null }>
  req: any
}) {
  for (const mediaDoc of mediaDocs) {
    await req.payload.db
      .deleteOne({
        collection: 'media',
        req,
        returning: false,
        where: {
          id: {
            equals: mediaDoc.id,
          },
        },
      })
      .catch(() => undefined)

    await deleteMediaFiles({
      filename: mediaDoc.filename,
      storageKey: mediaDoc.storageKey,
    }).catch(() => undefined)
  }
}

export const deleteProposalRelatedMedia: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const proposal = await req.payload
    .findByID({
      id,
      collection: 'proposals',
      depth: 0,
      overrideAccess: true,
      req,
    })
    .catch(() => null)

  const attachmentIds = Array.isArray(proposal?.attachments)
    ? proposal.attachments
        .map((attachment) => getRelationId(attachment))
        .filter((attachmentId): attachmentId is number | string => attachmentId != null)
    : []

  const mediaDocs = await findRelatedMediaDocs({
    attachmentIds,
    proposalId: id,
    req,
  })

  await deleteMediaDocs({
    mediaDocs,
    req,
  })
}

export const deleteProposalRelatedMediaAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  id,
  req,
}) => {
  const attachmentIds = Array.isArray(doc?.attachments)
    ? doc.attachments
        .map((attachment: unknown) => getRelationId(attachment))
        .filter(
          (attachmentId: number | string | null): attachmentId is number | string =>
            attachmentId != null,
        )
    : []

  const mediaDocs = await findRelatedMediaDocs({
    attachmentIds,
    proposalId: id,
    req,
  })

  await deleteMediaDocs({
    mediaDocs,
    req,
  })

  return doc
}

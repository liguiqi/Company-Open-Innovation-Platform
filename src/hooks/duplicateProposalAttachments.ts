import path from 'path'

import type { FieldHook } from 'payload'

import { readMediaFile } from '@/lib/media'

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

function appendCopyLabel(value: string) {
  const trimmed = value.trim()

  if (!trimmed) {
    return 'Untitled Proposal [Copy]'
  }

  return trimmed.includes('[Copy]') ? trimmed : `${trimmed} [Copy]`
}

function buildCopyFilename({
  filename,
  mediaId,
}: {
  filename?: string | null
  mediaId: number | string
}) {
  const original = filename || 'attachment'
  const extension = path.extname(original)
  const basename = path.basename(original, extension)
  const timestamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, '')
    .slice(0, 14)

  return `${basename}-copy-${String(mediaId)}-${timestamp}${extension}`
}

export const duplicateProposalTitle: FieldHook = ({ value }) => {
  if (typeof value !== 'string') {
    return 'Untitled Proposal [Copy]'
  }

  return appendCopyLabel(value)
}

export const duplicateProposalAttachments: FieldHook = async ({ req, value }) => {
  const attachmentIds = Array.isArray(value)
    ? value
        .map((attachment) => getRelationId(attachment))
        .filter((attachmentId): attachmentId is number | string => attachmentId != null)
    : []

  if (!attachmentIds.length) {
    return []
  }

  const duplicatedAttachmentIds: Array<number | string> = []

  for (const attachmentId of attachmentIds) {
    const media = await req.payload
      .findByID({
        id: attachmentId,
        collection: 'media',
        depth: 0,
        overrideAccess: true,
        req,
      })
      .catch(() => null)

    if (!media?.filename) {
      continue
    }

    const fileData = await readMediaFile({
      filename: media.filename,
      storageKey: media.storageKey,
    })

    if (!fileData) {
      continue
    }

    const uploadedBy =
      typeof getRelationId(media.uploadedBy) === 'number'
        ? (getRelationId(media.uploadedBy) as number)
        : undefined

    const duplicatedMedia = await req.payload.create({
      collection: 'media',
      data: {
        alt: appendCopyLabel(media.alt || media.filename || 'Proposal Attachment'),
        assetCategory: media.assetCategory || 'proposal-attachment',
        module: media.module || 'proposals',
        purpose: media.purpose || 'document',
        uploadedBy,
      },
      file: {
        data: fileData,
        mimetype: media.mimeType || 'application/octet-stream',
        name: buildCopyFilename({
          filename: media.filename,
          mediaId: attachmentId,
        }),
        size: fileData.length,
      },
      overrideAccess: true,
      req,
    })

    duplicatedAttachmentIds.push(duplicatedMedia.id)
  }

  return duplicatedAttachmentIds
}

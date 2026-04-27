import { NextResponse } from 'next/server'

import { getRequestUser } from '@/lib/auth'
import { getAttachmentContentDisposition, readMediaFile } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'

function getRelationId(value: unknown) {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: number | string | null }).id
    return getRelationId(id)
  }

  return null
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request)

  if (!user) {
    return NextResponse.json({ error: '请先登录后再下载附件' }, { status: 401 })
  }

  const { id } = await params
  const payload = await getPayloadClient()
  const media = await payload
    .findByID({
      id,
      collection: 'media',
      depth: 2,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!media || media.purpose !== 'document' || !media.filename) {
    return NextResponse.json({ error: '附件不存在' }, { status: 404 })
  }

  const uploadedById = getRelationId(media.uploadedBy)
  const proposalRef = media.proposal
  let proposalOwnerId =
    proposalRef && typeof proposalRef === 'object' ? getRelationId(proposalRef.submittedBy) : null

  if (!proposalOwnerId) {
    const proposalId = getRelationId(proposalRef)

    if (proposalId) {
      const proposal = await payload
        .findByID({
          id: proposalId,
          collection: 'proposals',
          depth: 0,
          overrideAccess: true,
        })
        .catch(() => null)

      proposalOwnerId = proposal ? getRelationId(proposal.submittedBy) : null
    }
  }

  const canDownload =
    user.role === 'admin' ||
    user.role === 'reviewer' ||
    uploadedById === user.id ||
    proposalOwnerId === user.id

  if (!canDownload) {
    return NextResponse.json({ error: '无权下载该附件' }, { status: 403 })
  }

  const fileBuffer = await readMediaFile({
    filename: media.filename,
    storageKey: media.storageKey,
  })

  if (fileBuffer) {
    const filename = media.filename
    const headers = new Headers()

    headers.set('Content-Disposition', getAttachmentContentDisposition(filename))
    headers.set('Content-Length', String(fileBuffer.length))
    headers.set('Content-Type', media.mimeType || 'application/octet-stream')
    headers.set('Cache-Control', 'private, no-store')

    return new Response(fileBuffer, {
      headers,
      status: 200,
    })
  }

  return NextResponse.json({ error: '附件文件不存在' }, { status: 404 })
}

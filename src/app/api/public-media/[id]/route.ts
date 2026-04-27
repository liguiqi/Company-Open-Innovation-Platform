import { NextResponse } from 'next/server'

import { readMediaFile } from '@/lib/media'
import { getPayloadClient } from '@/lib/payload'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payload = await getPayloadClient()
  const media = await payload
    .findByID({
      id,
      collection: 'media',
      depth: 0,
      overrideAccess: true,
    })
    .catch(() => null)

  if (!media || media.purpose !== 'image' || !media.filename) {
    return NextResponse.json({ error: '媒体文件不存在' }, { status: 404 })
  }

  const fileBuffer = await readMediaFile({
    filename: media.filename,
    storageKey: media.storageKey,
  })

  if (!fileBuffer) {
    return NextResponse.json({ error: '媒体文件不存在' }, { status: 404 })
  }

  const headers = new Headers()

  headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  headers.set('Content-Length', String(fileBuffer.length))
  headers.set('Content-Type', media.mimeType || 'application/octet-stream')

  return new Response(fileBuffer, {
    headers,
    status: 200,
  })
}

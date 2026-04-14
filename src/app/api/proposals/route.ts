import { NextResponse } from 'next/server'

import { getRequestUser } from '@/lib/auth'
import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { proposalCreateSchema } from '@/lib/validators'

function toPayloadFile(file: File) {
  return file.arrayBuffer().then((buffer) => ({
    data: Buffer.from(buffer),
    mimetype: file.type,
    name: file.name,
    size: file.size,
  }))
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)

  if (!user) {
    return NextResponse.json({ error: '请先登录后再提交方案' }, { status: 401 })
  }

  if (user.role !== 'partner' && user.role !== 'admin') {
    return NextResponse.json({ error: '当前账号无权提交方案' }, { status: 403 })
  }

  const formData = await request.formData()
  const parsed = proposalCreateSchema.safeParse({
    contactCompany: formData.get('contactCompany'),
    contactEmail: formData.get('contactEmail'),
    contactName: formData.get('contactName'),
    description: formData.get('description'),
    relatedNeed: formData.get('relatedNeed') || undefined,
    title: formData.get('title'),
    type: formData.get('type'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '方案数据不完整' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const proposal = await (payload as any).create({
    collection: 'proposals',
    data: {
      ...parsed.data,
      description: plainTextToLexical(parsed.data.description),
      relatedNeed: parsed.data.relatedNeed ? Number(parsed.data.relatedNeed) : undefined,
      submittedBy: user.id,
    },
    overrideAccess: true,
  })

  const attachmentFiles = formData
    .getAll('attachments')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0)

  const attachmentIds: number[] = []

  for (const file of attachmentFiles) {
    const uploaded = await (payload as any).create({
      collection: 'media',
      data: {
        alt: file.name,
        proposal: proposal.id,
        purpose: 'document',
        uploadedBy: user.id,
      },
      file: await toPayloadFile(file),
      overrideAccess: true,
    })

    attachmentIds.push(Number(uploaded.id))
  }

  if (attachmentIds.length > 0) {
    await payload.update({
      id: Number(proposal.id),
      collection: 'proposals',
      data: {
        attachments: attachmentIds,
      },
      overrideAccess: true,
    })
  }

  return NextResponse.json({
    id: proposal.id,
    message: '方案提交成功，我们会在 3-5 个工作日内联系您。',
    ok: true,
  })
}

import { NextResponse } from 'next/server'

import { getRequestUser } from '@/lib/auth'
import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { proposalReviewSchema } from '@/lib/validators'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const reviewer = await getRequestUser(request)

  if (!reviewer) {
    return NextResponse.json({ error: '请先登录后再操作' }, { status: 401 })
  }

  if (reviewer.role !== 'admin' && reviewer.role !== 'reviewer') {
    return NextResponse.json({ error: '当前账号无权执行评审操作' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = proposalReviewSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '评审参数无效' },
      { status: 400 },
    )
  }

  const { id } = await params
  const payload = await getPayloadClient()
  const proposal = await payload.update({
    id: Number(id),
    collection: 'proposals',
    data: {
      reviewNotes: plainTextToLexical(parsed.data.reviewNotes),
      reviewedBy: reviewer.id,
      status: parsed.data.status,
    },
    overrideAccess: true,
  })

  return NextResponse.json({
    id: proposal.id,
    message: '评审状态已更新',
    ok: true,
  })
}

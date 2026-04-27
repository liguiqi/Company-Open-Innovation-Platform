import { NextResponse } from 'next/server'

import { getRequestUser } from '@/lib/auth'
import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { techNeedUpsertSchema } from '@/lib/validators'

function canManageTechNeeds(role?: string | null) {
  return role === 'admin' || role === 'reviewer'
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(request)

  if (!user) {
    return NextResponse.json({ error: '登录状态已失效，请重新登录' }, { status: 401 })
  }

  if (!canManageTechNeeds(user.role)) {
    return NextResponse.json({ error: '当前账号无权编辑技术需求' }, { status: 403 })
  }

  const { id } = await params
  const numericId = Number(id)

  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: '需求编号无效' }, { status: 400 })
  }

  const body = await request.json().catch(() => null)
  const parsed = techNeedUpsertSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '需求参数无效' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()
    const updated = await payload.update({
      id: numericId,
      collection: 'tech-needs',
      data: {
        description: plainTextToLexical(parsed.data.description),
        domain: parsed.data.domain,
        priority: parsed.data.priority,
        productLine: parsed.data.productLine || null,
        publishedAt: new Date(parsed.data.publishedAt).toISOString(),
        status: parsed.data.status,
        title: parsed.data.title,
      },
      overrideAccess: true,
    })

    return NextResponse.json({
      message: '技术需求已更新。',
      need: {
        id: updated.id,
        needId: updated.needId,
      },
      ok: true,
    })
  } catch (error) {
    console.error('[tech-needs:update-failed]', error)

    return NextResponse.json({ error: '更新技术需求失败，请稍后重试' }, { status: 500 })
  }
}

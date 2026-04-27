import { NextResponse } from 'next/server'

import { getRequestUser } from '@/lib/auth'
import { plainTextToLexical } from '@/lib/lexical'
import { getPayloadClient } from '@/lib/payload'
import { techNeedUpsertSchema } from '@/lib/validators'

function canManageTechNeeds(role?: string | null) {
  return role === 'admin' || role === 'reviewer'
}

export async function POST(request: Request) {
  const user = await getRequestUser(request)

  if (!user) {
    return NextResponse.json({ error: '登录状态已失效，请重新登录' }, { status: 401 })
  }

  if (!canManageTechNeeds(user.role)) {
    return NextResponse.json({ error: '当前账号无权发布技术需求' }, { status: 403 })
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
    const created = await payload.create({
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
      message: '技术需求已创建并同步到前台展示数据。',
      need: {
        id: created.id,
        needId: created.needId,
      },
      ok: true,
    })
  } catch (error) {
    console.error('[tech-needs:create-failed]', error)

    return NextResponse.json({ error: '创建技术需求失败，请稍后重试' }, { status: 500 })
  }
}

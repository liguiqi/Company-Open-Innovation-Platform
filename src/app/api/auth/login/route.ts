import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { resolveLoginEmail } from '@/lib/data'
import { loginSchema } from '@/lib/validators'
import { createAuthCookie } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '登录参数无效' },
      { status: 400 },
    )
  }

  const email = await resolveLoginEmail(parsed.data.identifier)

  if (!email) {
    return NextResponse.json({ error: '账号不存在' }, { status: 404 })
  }

  try {
    const payload = await getPayloadClient()
    const result = await payload.login({
      collection: 'users',
      data: {
        email,
        password: parsed.data.password,
      },
    })

    if (!result.user) {
      return NextResponse.json({ error: '登录失败' }, { status: 401 })
    }

    if (!result.user.emailVerifiedAt && result.user.role !== 'admin') {
      return NextResponse.json({ error: '请先完成邮箱验证后再登录' }, { status: 403 })
    }

    const response = NextResponse.json({
      ok: true,
      redirectTo: '/dashboard',
      user: {
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
      },
    })

    response.headers.append('Set-Cookie', await createAuthCookie(result.user))
    return response
  } catch {
    return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 })
  }
}

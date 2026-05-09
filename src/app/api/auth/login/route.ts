import { NextResponse } from 'next/server'

import { getRequesterIP } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { resolveLoginEmail } from '@/lib/data'
import { loginSchema } from '@/lib/validators'
import { createAuthCookie } from '@/lib/auth'
import { loginAccountLimiter, loginIpLimiter } from '@/services/rate-limit'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '登录参数无效' },
      { status: 400 },
    )
  }

  const ip = getRequesterIP(request)

  try {
    await loginIpLimiter.consume(ip)
  } catch {
    return NextResponse.json({ error: '登录尝试过于频繁，请15分钟后再试' }, { status: 429 })
  }

  const email = await resolveLoginEmail(parsed.data.identifier)

  if (!email) {
    return NextResponse.json({ error: '账号不存在' }, { status: 404 })
  }

  try {
    await loginAccountLimiter.consume(email)
  } catch {
    return NextResponse.json({ error: '该账号登录尝试过多，请15分钟后再试' }, { status: 429 })
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

    const hasVerifiedChannel =
      result.user.role === 'admin' ||
      Boolean(result.user.emailVerifiedAt) ||
      Boolean(result.user.phoneVerifiedAt)

    if (!hasVerifiedChannel) {
      return NextResponse.json({ error: '请先完成邮箱或手机验证后再登录' }, { status: 403 })
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
    return NextResponse.json({ error: '邮箱/手机号或密码错误' }, { status: 401 })
  }
}

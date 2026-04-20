import { NextResponse } from 'next/server'

import type { User } from '@/payload-types'

import { createAuthCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { smsVerifySchema } from '@/lib/validators'
import { deleteCachedValue, getCachedValue } from '@/services/redis'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = smsVerifySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '验证码参数不正确' },
      { status: 400 },
    )
  }

  const { code, phone } = parsed.data
  const cachedCode = await getCachedValue(`sms:otp:${phone}`)

  if (!cachedCode || cachedCode !== code) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
  }

  await deleteCachedValue(`sms:otp:${phone}`)

  const payload = await getPayloadClient()
  const matched = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      phone: {
        equals: phone,
      },
    },
  })

  const user = matched.docs[0] as User | undefined

  if (!user) {
    return NextResponse.json(
      {
        action: 'register',
        error: '该手机账号未注册，请先创建合作伙伴账号',
        identifier: phone,
        identifierType: 'phone',
        redirectTo: `/register?phone=${encodeURIComponent(phone)}`,
      },
      { status: 404 },
    )
  }

  const authenticatedUser = user.phoneVerifiedAt
    ? user
    : ((await payload.update({
        id: user.id,
        collection: 'users',
        data: {
          phoneVerifiedAt: new Date().toISOString(),
        },
        overrideAccess: true,
      })) as User)

  const response = NextResponse.json({
    ok: true,
    redirectTo: '/dashboard',
    user: {
      name: authenticatedUser.name,
      phone: authenticatedUser.phone,
      role: authenticatedUser.role,
    },
  })

  response.headers.append('Set-Cookie', await createAuthCookie(authenticatedUser))
  return response
}

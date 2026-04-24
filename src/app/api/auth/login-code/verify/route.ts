import { NextResponse } from 'next/server'

import type { User } from '@/payload-types'

import { createAuthCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { getLoginIdentifierType, loginCodeVerifySchema } from '@/lib/validators'
import { deleteCachedValue, getCachedValue } from '@/services/redis'

function buildLoginCodeKey(identifierType: 'email' | 'phone', identifier: string) {
  return `login:${identifierType}:otp:${identifier}`
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginCodeVerifySchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '验证码参数不正确' },
      { status: 400 },
    )
  }

  const identifierType = getLoginIdentifierType(parsed.data.identifier)

  if (!identifierType) {
    return NextResponse.json({ error: '请输入邮箱或手机号' }, { status: 400 })
  }

  const normalizedIdentifier =
    identifierType === 'email'
      ? parsed.data.identifier.trim().toLowerCase()
      : parsed.data.identifier.trim()

  const cachedCode = await getCachedValue(buildLoginCodeKey(identifierType, normalizedIdentifier))

  if (!cachedCode || cachedCode !== parsed.data.code.trim()) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
  }

  await deleteCachedValue(buildLoginCodeKey(identifierType, normalizedIdentifier))

  const payload = await getPayloadClient()
  const matched = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where:
      identifierType === 'email'
        ? {
            email: {
              equals: normalizedIdentifier,
            },
          }
        : {
            phone: {
              equals: normalizedIdentifier,
            },
          },
  })

  const user = matched.docs[0] as User | undefined

  if (!user) {
    return NextResponse.json(
      {
        action: 'register',
        error:
          identifierType === 'email'
            ? '该邮箱账号未注册，请先创建合作伙伴账号'
            : '该手机账号未注册，请先创建合作伙伴账号',
        identifier: normalizedIdentifier,
        identifierType,
        redirectTo:
          identifierType === 'email'
            ? `/register?email=${encodeURIComponent(normalizedIdentifier)}`
            : `/register?phone=${encodeURIComponent(normalizedIdentifier)}`,
      },
      { status: 404 },
    )
  }

  let authenticatedUser = user
  const verifiedAt = new Date().toISOString()

  if (identifierType === 'email' && !user.emailVerifiedAt) {
    authenticatedUser = (await payload.update({
      id: user.id,
      collection: 'users',
      data: {
        emailVerifiedAt: verifiedAt,
      },
      overrideAccess: true,
    })) as User
  }

  if (identifierType === 'phone' && !user.phoneVerifiedAt) {
    authenticatedUser = (await payload.update({
      id: user.id,
      collection: 'users',
      data: {
        phoneVerifiedAt: verifiedAt,
      },
      overrideAccess: true,
    })) as User
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: '/dashboard',
    user: {
      email: authenticatedUser.email,
      name: authenticatedUser.name,
      role: authenticatedUser.role,
    },
  })

  response.headers.append('Set-Cookie', await createAuthCookie(authenticatedUser))
  return response
}

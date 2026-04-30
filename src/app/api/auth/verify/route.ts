import { NextResponse } from 'next/server'

import { createAuthCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'

export async function GET(request: Request) {
  const url = new URL(request.url)
  const token = url.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: '缺少验证 token' }, { status: 400 })
  }

  const payload = await getPayloadClient()
  const result = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    overrideAccess: true,
    pagination: false,
    where: {
      emailVerificationToken: {
        equals: token,
      },
    },
  })

  const user = result.docs[0]

  if (!user) {
    return NextResponse.json({ error: '验证链接无效或已失效' }, { status: 404 })
  }

  if (
    user.emailVerificationExpiresAt &&
    new Date(user.emailVerificationExpiresAt).getTime() < Date.now()
  ) {
    return NextResponse.json({ error: '验证链接已过期，请重新注册或联系管理员' }, { status: 410 })
  }

  const updatedUser = await payload.update({
    id: user.id,
    collection: 'users',
    data: {
      emailVerificationExpiresAt: null,
      emailVerificationToken: '',
      lastAccessAt: new Date().toISOString(),
      emailVerifiedAt: new Date().toISOString(),
    },
    overrideAccess: true,
  })

  const response = NextResponse.json({ ok: true })
  response.headers.append('Set-Cookie', await createAuthCookie(updatedUser))
  return response
}

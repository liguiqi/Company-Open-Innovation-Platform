import { NextResponse } from 'next/server'

import { createAuthCookie } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { smsVerifySchema } from '@/lib/validators'
import { buildPhoneOnlyName, buildSyntheticEmail } from '@/lib/utils'
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

  const { code, name, phone } = parsed.data
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

  const user =
    matched.docs[0] ||
    (await payload.create({
      collection: 'users',
      data: {
        company: '待完善',
        email: buildSyntheticEmail(phone),
        name: name || buildPhoneOnlyName(phone),
        password: `${phone}-${Date.now()}-SmsOnly!`,
        phone,
        phoneVerifiedAt: new Date().toISOString(),
        role: 'partner',
        username: `u${phone.slice(-6)}`,
      },
      overrideAccess: true,
    }))

  if (!user.phoneVerifiedAt) {
    await payload.update({
      id: user.id,
      collection: 'users',
      data: {
        phoneVerifiedAt: new Date().toISOString(),
      },
      overrideAccess: true,
    })
  }

  const response = NextResponse.json({
    ok: true,
    redirectTo: '/dashboard',
    user: {
      name: user.name,
      phone: user.phone,
      role: user.role,
    },
  })

  response.headers.append('Set-Cookie', await createAuthCookie(user))
  return response
}

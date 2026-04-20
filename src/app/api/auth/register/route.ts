import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { buildSyntheticEmail } from '@/lib/utils'
import { registerSchema } from '@/lib/validators'
import { deleteCachedValue, getCachedValue } from '@/services/redis'

function buildEmailCodeKey(email: string) {
  return `email:otp:${email.trim().toLowerCase()}`
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = registerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '注册参数无效' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const { company, email, emailCode, name, password, phone, smsCode, username } = parsed.data
  const normalizedEmail = email.trim().toLowerCase()
  const normalizedPhone = phone.trim()
  const effectiveEmail = normalizedEmail || buildSyntheticEmail(normalizedPhone)

  const [existingEmail, existingUsername, existingPhone] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: effectiveEmail,
        },
      },
    }),
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        username: {
          equals: username,
        },
      },
    }),
    phone
      ? payload.find({
          collection: 'users',
          depth: 0,
          limit: 1,
          overrideAccess: true,
          pagination: false,
          where: {
            phone: {
              equals: normalizedPhone,
            },
          },
        })
      : Promise.resolve({ docs: [] as Array<unknown> }),
  ])

  if (existingEmail.docs[0]) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
  }

  if (existingUsername.docs[0]) {
    return NextResponse.json({ error: '该用户名已被占用' }, { status: 409 })
  }

  if (phone && existingPhone.docs[0]) {
    return NextResponse.json({ error: '该手机号已绑定其他账号' }, { status: 409 })
  }

  const now = new Date().toISOString()
  const emailOTP = normalizedEmail ? await getCachedValue(buildEmailCodeKey(normalizedEmail)) : null
  const phoneOTP = normalizedPhone ? await getCachedValue(`sms:otp:${normalizedPhone}`) : null
  const emailVerified =
    Boolean(normalizedEmail) && Boolean(emailCode) && Boolean(emailOTP) && emailOTP === emailCode
  const phoneVerified =
    Boolean(normalizedPhone) && Boolean(smsCode) && Boolean(phoneOTP) && phoneOTP === smsCode

  if (normalizedEmail && emailCode && !emailVerified) {
    return NextResponse.json({ error: '邮箱验证码错误或已过期' }, { status: 400 })
  }

  if (normalizedPhone && smsCode && !phoneVerified) {
    return NextResponse.json({ error: '短信验证码错误或已过期' }, { status: 400 })
  }

  if (!emailVerified && !phoneVerified) {
    return NextResponse.json({ error: '邮箱验证码或短信验证码至少完成一种' }, { status: 400 })
  }

  const user = await payload.create({
    collection: 'users',
    data: {
      company,
      email: effectiveEmail,
      emailVerificationExpiresAt: null,
      emailVerificationToken: '',
      emailVerifiedAt: emailVerified ? now : null,
      name,
      password,
      phone: normalizedPhone || undefined,
      phoneVerifiedAt: phoneVerified ? now : null,
      role: 'partner',
      username,
    },
    overrideAccess: true,
  })

  if (emailVerified && normalizedEmail) {
    await deleteCachedValue(buildEmailCodeKey(normalizedEmail))
  }

  if (phoneVerified && normalizedPhone) {
    await deleteCachedValue(`sms:otp:${normalizedPhone}`)
  }

  return NextResponse.json({
    message: `注册成功，已完成${[emailVerified ? '邮箱' : null, phoneVerified ? '手机' : null].filter(Boolean).join('和')}验证，可返回登录。`,
    ok: true,
    user: {
      id: user.id,
    },
  })
}

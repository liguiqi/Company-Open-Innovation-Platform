import crypto from 'node:crypto'

import { NextResponse } from 'next/server'

import { getPayloadClient } from '@/lib/payload'
import { registerSchema } from '@/lib/validators'
import { sendVerificationEmail } from '@/services/email'

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
  const { company, email, name, password, phone, username } = parsed.data

  const [existingEmail, existingUsername, existingPhone] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: email,
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
              equals: phone,
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

  const token = crypto.randomBytes(24).toString('hex')
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24)

  const user = await payload.create({
    collection: 'users',
    data: {
      company,
      email,
      emailVerificationExpiresAt: expiresAt.toISOString(),
      emailVerificationToken: token,
      name,
      password,
      phone: phone || undefined,
      role: 'partner',
      username,
    },
    overrideAccess: true,
  })

  await sendVerificationEmail(user, token)

  return NextResponse.json({
    message: '注册成功，请前往邮箱完成验证。',
    ok: true,
  })
}

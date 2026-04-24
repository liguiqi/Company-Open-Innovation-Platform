import { NextResponse } from 'next/server'

import type { User } from '@/payload-types'

import { createAuthCookie, getRequestUser } from '@/lib/auth'
import { getPayloadClient } from '@/lib/payload'
import { profileUpdateSchema } from '@/lib/validators'

export async function PATCH(request: Request) {
  const currentUser = await getRequestUser(request)

  if (!currentUser) {
    return NextResponse.json({ error: '登录状态已失效，请重新登录' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = profileUpdateSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '个人信息参数无效' },
      { status: 400 },
    )
  }

  const payload = await getPayloadClient()
  const normalizedName = parsed.data.name.trim()
  const normalizedUsername = parsed.data.username.trim()
  const normalizedCompany = parsed.data.company.trim()
  const normalizedEmail = parsed.data.email.trim().toLowerCase()
  const normalizedPhone = parsed.data.phone.trim()
  const currentEmail = currentUser.email.trim().toLowerCase()
  const currentPhone = currentUser.phone?.trim() || ''

  const [emailMatched, usernameMatched, phoneMatched] = await Promise.all([
    payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      overrideAccess: true,
      pagination: false,
      where: {
        email: {
          equals: normalizedEmail,
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
          equals: normalizedUsername,
        },
      },
    }),
    normalizedPhone
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

  const existingEmailUser = emailMatched.docs[0] as User | undefined
  const existingUsernameUser = usernameMatched.docs[0] as User | undefined
  const existingPhoneUser = phoneMatched.docs[0] as User | undefined

  if (existingEmailUser && existingEmailUser.id !== currentUser.id) {
    return NextResponse.json({ error: '该邮箱已绑定其他账号' }, { status: 409 })
  }

  if (existingUsernameUser && existingUsernameUser.id !== currentUser.id) {
    return NextResponse.json({ error: '该用户名已被占用' }, { status: 409 })
  }

  if (existingPhoneUser && existingPhoneUser.id !== currentUser.id) {
    return NextResponse.json({ error: '该手机号已绑定其他账号' }, { status: 409 })
  }

  const emailChanged = normalizedEmail !== currentEmail
  const phoneChanged = normalizedPhone !== currentPhone
  const nextEmailVerifiedAt = emailChanged ? null : currentUser.emailVerifiedAt
  const nextPhoneVerifiedAt = phoneChanged ? null : currentUser.phoneVerifiedAt

  if (currentUser.role !== 'admin' && !nextEmailVerifiedAt && !nextPhoneVerifiedAt) {
    return NextResponse.json(
      {
        error:
          '当前账号至少需要保留一个已验证的邮箱或手机号；请先补齐另一种验证方式后再修改当前唯一已验证通道。',
      },
      { status: 400 },
    )
  }

  const updatedUser = (await payload.update({
    id: currentUser.id,
    collection: 'users',
    data: {
      company: normalizedCompany || null,
      email: normalizedEmail,
      emailVerificationExpiresAt: emailChanged ? null : currentUser.emailVerificationExpiresAt,
      emailVerificationToken: emailChanged ? null : currentUser.emailVerificationToken,
      emailVerifiedAt: nextEmailVerifiedAt,
      name: normalizedName,
      phone: normalizedPhone || null,
      phoneVerifiedAt: nextPhoneVerifiedAt,
      username: normalizedUsername,
    },
    overrideAccess: true,
  })) as User

  const updatedChannels = [emailChanged ? '邮箱' : null, phoneChanged ? '手机' : null].filter(
    Boolean,
  )
  const response = NextResponse.json({
    message: updatedChannels.length
      ? `个人信息已保存，${updatedChannels.join('和')}验证状态已同步重置。`
      : '个人信息已保存。',
    ok: true,
    user: {
      company: updatedUser.company,
      email: updatedUser.email,
      emailVerifiedAt: updatedUser.emailVerifiedAt,
      name: updatedUser.name,
      phone: updatedUser.phone,
      phoneVerifiedAt: updatedUser.phoneVerifiedAt,
      role: updatedUser.role,
      username: updatedUser.username,
    },
  })

  response.headers.append('Set-Cookie', await createAuthCookie(updatedUser))
  return response
}

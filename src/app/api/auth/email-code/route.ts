import { NextResponse } from 'next/server'

import { getRequesterIP } from '@/lib/auth'
import { appEnv } from '@/lib/env'
import { emailCodeSendSchema } from '@/lib/validators'
import { getPayloadClient } from '@/lib/payload'
import { sendRegistrationCodeEmail } from '@/services/email'
import { emailSendLimiter, ipSendLimiter } from '@/services/rate-limit'
import { setCachedValue } from '@/services/redis'

function buildEmailCodeKey(email: string) {
  return `email:otp:${email.trim().toLowerCase()}`
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = emailCodeSendSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '邮箱格式不正确' },
      { status: 400 },
    )
  }

  const email = parsed.data.email.trim().toLowerCase()
  const ip = getRequesterIP(request)

  try {
    await Promise.all([emailSendLimiter.consume(email), ipSendLimiter.consume(ip)])
  } catch {
    return NextResponse.json({ error: '验证码发送过于频繁，请稍后再试' }, { status: 429 })
  }

  const payload = await getPayloadClient()
  const existingEmail = await payload.find({
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
  })

  if (existingEmail.docs[0]) {
    return NextResponse.json({ error: '该邮箱已注册' }, { status: 409 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  const emailResult = await sendRegistrationCodeEmail(email, code)
  const emailSkipped = Boolean(emailResult && 'skipped' in emailResult)

  if (emailSkipped && !appEnv.isDevelopment) {
    return NextResponse.json({ error: '邮箱验证码发送失败，请稍后重试' }, { status: 503 })
  }

  await setCachedValue(buildEmailCodeKey(email), code, 300)

  return NextResponse.json({
    debugCode: appEnv.isDevelopment && emailSkipped ? code : undefined,
    message: '邮箱验证码已发送，请在 5 分钟内完成验证',
    mocked: emailSkipped,
    ok: true,
    provider: emailSkipped ? 'mock' : 'smtp',
  })
}

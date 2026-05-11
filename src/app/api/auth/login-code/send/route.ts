import { NextResponse } from 'next/server'

import { getRequesterIP } from '@/lib/auth'
import { appEnv } from '@/lib/env'
import { getLoginIdentifierType, loginCodeSendSchema } from '@/lib/validators'
import { sendSMSCode } from '@/services/aliyun-sms'
import { sendLoginCodeEmail } from '@/services/email'
import { emailSendLimiter, ipSendLimiter, phoneSendLimiter } from '@/services/rate-limit'
import { setCachedValue } from '@/services/redis'

function buildLoginCodeKey(identifierType: 'email' | 'phone', identifier: string) {
  return `login:${identifierType}:otp:${identifier}`
}

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = loginCodeSendSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '登录验证码参数不正确' },
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

  const ip = getRequesterIP(request)

  try {
    await Promise.all([
      identifierType === 'email'
        ? emailSendLimiter.consume(normalizedIdentifier)
        : phoneSendLimiter.consume(normalizedIdentifier),
      ipSendLimiter.consume(ip),
    ])
  } catch {
    return NextResponse.json({ error: '验证码发送过于频繁，请稍后再试' }, { status: 429 })
  }

  const fallbackCode = String(Math.floor(100000 + Math.random() * 900000))

  if (identifierType === 'email') {
    const emailResult = await sendLoginCodeEmail(normalizedIdentifier, fallbackCode)
    const mocked = Boolean(emailResult && 'skipped' in emailResult)

    if (mocked && !appEnv.isDevelopment) {
      return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 503 })
    }

    await setCachedValue(buildLoginCodeKey('email', normalizedIdentifier), fallbackCode, 300)

    return NextResponse.json({
      debugCode: appEnv.isDevelopment && mocked ? fallbackCode : undefined,
      message: '验证码已发送，请在 5 分钟内完成验证',
      ok: true,
    })
  }

  if (!appEnv.smsEnabled && !appEnv.isDevelopment) {
    return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 503 })
  }

  const smsResult = await sendSMSCode(normalizedIdentifier, fallbackCode)
  const mocked = smsResult.provider === 'mock'
  const resolvedCode = smsResult.verifyCode || fallbackCode

  if (mocked && !appEnv.isDevelopment) {
    return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 503 })
  }

  if (smsResult.provider === 'aliyun-dypnsapi' && smsResult.success === false) {
    return NextResponse.json({ error: '验证码发送失败，请稍后重试' }, { status: 502 })
  }

  await setCachedValue(buildLoginCodeKey('phone', normalizedIdentifier), resolvedCode, 300)

  return NextResponse.json({
    debugCode: appEnv.isDevelopment ? resolvedCode : undefined,
    message: '验证码已发送，请在 5 分钟内完成验证',
    ok: true,
  })
}

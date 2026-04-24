import { NextResponse } from 'next/server'

import { getRequesterIP } from '@/lib/auth'
import { appEnv } from '@/lib/env'
import { smsSendSchema } from '@/lib/validators'
import { sendSMSCode } from '@/services/aliyun-sms'
import { ipSendLimiter, phoneSendLimiter } from '@/services/rate-limit'
import { setCachedValue } from '@/services/redis'

export async function POST(request: Request) {
  const body = await request.json()
  const parsed = smsSendSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || '手机号格式不正确' },
      { status: 400 },
    )
  }

  const phone = parsed.data.phone
  const ip = getRequesterIP(request)

  if (!appEnv.smsEnabled && !appEnv.isDevelopment) {
    return NextResponse.json(
      { error: '短信服务尚未完成配置，请联系管理员补充短信模板后再试' },
      { status: 503 },
    )
  }

  try {
    await Promise.all([phoneSendLimiter.consume(phone), ipSendLimiter.consume(ip)])
  } catch {
    return NextResponse.json({ error: '验证码发送过于频繁，请稍后再试' }, { status: 429 })
  }

  const fallbackCode = String(Math.floor(100000 + Math.random() * 900000))
  const smsResult = await sendSMSCode(phone, fallbackCode)
  const mocked = smsResult.provider === 'mock'
  const resolvedCode = smsResult.verifyCode || fallbackCode

  if (mocked && !appEnv.isDevelopment) {
    return NextResponse.json(
      { error: '短信服务尚未完成配置，请联系管理员补充短信模板后再试' },
      { status: 503 },
    )
  }

  if (smsResult.provider === 'aliyun-dypnsapi' && smsResult.success === false) {
    return NextResponse.json(
      { error: smsResult.message || '短信验证码发送失败，请稍后再试' },
      { status: 502 },
    )
  }

  await setCachedValue(`sms:otp:${phone}`, resolvedCode, 300)

  return NextResponse.json({
    debugCode: appEnv.isDevelopment ? resolvedCode : undefined,
    message: '验证码已发送，请在 5 分钟内完成验证',
    ok: true,
    mocked,
    provider: smsResult.provider,
  })
}

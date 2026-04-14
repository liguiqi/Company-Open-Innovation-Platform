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

  try {
    await Promise.all([phoneSendLimiter.consume(phone), ipSendLimiter.consume(ip)])
  } catch {
    return NextResponse.json({ error: '验证码发送过于频繁，请稍后再试' }, { status: 429 })
  }

  const code = String(Math.floor(100000 + Math.random() * 900000))
  await setCachedValue(`sms:otp:${phone}`, code, 300)
  const smsResult = await sendSMSCode(phone, code)

  return NextResponse.json({
    debugCode: appEnv.isDevelopment && smsResult && 'mocked' in smsResult ? code : undefined,
    message: '验证码已发送，请在 5 分钟内完成验证',
    ok: true,
    mocked: Boolean(smsResult && 'mocked' in smsResult),
  })
}

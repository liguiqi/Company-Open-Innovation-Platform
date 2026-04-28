import { createRequire } from 'node:module'

import { Config as OpenApiConfig } from '@alicloud/openapi-client'
import { RuntimeOptions } from '@alicloud/tea-util'

import { appEnv } from '@/lib/env'

const require = createRequire(import.meta.url)
const DypnsapiPkg = require('@alicloud/dypnsapi20170525/dist/client.js') as {
  default: new (config: OpenApiConfig) => {
    sendSmsVerifyCodeWithOptions: (
      request: unknown,
      runtime: RuntimeOptions,
    ) => Promise<{
      body?: {
        code?: string
        message?: string
        model?: {
          requestId?: string
          verifyCode?: string
        }
        requestId?: string
        success?: boolean
      }
    }>
    sendSmsVerifyCode: (request: unknown) => Promise<{
      body?: {
        code?: string
        message?: string
        model?: {
          requestId?: string
          verifyCode?: string
        }
        requestId?: string
        success?: boolean
      }
    }>
  }
  SendSmsVerifyCodeRequest: new (options: Record<string, unknown>) => {
    validate?: () => void
  }
}

const DypnsapiClient = DypnsapiPkg.default
const SendSmsVerifyCodeRequest = DypnsapiPkg.SendSmsVerifyCodeRequest
type DypnsapiClientInstance = InstanceType<typeof DypnsapiClient>

type SendSMSCodeResult =
  | {
      mocked: true
      provider: 'mock'
      requestId: string
      verifyCode: string
    }
  | {
      mocked?: false
      provider: 'aliyun-dypnsapi'
      requestId?: string
      verifyCode?: string
      code?: string
      message?: string
      success?: boolean
    }

const smsRuntimeOptions = new RuntimeOptions({
  autoretry: false,
  connectTimeout: 5000,
  maxAttempts: 1,
  readTimeout: 10000,
})

function resolveSMSFailureMessage(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error)

  if (/connecttimeout|timeout|socket hang up|network/i.test(rawMessage)) {
    return '短信通道连接超时，请稍后重试'
  }

  return rawMessage || '短信验证码发送失败，请稍后再试'
}

function isRetryableSMSFailure(error: unknown) {
  const rawMessage = error instanceof Error ? error.message : String(error)

  return /connecttimeout|timeout|socket hang up|network|econnreset|econnaborted|eai_again|enetunreach/i.test(
    rawMessage,
  )
}

function createClient() {
  if (!appEnv.smsEnabled || appEnv.smsMock) {
    return null
  }

  return new DypnsapiClient(
    new OpenApiConfig({
      accessKeyId: appEnv.smsAccessKeyId,
      accessKeySecret: appEnv.smsAccessKeySecret,
      endpoint: appEnv.smsEndpoint,
    }),
  )
}

function createSendSMSRequest(phone: string) {
  return new SendSmsVerifyCodeRequest({
    codeLength: 6,
    codeType: 1,
    countryCode: appEnv.smsCountryCode,
    duplicatePolicy: 1,
    interval: 60,
    phoneNumber: phone,
    returnVerifyCode: true,
    schemeName: appEnv.smsSchemeName,
    signName: appEnv.smsSignName,
    templateCode: appEnv.smsTemplateCode,
    templateParam: JSON.stringify({ code: '##code##', min: '5' }),
    validTime: 300,
  })
}

async function requestSMSCode(
  aliyunClient: DypnsapiClientInstance,
  phone: string,
  fallbackCode: string,
): Promise<SendSMSCodeResult> {
  const request = createSendSMSRequest(phone)

  const response =
    typeof aliyunClient.sendSmsVerifyCodeWithOptions === 'function'
      ? await aliyunClient.sendSmsVerifyCodeWithOptions(request, smsRuntimeOptions)
      : await aliyunClient.sendSmsVerifyCode(request)

  return {
    code: response.body?.code,
    message: response.body?.message,
    provider: 'aliyun-dypnsapi',
    requestId: response.body?.model?.requestId || response.body?.requestId,
    success: response.body?.success,
    verifyCode: response.body?.model?.verifyCode || fallbackCode,
  }
}

export async function sendSMSCode(phone: string, fallbackCode: string): Promise<SendSMSCodeResult> {
  if (!appEnv.smsEnabled || appEnv.smsMock) {
    console.info(`[sms:mock] ${phone} -> ${fallbackCode}`)
    return {
      mocked: true,
      provider: 'mock',
      requestId: `mock-${Date.now()}`,
      verifyCode: fallbackCode,
    }
  }

  for (const attempt of [1, 2] as const) {
    try {
      const aliyunClient = createClient()

      if (!aliyunClient) {
        return {
          mocked: true,
          provider: 'mock',
          requestId: `mock-${Date.now()}`,
          verifyCode: fallbackCode,
        }
      }

      return await requestSMSCode(aliyunClient, phone, fallbackCode)
    } catch (error) {
      const retryable = isRetryableSMSFailure(error)

      console.error('[sms:aliyun-send-failed]', {
        attempt,
        endpoint: appEnv.smsEndpoint,
        message: error instanceof Error ? error.message : String(error),
        phone,
        retryable,
      })

      if (!retryable || attempt === 2) {
        return {
          code: 'SMS_SEND_FAILED',
          message: resolveSMSFailureMessage(error),
          provider: 'aliyun-dypnsapi',
          success: false,
          verifyCode: undefined,
        }
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 300)
      })
    }
  }

  return {
    code: 'SMS_SEND_FAILED',
    message: '短信验证码发送失败，请稍后再试',
    provider: 'aliyun-dypnsapi',
    success: false,
    verifyCode: undefined,
  }
}

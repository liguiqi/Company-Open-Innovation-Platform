import { createRequire } from 'node:module'

import { Config as OpenApiConfig } from '@alicloud/openapi-client'

import { appEnv } from '@/lib/env'

const require = createRequire(import.meta.url)
const DypnsapiPkg = require('@alicloud/dypnsapi20170525/dist/client.js') as {
  default: new (config: OpenApiConfig) => {
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

let client: DypnsapiClientInstance | null = null

function getClient() {
  if (!appEnv.smsEnabled || appEnv.smsMock) {
    return null
  }

  if (!client) {
    client = new DypnsapiClient(
      new OpenApiConfig({
        accessKeyId: appEnv.smsAccessKeyId,
        accessKeySecret: appEnv.smsAccessKeySecret,
        endpoint: appEnv.smsEndpoint,
      }),
    )
  }

  return client
}

export async function sendSMSCode(phone: string, fallbackCode: string): Promise<SendSMSCodeResult> {
  const aliyunClient = getClient()

  if (!aliyunClient) {
    console.info(`[sms:mock] ${phone} -> ${fallbackCode}`)
    return {
      mocked: true,
      provider: 'mock',
      requestId: `mock-${Date.now()}`,
      verifyCode: fallbackCode,
    }
  }

  const response = await aliyunClient.sendSmsVerifyCode(
    new SendSmsVerifyCodeRequest({
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
    }),
  )

  return {
    code: response.body?.code,
    message: response.body?.message,
    provider: 'aliyun-dypnsapi',
    requestId: response.body?.model?.requestId || response.body?.requestId,
    success: response.body?.success,
    verifyCode: response.body?.model?.verifyCode || fallbackCode,
  }
}

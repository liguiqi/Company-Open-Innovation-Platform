import DysmsapiClient, { SendSmsRequest } from '@alicloud/dysmsapi20170525'
import { Config as OpenApiConfig } from '@alicloud/openapi-client'

import { appEnv } from '@/lib/env'

let client: DysmsapiClient | null = null

function getClient() {
  if (!appEnv.smsEnabled) {
    return null
  }

  if (!client) {
    client = new DysmsapiClient(
      new OpenApiConfig({
        accessKeyId: appEnv.ALIYUN_SMS_ACCESS_KEY_ID,
        accessKeySecret: appEnv.ALIYUN_SMS_ACCESS_KEY_SECRET,
        endpoint: 'dysmsapi.aliyuncs.com',
      }),
    )
  }

  return client
}

export async function sendSMSCode(phone: string, code: string) {
  const aliyunClient = getClient()

  if (!aliyunClient) {
    console.info(`[sms:mock] ${phone} -> ${code}`)
    return { mocked: true }
  }

  const response = await aliyunClient.sendSms(
    new SendSmsRequest({
      phoneNumbers: phone,
      signName: appEnv.ALIYUN_SMS_SIGN_NAME,
      templateCode: appEnv.ALIYUN_SMS_TEMPLATE_CODE,
      templateParam: JSON.stringify({ code }),
    }),
  )

  return response.body
}

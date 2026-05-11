import { existsSync } from 'node:fs'

import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

function parseBoolean(value?: string | null) {
  if (value == null || value === '') {
    return undefined
  }

  return /^(1|true|yes|on)$/i.test(value)
}

function parseCSV(value?: string | null) {
  if (value == null || value === '') {
    return []
  }

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeOrigin(value?: string | null) {
  if (value == null || value === '') {
    return undefined
  }

  try {
    return new URL(value).origin
  } catch {
    return value.replace(/\/+$/, '')
  }
}

function pickFirst(...values: Array<string | undefined>) {
  return values.find((value) => value != null && value !== '')
}

if (existsSync('.env.local')) {
  loadEnv({ path: '.env.local', override: false })
}

if (existsSync('.env')) {
  loadEnv({ path: '.env', override: false })
}

const envSchema = z.object({
  ALIYUN_ACCESS_KEY_ID: z.string().optional(),
  ALIYUN_ACCESS_KEY_SECRET: z.string().optional(),
  ALIYUN_SMS_ACCESS_KEY_ID: z.string().optional(),
  ALIYUN_SMS_ACCESS_KEY_SECRET: z.string().optional(),
  ALIYUN_SMS_COUNTRY_CODE: z.string().optional(),
  ALIYUN_SMS_ENDPOINT: z.string().optional(),
  ALIYUN_SMS_SCHEME_NAME: z.string().optional(),
  ALIYUN_SMS_SIGN: z.string().optional(),
  ALIYUN_SMS_SIGN_NAME: z.string().optional(),
  ALIYUN_SMS_TEMPLATE: z.string().optional(),
  ALIYUN_SMS_TEMPLATE_CODE: z.string().optional(),
  DATABASE_URI: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  DEFAULT_ADMIN_EMAIL: z.string().optional(),
  DEFAULT_ADMIN_PASSWORD: z.string().optional(),
  DEFAULT_ADMIN_USERNAME: z.string().optional(),
  DEFAULT_PARTNER_EMAIL: z.string().optional(),
  DEFAULT_PARTNER_NAME: z.string().optional(),
  DEFAULT_PARTNER_PASSWORD: z.string().optional(),
  DEFAULT_PARTNER_PHONE: z.string().optional(),
  DEFAULT_REVIEWER_EMAIL: z.string().optional(),
  DEFAULT_REVIEWER_PASSWORD: z.string().optional(),
  NEXT_PUBLIC_SERVER_URL: z.string().default('http://localhost:3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PAYLOAD_SECRET: z.string().default('development-only-payload-secret-please-change'),
  PAYLOAD_ALLOWED_ORIGINS: z.string().optional(),
  REDIS_URL: z.string().optional(),
  EMAIL_MOCK: z.string().optional(),
  SMS_MOCK: z.string().optional(),
  SMTP_FROM_ADDRESS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_SECURE: z.string().optional(),
  SMTP_TLS_REJECT_UNAUTHORIZED: z.string().optional(),
  SMTP_USER: z.string().optional(),
})

export const env = envSchema.parse({
  ALIYUN_ACCESS_KEY_ID: process.env.ALIYUN_ACCESS_KEY_ID,
  ALIYUN_ACCESS_KEY_SECRET: process.env.ALIYUN_ACCESS_KEY_SECRET,
  ALIYUN_SMS_ACCESS_KEY_ID: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
  ALIYUN_SMS_ACCESS_KEY_SECRET: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
  ALIYUN_SMS_COUNTRY_CODE: process.env.ALIYUN_SMS_COUNTRY_CODE,
  ALIYUN_SMS_ENDPOINT: process.env.ALIYUN_SMS_ENDPOINT,
  ALIYUN_SMS_SCHEME_NAME: process.env.ALIYUN_SMS_SCHEME_NAME,
  ALIYUN_SMS_SIGN: process.env.ALIYUN_SMS_SIGN,
  ALIYUN_SMS_SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME,
  ALIYUN_SMS_TEMPLATE: process.env.ALIYUN_SMS_TEMPLATE,
  ALIYUN_SMS_TEMPLATE_CODE: process.env.ALIYUN_SMS_TEMPLATE_CODE,
  DATABASE_URI: process.env.DATABASE_URI,
  DATABASE_URL: process.env.DATABASE_URL,
  DEFAULT_ADMIN_EMAIL: process.env.DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD: process.env.DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME: process.env.DEFAULT_ADMIN_USERNAME,
  DEFAULT_PARTNER_EMAIL: process.env.DEFAULT_PARTNER_EMAIL,
  DEFAULT_PARTNER_NAME: process.env.DEFAULT_PARTNER_NAME,
  DEFAULT_PARTNER_PASSWORD: process.env.DEFAULT_PARTNER_PASSWORD,
  DEFAULT_PARTNER_PHONE: process.env.DEFAULT_PARTNER_PHONE,
  DEFAULT_REVIEWER_EMAIL: process.env.DEFAULT_REVIEWER_EMAIL,
  DEFAULT_REVIEWER_PASSWORD: process.env.DEFAULT_REVIEWER_PASSWORD,
  NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
  NODE_ENV: process.env.NODE_ENV,
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  PAYLOAD_ALLOWED_ORIGINS: process.env.PAYLOAD_ALLOWED_ORIGINS,
  REDIS_URL: process.env.REDIS_URL,
  EMAIL_MOCK: process.env.EMAIL_MOCK,
  SMS_MOCK: process.env.SMS_MOCK,
  SMTP_FROM_ADDRESS: process.env.SMTP_FROM_ADDRESS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE,
  SMTP_TLS_REJECT_UNAUTHORIZED: process.env.SMTP_TLS_REJECT_UNAUTHORIZED,
  SMTP_USER: process.env.SMTP_USER,
})

export const appEnv = {
  ...env,
  emailMock: parseBoolean(env.EMAIL_MOCK) ?? false,
  smsAccessKeyId: pickFirst(env.ALIYUN_ACCESS_KEY_ID, env.ALIYUN_SMS_ACCESS_KEY_ID) || '',
  smsAccessKeySecret:
    pickFirst(env.ALIYUN_ACCESS_KEY_SECRET, env.ALIYUN_SMS_ACCESS_KEY_SECRET) || '',
  smsCountryCode: env.ALIYUN_SMS_COUNTRY_CODE || '86',
  smsEndpoint: env.ALIYUN_SMS_ENDPOINT || 'dypnsapi.aliyuncs.com',
  smsMock: parseBoolean(env.SMS_MOCK) ?? false,
  smsSchemeName: env.ALIYUN_SMS_SCHEME_NAME || '平台验证码',
  smsSignName: pickFirst(env.ALIYUN_SMS_SIGN, env.ALIYUN_SMS_SIGN_NAME) || '',
  smsTemplateCode: pickFirst(env.ALIYUN_SMS_TEMPLATE, env.ALIYUN_SMS_TEMPLATE_CODE) || '',
  smtpSecure: parseBoolean(env.SMTP_SECURE) ?? [465, 994].includes(env.SMTP_PORT || 0),
  smtpTlsRejectUnauthorized: parseBoolean(env.SMTP_TLS_REJECT_UNAUTHORIZED) ?? true,
  databaseURL: env.DATABASE_URI || env.DATABASE_URL || '',
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  payloadAllowedOrigins: Array.from(
    new Set(
      [env.NEXT_PUBLIC_SERVER_URL, ...parseCSV(env.PAYLOAD_ALLOWED_ORIGINS)]
        .map((value) => normalizeOrigin(value))
        .filter((value): value is string => Boolean(value)),
    ),
  ),
  smsEnabled:
    !(parseBoolean(env.SMS_MOCK) ?? false) &&
    Boolean(pickFirst(env.ALIYUN_ACCESS_KEY_ID, env.ALIYUN_SMS_ACCESS_KEY_ID)) &&
    Boolean(pickFirst(env.ALIYUN_ACCESS_KEY_SECRET, env.ALIYUN_SMS_ACCESS_KEY_SECRET)) &&
    Boolean(pickFirst(env.ALIYUN_SMS_SIGN, env.ALIYUN_SMS_SIGN_NAME)) &&
    Boolean(pickFirst(env.ALIYUN_SMS_TEMPLATE, env.ALIYUN_SMS_TEMPLATE_CODE)),
  smtpEnabled:
    !(parseBoolean(env.EMAIL_MOCK) ?? false) &&
    Boolean(env.SMTP_HOST) &&
    Boolean(env.SMTP_USER) &&
    Boolean(env.SMTP_PASS),
}

if (appEnv.isProduction) {
  const missing: string[] = []

  if (!appEnv.databaseURL) missing.push('DATABASE_URI')
  if (!env.PAYLOAD_SECRET || env.PAYLOAD_SECRET === 'development-only-payload-secret-please-change')
    missing.push('PAYLOAD_SECRET')
  if (!env.NEXT_PUBLIC_SERVER_URL) missing.push('NEXT_PUBLIC_SERVER_URL')

  if (missing.length > 0) {
    throw new Error(
      `[FATAL] Missing required production environment variables: ${missing.join(', ')}. Refusing to start.`,
    )
  }
}

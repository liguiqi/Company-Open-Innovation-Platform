import { existsSync } from 'node:fs'

import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

if (existsSync('.env.local')) {
  loadEnv({ path: '.env.local', override: false })
}

if (existsSync('.env')) {
  loadEnv({ path: '.env', override: false })
}

const envSchema = z.object({
  ALIYUN_SMS_ACCESS_KEY_ID: z.string().optional(),
  ALIYUN_SMS_ACCESS_KEY_SECRET: z.string().optional(),
  ALIYUN_SMS_SIGN_NAME: z.string().optional(),
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
  REDIS_URL: z.string().optional(),
  SMTP_FROM_ADDRESS: z.string().optional(),
  SMTP_FROM_NAME: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_PORT: z.coerce.number().optional(),
  SMTP_USER: z.string().optional(),
})

export const env = envSchema.parse({
  ALIYUN_SMS_ACCESS_KEY_ID: process.env.ALIYUN_SMS_ACCESS_KEY_ID,
  ALIYUN_SMS_ACCESS_KEY_SECRET: process.env.ALIYUN_SMS_ACCESS_KEY_SECRET,
  ALIYUN_SMS_SIGN_NAME: process.env.ALIYUN_SMS_SIGN_NAME,
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
  REDIS_URL: process.env.REDIS_URL,
  SMTP_FROM_ADDRESS: process.env.SMTP_FROM_ADDRESS,
  SMTP_FROM_NAME: process.env.SMTP_FROM_NAME,
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_USER: process.env.SMTP_USER,
})

export const appEnv = {
  ...env,
  databaseURL: env.DATABASE_URI || env.DATABASE_URL || '',
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  smsEnabled:
    Boolean(env.ALIYUN_SMS_ACCESS_KEY_ID) &&
    Boolean(env.ALIYUN_SMS_ACCESS_KEY_SECRET) &&
    Boolean(env.ALIYUN_SMS_SIGN_NAME) &&
    Boolean(env.ALIYUN_SMS_TEMPLATE_CODE),
  smtpEnabled: Boolean(env.SMTP_HOST) && Boolean(env.SMTP_USER) && Boolean(env.SMTP_PASS),
}

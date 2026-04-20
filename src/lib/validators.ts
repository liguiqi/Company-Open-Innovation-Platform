import { z } from 'zod'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phoneRegex = /^1\d{10}$/
const verificationCodeRegex = /^\d{6}$/

const optionalEmailSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '')
  .refine((value) => !value || emailRegex.test(value), '请输入正确的邮箱地址')

const optionalPhoneSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '')
  .refine((value) => !value || phoneRegex.test(value), '请输入正确的手机号码')

const optionalVerificationCodeSchema = z
  .string()
  .trim()
  .optional()
  .transform((value) => value ?? '')
  .refine((value) => !value || verificationCodeRegex.test(value), '请输入 6 位验证码')

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, '请输入邮箱或手机号')
    .refine((value) => emailRegex.test(value) || phoneRegex.test(value), '请输入邮箱或手机号'),
  password: z.string().min(6, '密码至少 6 位'),
})

export const registerSchema = z
  .object({
    company: z.string().trim().min(2, '请输入公司名称'),
    email: optionalEmailSchema,
    emailCode: optionalVerificationCodeSchema,
    name: z.string().trim().min(2, '请输入联系人姓名'),
    password: z.string().min(6, '密码至少 6 位'),
    passwordConfirm: z.string().min(6, '请再次输入密码'),
    phone: optionalPhoneSchema,
    smsCode: optionalVerificationCodeSchema,
    username: z
      .string()
      .trim()
      .min(2, '请输入用户名')
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名仅支持字母、数字、下划线和短横线'),
  })
  .refine((value) => Boolean(value.email) || Boolean(value.phone), {
    message: '请至少填写邮箱或手机号',
    path: ['email'],
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: '两次输入的密码不一致',
    path: ['passwordConfirm'],
  })
  .superRefine((value, ctx) => {
    const hasEmailVerification = Boolean(value.email && value.emailCode)
    const hasPhoneVerification = Boolean(value.phone && value.smsCode)

    if (value.emailCode && !value.email) {
      ctx.addIssue({
        code: 'custom',
        message: '请先填写邮箱再输入邮箱验证码',
        path: ['email'],
      })
    }

    if (value.smsCode && !value.phone) {
      ctx.addIssue({
        code: 'custom',
        message: '请先填写手机号再输入短信验证码',
        path: ['phone'],
      })
    }

    if (!hasEmailVerification && !hasPhoneVerification) {
      ctx.addIssue({
        code: 'custom',
        message: '邮箱验证码或短信验证码至少完成一种',
        path: ['emailCode'],
      })
    }
  })

export const emailCodeSendSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱地址')
    .refine((value) => emailRegex.test(value), '请输入正确的邮箱地址'),
})

export const smsSendSchema = z.object({
  phone: z.string().trim().regex(phoneRegex, '请输入正确的手机号码'),
})

export const smsVerifySchema = z.object({
  code: z.string().trim().regex(verificationCodeRegex, '请输入 6 位验证码'),
  name: z.string().trim().optional(),
  phone: z.string().trim().regex(phoneRegex, '请输入正确的手机号码'),
})

export const proposalCreateSchema = z.object({
  contactCompany: z.string().trim().min(2, '请输入公司名称'),
  contactEmail: z.email('请输入正确的邮箱地址'),
  contactName: z.string().trim().min(2, '请输入联系人姓名'),
  description: z.string().trim().min(20, '请至少填写 20 个字符的技术描述'),
  relatedNeed: z.string().trim().optional(),
  title: z.string().trim().min(5, '请填写完整方案标题'),
  type: z.enum(['specific-need', 'open-proposal', 'investment', 'partnership']),
})

export const proposalReviewSchema = z.object({
  reviewNotes: z.string().trim().min(6, '请填写评审意见'),
  status: z.enum(['pending', 'reviewing', 'approved', 'rejected']),
})

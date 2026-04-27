import { z } from 'zod'

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const phoneRegex = /^1\d{10}$/
export const verificationCodeRegex = /^\d{6}$/
export const USER_PASSWORD_MIN_LENGTH = 6
export const USERNAME_REGEX = /^[a-zA-Z0-9_-]+$/

export function getLoginIdentifierType(identifier: string) {
  const normalizedIdentifier = identifier.trim()

  if (emailRegex.test(normalizedIdentifier)) {
    return 'email' as const
  }

  if (phoneRegex.test(normalizedIdentifier)) {
    return 'phone' as const
  }

  return null
}

const loginIdentifierSchema = z
  .string()
  .trim()
  .min(1, '请输入邮箱或手机号')
  .refine((value) => getLoginIdentifierType(value) !== null, '请输入邮箱或手机号')

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
  identifier: loginIdentifierSchema,
  password: z.string().min(USER_PASSWORD_MIN_LENGTH, `密码至少 ${USER_PASSWORD_MIN_LENGTH} 位`),
})

export const registerSchema = z
  .object({
    company: z.string().trim().min(2, '请输入公司名称'),
    email: optionalEmailSchema,
    emailCode: optionalVerificationCodeSchema,
    name: z.string().trim().min(2, '请输入联系人姓名'),
    password: z.string().min(USER_PASSWORD_MIN_LENGTH, `密码至少 ${USER_PASSWORD_MIN_LENGTH} 位`),
    passwordConfirm: z
      .string()
      .min(USER_PASSWORD_MIN_LENGTH, `请再次输入至少 ${USER_PASSWORD_MIN_LENGTH} 位密码`),
    phone: optionalPhoneSchema,
    smsCode: optionalVerificationCodeSchema,
    username: z
      .string()
      .trim()
      .min(2, '请输入用户名')
      .regex(USERNAME_REGEX, '用户名仅支持字母、数字、下划线和短横线'),
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

export const profileUpdateSchema = z.object({
  company: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine((value) => !value || value.length >= 2, '请输入至少 2 个字符的公司名称'),
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱地址')
    .refine((value) => emailRegex.test(value), '请输入正确的邮箱地址'),
  name: z.string().trim().min(2, '请输入联系人姓名'),
  phone: optionalPhoneSchema,
  username: z
    .string()
    .trim()
    .min(2, '请输入用户名')
    .regex(USERNAME_REGEX, '用户名仅支持字母、数字、下划线和短横线'),
})

export const emailCodeSendSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, '请输入邮箱地址')
    .refine((value) => emailRegex.test(value), '请输入正确的邮箱地址'),
})

export const loginCodeSendSchema = z.object({
  identifier: loginIdentifierSchema,
})

export const loginCodeVerifySchema = z.object({
  code: z.string().trim().regex(verificationCodeRegex, '请输入 6 位验证码'),
  identifier: loginIdentifierSchema,
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

export const techNeedUpsertSchema = z.object({
  description: z.string().trim().min(20, '请至少填写 20 个字符的需求描述'),
  domain: z.enum(['motor-control', 'sensor', 'materials', 'ai']),
  priority: z.enum(['urgent', 'open', 'joint-research']),
  productLine: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine((value) => !value || value.length >= 2, '产品线名称至少 2 个字符'),
  publishedAt: z
    .string()
    .trim()
    .min(1, '请选择发布日期')
    .refine((value) => !Number.isNaN(Date.parse(value)), '发布日期格式无效'),
  status: z.enum(['open', 'in-progress', 'closed']),
  title: z.string().trim().min(4, '请填写完整需求标题'),
})

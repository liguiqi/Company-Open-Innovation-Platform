import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, '请输入邮箱或用户名'),
  password: z.string().min(6, '密码至少 6 位'),
})

export const registerSchema = z
  .object({
    company: z.string().trim().min(2, '请输入公司名称'),
    email: z.email('请输入正确的邮箱地址'),
    name: z.string().trim().min(2, '请输入联系人姓名'),
    password: z.string().min(6, '密码至少 6 位'),
    passwordConfirm: z.string().min(6, '请再次输入密码'),
    phone: z
      .string()
      .trim()
      .regex(/^1\d{10}$/, '请输入正确的手机号码')
      .optional()
      .or(z.literal('')),
    username: z
      .string()
      .trim()
      .min(2, '请输入用户名')
      .regex(/^[a-zA-Z0-9_-]+$/, '用户名仅支持字母、数字、下划线和短横线'),
  })
  .refine((value) => value.password === value.passwordConfirm, {
    message: '两次输入的密码不一致',
    path: ['passwordConfirm'],
  })

export const smsSendSchema = z.object({
  phone: z
    .string()
    .trim()
    .regex(/^1\d{10}$/, '请输入正确的手机号码'),
})

export const smsVerifySchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, '请输入 6 位验证码'),
  name: z.string().trim().optional(),
  phone: z
    .string()
    .trim()
    .regex(/^1\d{10}$/, '请输入正确的手机号码'),
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

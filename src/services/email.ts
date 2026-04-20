import nodemailer from 'nodemailer'

import type { Proposal, User } from '@/payload-types'

import { appEnv } from '@/lib/env'

let transporterPromise: Promise<nodemailer.Transporter | null> | null = null

type SendEmailResult =
  | {
      skipped: true
    }
  | nodemailer.SentMessageInfo

async function getTransporter() {
  if (!appEnv.smtpEnabled || appEnv.emailMock) {
    return null
  }

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        auth: {
          pass: appEnv.SMTP_PASS,
          user: appEnv.SMTP_USER,
        },
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        host: appEnv.SMTP_HOST,
        port: appEnv.SMTP_PORT || 25,
        secure: appEnv.smtpSecure,
        socketTimeout: 10000,
        tls: {
          rejectUnauthorized: appEnv.smtpTlsRejectUnauthorized,
        },
      }),
    )
  }

  return transporterPromise
}

export async function sendEmail({
  html,
  subject,
  text,
  to,
}: {
  html: string
  subject: string
  text: string
  to: string | string[]
}): Promise<SendEmailResult> {
  const transporter = await getTransporter()

  if (!transporter) {
    return { skipped: true }
  }

  try {
    return await transporter.sendMail({
      from: `${appEnv.SMTP_FROM_NAME || 'H&T Innovation Platform'} <${appEnv.SMTP_FROM_ADDRESS || appEnv.SMTP_USER}>`,
      html,
      subject,
      text,
      to,
    })
  } catch (error) {
    console.error('[email:send-failed]', error)
    return { skipped: true }
  }
}

export async function sendVerificationEmail(user: Pick<User, 'email' | 'name'>, token: string) {
  const verifyURL = `${appEnv.NEXT_PUBLIC_SERVER_URL}/verify?token=${token}`
  return sendEmail({
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#1f2937">
        <h2 style="color:#004098">完成邮箱验证</h2>
        <p>${user.name}，欢迎加入Open Innovation Platform。</p>
        <p>请点击下方链接完成邮箱验证，验证后即可使用邮箱密码登录并提交方案。</p>
        <p><a href="${verifyURL}" style="display:inline-block;padding:12px 20px;background:#00A0E9;color:#fff;text-decoration:none;border-radius:999px">立即验证邮箱</a></p>
        <p>如果按钮无法打开，请复制以下链接：</p>
        <p>${verifyURL}</p>
      </div>
    `,
    subject: '请验证您的Open Innovation Platform邮箱',
    text: `请访问以下链接完成邮箱验证：${verifyURL}`,
    to: user.email,
  })
}

export async function sendRegistrationCodeEmail(email: string, code: string) {
  return sendEmail({
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#1f2937">
        <h2 style="color:#004098">注册验证码</h2>
        <p>您正在注册Open Innovation Platform账号。</p>
        <p>本次邮箱验证码为：</p>
        <p style="margin:16px 0;font-size:28px;font-weight:700;letter-spacing:6px;color:#00A0E9">${code}</p>
        <p>验证码 5 分钟内有效。如非本人操作，请忽略此邮件。</p>
      </div>
    `,
    subject: 'Open Innovation Platform注册验证码',
    text: `您正在注册Open Innovation Platform账号，本次邮箱验证码为：${code}。验证码 5 分钟内有效。`,
    to: email,
  })
}

export async function sendProposalCreatedNotification(
  proposal: Proposal,
  reviewerEmails: string[],
) {
  if (!reviewerEmails.length) {
    return { skipped: true }
  }

  const proposalURL = `${appEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/proposals/${proposal.id}`
  return sendEmail({
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#1f2937">
        <h2 style="color:#004098">有新的创新方案待处理</h2>
        <p>方案标题：${proposal.title}</p>
        <p>请尽快进入评审工作台查看。</p>
        <p><a href="${proposalURL}" style="display:inline-block;padding:12px 20px;background:#004098;color:#fff;text-decoration:none;border-radius:999px">查看方案</a></p>
      </div>
    `,
    subject: `新方案提交：${proposal.title}`,
    text: `有新的创新方案待评审：${proposal.title}。查看地址：${proposalURL}`,
    to: reviewerEmails,
  })
}

export async function sendProposalStatusNotification(
  proposal: Pick<Proposal, 'id' | 'status' | 'title'>,
  recipientEmail: string,
) {
  const proposalURL = `${appEnv.NEXT_PUBLIC_SERVER_URL}/dashboard/proposals/${proposal.id}`
  return sendEmail({
    html: `
      <div style="font-family:Arial,'Microsoft YaHei',sans-serif;line-height:1.7;color:#1f2937">
        <h2 style="color:#004098">您的方案状态已更新</h2>
        <p>方案标题：${proposal.title}</p>
        <p>当前状态：${proposal.status}</p>
        <p><a href="${proposalURL}" style="display:inline-block;padding:12px 20px;background:#00A0E9;color:#fff;text-decoration:none;border-radius:999px">查看详情</a></p>
      </div>
    `,
    subject: `方案状态更新：${proposal.title}`,
    text: `您的方案《${proposal.title}》状态已更新为 ${proposal.status}。查看：${proposalURL}`,
    to: recipientEmail,
  })
}

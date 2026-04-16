import Link from 'next/link'
import { redirect } from 'next/navigation'

import { SectionHeading } from '@/components/shared/SectionHeading'
import { getCurrentUser } from '@/lib/auth'

export default async function SubmitPage({
  searchParams,
}: {
  searchParams: Promise<{ need?: string }>
}) {
  const user = await getCurrentUser()
  const { need } = await searchParams

  if (user) {
    redirect(`/dashboard/proposals/new${need ? `?need=${need}` : ''}`)
  }

  return (
    <div className="container-shell py-16">
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="theme-card-contrast rounded-[1rem] p-10 shadow-sm shadow-slate-300/50">
          <SectionHeading
            description="方案提交需要先登录合作伙伴账号。登录后可上传资料、关联公开需求，并在工作台中追踪评审状态。"
            eyebrow="Submit"
            tone="contrast"
            title="提交您的创新方案"
          />
          <div className="mt-10 space-y-5 text-sm leading-7 text-[var(--ht-contrast-muted)]">
            <p>1. 使用邮箱密码或手机短信完成认证。</p>
            <p>2. 选择公开需求或开放式技术自荐类型。</p>
            <p>3. 填写技术摘要、联系人信息并上传附件。</p>
            <p>4. 在工作台跟踪评审流转和邮件通知。</p>
          </div>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              className="theme-accent-button rounded-md px-6 py-3 text-sm font-semibold"
              href={`/login${need ? `?redirect=/dashboard/proposals/new?need=${need}` : ''}`}
            >
              登录后提交
            </Link>
            <Link
              className="rounded-md border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10 hover:text-white"
              href="/register"
            >
              注册合作伙伴账号
            </Link>
          </div>
        </div>

        <div className="theme-card rounded-[1rem] p-8">
          <p className="text-xs uppercase tracking-[0.35em] text-ht-light-blue">Notice</p>
          <h2 className="mt-4 font-display text-4xl font-semibold text-[var(--ht-text-primary)]">
            提交前说明
          </h2>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[var(--ht-text-secondary)]">
            <p>平台接受 PDF、PPT、Word 等附件，建议控制在 20MB 以内。</p>
            <p>评审时效通常为 3 至 5 个工作日，特殊需求会触发评审员加速流程。</p>
            <p>未签署 NDA 前，请勿直接上传源代码、未公开电路图或其他核心机密资料。</p>
            <p>如果需要短信验证，未配置正式模板时开发环境会自动启用 mock 验证码联调。</p>
          </div>
        </div>
      </div>
    </div>
  )
}

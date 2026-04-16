'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

type NeedOption = {
  id: number | string
  needId?: string | null
  title: string
}

export function ProposalForm({
  defaultNeedId,
  needs,
}: {
  defaultNeedId?: number | string | null
  needs: NeedOption[]
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const needsMap = useMemo(() => new Map(needs.map((need) => [String(need.id), need])), [needs])

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/proposals', {
        body: formData,
        method: 'POST',
      })

      const rawText = await response.text()
      const data = rawText ? JSON.parse(rawText) : null

      if (!response.ok) {
        setError(data?.error || '提交失败，请稍后重试')
        return
      }

      router.push(`/dashboard/proposals/${data.id}`)
      router.refresh()
    } catch {
      setError('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={onSubmit} className="theme-dashboard-panel space-y-8 rounded-[1rem] p-8">
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          方案类型
          <select
            className="theme-input w-full rounded-lg px-4 py-3"
            defaultValue={defaultNeedId ? 'specific-need' : 'open-proposal'}
            name="type"
          >
            <option value="specific-need">响应公开需求</option>
            <option value="open-proposal">开放式技术自荐</option>
            <option value="investment">寻求战略投资</option>
            <option value="partnership">申请加入生态联盟</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          关联需求
          <select
            className="theme-input w-full rounded-lg px-4 py-3"
            defaultValue={defaultNeedId ? String(defaultNeedId) : ''}
            name="relatedNeed"
          >
            <option value="">不关联具体需求</option>
            {needs.map((need) => (
              <option key={need.id} value={need.id}>
                {need.needId ? `${need.needId} · ` : ''}
                {need.title}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
        <label>方案标题</label>
        <input
          className="theme-input w-full rounded-lg px-4 py-3"
          name="title"
          placeholder={
            defaultNeedId
              ? `例如：${needsMap.get(String(defaultNeedId))?.title || '针对需求的创新方案'}`
              : '例如：适用于电动工具的高密度 GaN 驱动方案'
          }
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
        <label>技术描述</label>
        <textarea
          className="theme-input min-h-44 w-full rounded-[0.75rem] px-4 py-3"
          name="description"
          placeholder="请简要说明技术优势、TRL 成熟度、验证情况和相对竞品的差异。"
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
        <label>附件上传</label>
        <input
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          className="block w-full rounded-[0.75rem] border border-dashed border-[color:var(--ht-input-border)] bg-[var(--ht-input-bg)] px-4 py-4 text-[var(--ht-text-secondary)]"
          multiple
          name="attachments"
          type="file"
        />
        <p className="text-xs text-[var(--ht-text-muted)]">
          支持 PDF / PPT / Word，单文件建议不超过 20MB。
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          联系人姓名
          <input className="theme-input w-full rounded-lg px-4 py-3" name="contactName" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          联系邮箱
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="contactEmail"
            required
            type="email"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          公司名称
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="contactCompany"
            required
          />
        </label>
      </div>

      <div
        className="rounded-[0.75rem] border p-5 text-sm leading-7"
        style={{
          background: 'var(--ht-warning-bg)',
          borderColor: 'var(--ht-warning-border)',
          color: 'var(--ht-warning-text)',
        }}
      >
        <p className="font-semibold">知识产权保护声明</p>
        <p className="mt-2">
          在正式签署双边 NDA
          之前，请勿上传核心源代码、未公开电路图及其他绝密资料。首轮提交仅用于合作意向与技术方向评估。
        </p>
      </div>

      {error ? (
        <p
          className="rounded-lg border px-4 py-3 text-sm"
          style={{
            background: 'var(--ht-danger-bg)',
            borderColor: 'var(--ht-danger-border)',
            color: 'var(--ht-danger-text)',
          }}
        >
          {error}
        </p>
      ) : null}

      <button
        className="theme-primary-button w-full rounded-md px-6 py-4 text-base font-semibold disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? '提交中...' : '确认提交申请'}
      </button>
    </form>
  )
}

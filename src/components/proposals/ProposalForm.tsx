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

    const response = await fetch('/api/proposals', {
      body: formData,
      method: 'POST',
    })

    const data = await response.json()
    setIsSubmitting(false)

    if (!response.ok) {
      setError(data.error || '提交失败，请稍后重试')
      return
    }

    router.push(`/dashboard/proposals/${data.id}`)
    router.refresh()
  }

  return (
    <form
      action={onSubmit}
      className="space-y-8 rounded-[2rem] border border-white/70 bg-white p-8 shadow-2xl shadow-slate-200/70"
    >
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          方案类型
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
            defaultValue={defaultNeedId ? 'specific-need' : 'open-proposal'}
            name="type"
          >
            <option value="specific-need">响应公开需求</option>
            <option value="open-proposal">开放式技术自荐</option>
            <option value="investment">寻求战略投资</option>
            <option value="partnership">申请加入生态联盟</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          关联需求
          <select
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
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

      <div className="space-y-2 text-sm font-medium text-slate-700">
        <label>方案标题</label>
        <input
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
          name="title"
          placeholder={
            defaultNeedId
              ? `例如：${needsMap.get(String(defaultNeedId))?.title || '针对需求的创新方案'}`
              : '例如：适用于电动工具的高密度 GaN 驱动方案'
          }
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-slate-700">
        <label>技术描述</label>
        <textarea
          className="min-h-44 w-full rounded-[1.5rem] border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
          name="description"
          placeholder="请简要说明技术优势、TRL 成熟度、验证情况和相对竞品的差异。"
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-slate-700">
        <label>附件上传</label>
        <input
          accept=".pdf,.ppt,.pptx,.doc,.docx"
          className="block w-full rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 px-4 py-4"
          multiple
          name="attachments"
          type="file"
        />
        <p className="text-xs text-slate-400">支持 PDF / PPT / Word，单文件建议不超过 20MB。</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          联系人姓名
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
            name="contactName"
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          联系邮箱
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
            name="contactEmail"
            required
            type="email"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          公司名称
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
            name="contactCompany"
            required
          />
        </label>
      </div>

      <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 p-5 text-sm leading-7 text-amber-800">
        <p className="font-semibold">知识产权保护声明</p>
        <p className="mt-2">
          在正式签署双边 NDA
          之前，请勿上传核心源代码、未公开电路图及其他绝密资料。首轮提交仅用于合作意向与技术方向评估。
        </p>
      </div>

      {error ? (
        <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        className="w-full rounded-full bg-ht-blue px-6 py-4 text-base font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? '提交中...' : '确认提交申请'}
      </button>
    </form>
  )
}

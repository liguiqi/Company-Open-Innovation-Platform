'use client'

import type { ChangeEvent, FormEvent } from 'react'

import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'

import { emitRouteTransitionStart } from '@/lib/navigation'

type NeedOption = {
  id: number | string
  needId?: string | null
  title: string
}

type SelectedAttachment = {
  file: File
  id: string
}

function buildAttachmentSignature(file: File) {
  return `${file.name}-${file.size}-${file.type}`
}

function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function buildAttachmentId(file: File, index: number) {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `${file.name}-${file.size}-${file.lastModified}-${Date.now()}-${index}`
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
  const [selectedAttachments, setSelectedAttachments] = useState<SelectedAttachment[]>([])

  const needsMap = useMemo(() => new Map(needs.map((need) => [String(need.id), need])), [needs])

  function onAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFiles = Array.from(event.target.files || [])

    if (!nextFiles.length) {
      return
    }

    setSelectedAttachments((current) => {
      const existingSignatures = new Set(current.map(({ file }) => buildAttachmentSignature(file)))

      const appended = nextFiles
        .filter((file) => !existingSignatures.has(buildAttachmentSignature(file)))
        .map((file, index) => ({
          file,
          id: buildAttachmentId(file, index),
        }))

      return [...current, ...appended]
    })

    event.target.value = ''
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const formData = new FormData(event.currentTarget)
      formData.delete('attachments')

      selectedAttachments.forEach(({ file }) => {
        formData.append('attachments', file, file.name)
      })

      const response = await fetch('/api/partner/proposals', {
        body: formData,
        method: 'POST',
      })

      const rawText = await response.text()
      const data = rawText ? JSON.parse(rawText) : null

      if (!response.ok) {
        setError(data?.error || '提交失败，请稍后重试')
        return
      }

      emitRouteTransitionStart()
      router.push(`/dashboard/proposals/${data.id}`)
      router.refresh()
    } catch {
      setError('提交失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className="theme-dashboard-panel space-y-8 rounded-[1rem] p-8" onSubmit={onSubmit}>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
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

        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
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

      <div className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
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

      <div className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
        <label>技术描述</label>
        <textarea
          className="theme-input min-h-44 w-full rounded-[0.75rem] px-4 py-3"
          name="description"
          placeholder="请简要说明技术优势、TRL 成熟度、验证情况和相对竞品的差异。"
          required
        />
      </div>

      <div className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
        <label>附件上传</label>
        <input
          accept=".txt,.pdf,.ppt,.pptx,.doc,.docx,.zip,.rar,text/plain,application/zip,application/x-rar-compressed,application/vnd.rar"
          className="block w-full rounded-[0.75rem] border border-dashed border-[color:var(--oip-input-border)] bg-[var(--oip-input-bg)] px-4 py-4 text-[var(--oip-text-secondary)]"
          multiple
          name="attachments"
          onChange={onAttachmentChange}
          type="file"
        />
        <p className="text-xs text-[var(--oip-text-muted)]">
          支持 TXT / PDF / PPT / Word / ZIP / RAR，可一次选择多个文件；单文件建议不超过 100MB。
        </p>

        {selectedAttachments.length ? (
          <div className="overflow-hidden rounded-[0.75rem] border border-[color:var(--oip-border-soft)] bg-[var(--oip-card-soft)]">
            <div className="grid grid-cols-[minmax(0,1fr)_88px_64px] gap-2 border-b border-[color:var(--oip-border-soft)] px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--oip-text-muted)]">
              <span>附件名称</span>
              <span className="text-right">大小</span>
              <span className="text-right">操作</span>
            </div>

            <div className="divide-y divide-[color:var(--oip-border-soft)]">
              {selectedAttachments.map(({ file, id }) => (
                <div
                  key={id}
                  className="grid grid-cols-[minmax(0,1fr)_88px_64px] items-center gap-2 px-3 py-2 text-sm text-[var(--oip-text-secondary)]"
                >
                  <span className="truncate font-medium text-[var(--oip-text-primary)]">
                    {file.name}
                  </span>
                  <span className="text-right text-xs text-[var(--oip-text-muted)]">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    className="justify-self-end rounded-md border border-[color:var(--oip-border-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--oip-text-secondary)] transition hover:border-rose-300 hover:text-rose-500"
                    onClick={() => {
                      setSelectedAttachments((current) =>
                        current.filter((attachment) => attachment.id !== id),
                      )
                    }}
                    type="button"
                  >
                    取消
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
          联系人姓名
          <input className="theme-input w-full rounded-lg px-4 py-3" name="contactName" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
          联系邮箱
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="contactEmail"
            required
            type="email"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
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
          background: 'var(--oip-warning-bg)',
          borderColor: 'var(--oip-warning-border)',
          color: 'var(--oip-warning-text)',
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
            background: 'var(--oip-danger-bg)',
            borderColor: 'var(--oip-danger-border)',
            color: 'var(--oip-danger-text)',
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

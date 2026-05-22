'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function ProposalReviewForm({
  defaultNotes,
  proposalId,
  status,
}: {
  defaultNotes?: string
  proposalId: number | string
  status?: string | null
}) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [reviewNotesValue, setReviewNotesValue] = useState(defaultNotes || '')
  const [statusValue, setStatusValue] = useState(status || 'reviewing')

  useEffect(() => {
    setReviewNotesValue(defaultNotes || '')
  }, [defaultNotes])

  useEffect(() => {
    setStatusValue(status || 'reviewing')
  }, [status])

  async function onSubmit(formData: FormData) {
    setIsSubmitting(true)
    setError(null)

    const nextStatus = String(formData.get('status') || statusValue || 'reviewing')
    const nextNotes = String(formData.get('reviewNotes') || reviewNotesValue || '')

    try {
      const response = await fetch(`/api/proposals/${proposalId}/status`, {
        body: JSON.stringify({
          reviewNotes: nextNotes,
          status: nextStatus,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      const rawText = await response.text()
      const data = rawText ? JSON.parse(rawText) : null

      if (!response.ok) {
        setError(data?.error || '评审更新失败')
        return
      }

      setStatusValue(nextStatus)
      setReviewNotesValue(nextNotes)
      router.refresh()
    } catch {
      setError('评审更新失败，请稍后重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form action={onSubmit} className="theme-dashboard-panel space-y-5 rounded-[1rem] p-6">
      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
          状态流转
          <select
            className="theme-input w-full rounded-lg px-4 py-3"
            name="status"
            onChange={(event) => setStatusValue(event.target.value)}
            value={statusValue}
          >
            <option value="pending">待评审</option>
            <option value="reviewing">评审中</option>
            <option value="approved">通过</option>
            <option value="rejected">驳回</option>
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
          评审意见
          <textarea
            className="theme-input min-h-36 w-full rounded-[0.75rem] px-4 py-3"
            name="reviewNotes"
            onChange={(event) => setReviewNotesValue(event.target.value)}
            placeholder="请填写技术可行性、推进建议、PoC 条件或驳回原因。"
            required
            value={reviewNotesValue}
          />
        </label>
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
        className="theme-primary-button rounded-md px-5 py-3 text-sm font-semibold disabled:opacity-60"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? '更新中...' : '保存评审结果'}
      </button>
    </form>
  )
}

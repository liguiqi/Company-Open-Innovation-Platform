'use client'

import type { TechNeed, User } from '@/payload-types'

import Link from 'next/link'
import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { CalendarDays, ClipboardList, FolderKanban, Sparkles } from 'lucide-react'

import { NeedPriorityBadge, NeedStatusBadge } from '@/components/shared/StatusBadge'
import { needDomainMap, needPriorityMap, needStatusMap } from '@/lib/constants'
import { lexicalToPlainText } from '@/lib/richtext'
import { formatDate, getNeedDomainLabel } from '@/lib/utils'

type DashboardNeed = Pick<
  TechNeed,
  | 'description'
  | 'domain'
  | 'id'
  | 'needId'
  | 'priority'
  | 'productLine'
  | 'publishedAt'
  | 'status'
  | 'title'
>

type NeedFormState = {
  description: string
  domain: string
  priority: string
  productLine: string
  publishedAt: string
  status: string
  title: string
}

function todayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

function toInputDate(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : todayInputValue()
}

function createEmptyForm(): NeedFormState {
  return {
    description: '',
    domain: 'motor-control',
    priority: 'open',
    productLine: '',
    publishedAt: todayInputValue(),
    status: 'open',
    title: '',
  }
}

function toFormState(need: DashboardNeed): NeedFormState {
  return {
    description: lexicalToPlainText(need.description),
    domain: need.domain || 'motor-control',
    priority: need.priority || 'open',
    productLine: need.productLine || '',
    publishedAt: toInputDate(need.publishedAt),
    status: need.status || 'open',
    title: need.title,
  }
}

function truncateText(value: string, maxLength = 120) {
  const normalized = value.trim()

  if (normalized.length <= maxLength) {
    return normalized
  }

  return `${normalized.slice(0, maxLength).trim()}...`
}

export function TechNeedsManager({ needs, role }: { needs: DashboardNeed[]; role: User['role'] }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(needs[0] ? String(needs[0].id) : null)
  const [mode, setMode] = useState<'create' | 'edit'>(needs.length ? 'edit' : 'create')
  const [form, setForm] = useState<NeedFormState>(
    needs[0] ? toFormState(needs[0]) : createEmptyForm(),
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const counts = useMemo(
    () => ({
      all: needs.length,
      closed: needs.filter((need) => need.status === 'closed').length,
      inProgress: needs.filter((need) => need.status === 'in-progress').length,
      open: needs.filter((need) => need.status === 'open').length,
    }),
    [needs],
  )

  const selectedNeed =
    mode === 'edit' ? (needs.find((need) => String(need.id) === activeId) ?? null) : null

  useEffect(() => {
    if (mode === 'create') {
      return
    }

    if (!selectedNeed) {
      if (needs[0]) {
        setActiveId(String(needs[0].id))
        setForm(toFormState(needs[0]))
      } else {
        setMode('create')
        setActiveId(null)
        setForm(createEmptyForm())
      }

      return
    }

    setForm(toFormState(selectedNeed))
  }, [activeId, mode, needs, selectedNeed])

  function switchToCreateMode() {
    setMode('create')
    setActiveId(null)
    setForm(createEmptyForm())
    setError(null)
    setSuccess(null)
  }

  function switchToEditMode(need: DashboardNeed) {
    setMode('edit')
    setActiveId(String(need.id))
    setForm(toFormState(need))
    setError(null)
    setSuccess(null)
  }

  function updateField(field: keyof NeedFormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function validateForm() {
    if (form.title.trim().length < 4) {
      return '请填写完整需求标题'
    }

    if (form.productLine.trim() && form.productLine.trim().length < 2) {
      return '产品线名称至少 2 个字符'
    }

    if (form.description.trim().length < 20) {
      return '请至少填写 20 个字符的需求描述'
    }

    if (!form.publishedAt) {
      return '请选择发布日期'
    }

    return null
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationMessage = validateForm()

    if (validationMessage) {
      setError(validationMessage)
      setSuccess(null)
      return
    }

    setSaving(true)
    setError(null)
    setSuccess(null)

    const endpoint =
      mode === 'create' ? '/api/dashboard/tech-needs' : `/api/dashboard/tech-needs/${activeId}`
    const method = mode === 'create' ? 'POST' : 'PATCH'

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(form),
        headers: {
          'Content-Type': 'application/json',
        },
        method,
      })

      const rawText = await response.text()
      const data = rawText ? JSON.parse(rawText) : null

      if (!response.ok) {
        setError(data?.error || '保存失败，请稍后重试')
        return
      }

      if (data?.need?.id) {
        setMode('edit')
        setActiveId(String(data.need.id))
      }

      setSuccess(data?.message || '技术需求已保存')
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setError('保存失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="theme-page-title text-3xl font-semibold">需求发布</h2>
          <p className="theme-page-description mt-2 text-sm">
            面向管理员与评审员开放的技术需求运营台。这里创建或更新的需求，会同步影响公开站需求大厅与方案关联视图。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {role === 'admin' ? (
            <Link
              className="theme-outline-button rounded-md px-4 py-2 text-sm font-medium"
              href="/admin/collections/tech-needs"
            >
              后台字段页
            </Link>
          ) : null}
          <button
            className="theme-primary-button rounded-md px-4 py-2 text-sm font-medium"
            onClick={switchToCreateMode}
            type="button"
          >
            新建需求
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="theme-dashboard-panel rounded-xl p-5">
          <div className="flex items-center gap-3 text-[var(--oip-text-secondary)]">
            <ClipboardList size={16} />
            <span className="text-sm">需求总数</span>
          </div>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--oip-text-primary)]">
            {counts.all}
          </p>
        </div>
        <div className="theme-dashboard-panel rounded-xl p-5">
          <div className="flex items-center gap-3 text-[var(--oip-text-secondary)]">
            <Sparkles size={16} />
            <span className="text-sm">开放中</span>
          </div>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--oip-text-primary)]">
            {counts.open}
          </p>
        </div>
        <div className="theme-dashboard-panel rounded-xl p-5">
          <div className="flex items-center gap-3 text-[var(--oip-text-secondary)]">
            <FolderKanban size={16} />
            <span className="text-sm">推进中</span>
          </div>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--oip-text-primary)]">
            {counts.inProgress}
          </p>
        </div>
        <div className="theme-dashboard-panel rounded-xl p-5">
          <div className="flex items-center gap-3 text-[var(--oip-text-secondary)]">
            <CalendarDays size={16} />
            <span className="text-sm">已关闭</span>
          </div>
          <p className="mt-4 font-display text-4xl font-semibold text-[var(--oip-text-primary)]">
            {counts.closed}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="space-y-4">
          {needs.length ? (
            needs.map((need) => {
              const plainText = lexicalToPlainText(need.description)
              const isActive = mode === 'edit' && String(need.id) === activeId

              return (
                <button
                  key={need.id}
                  className={`theme-dashboard-panel w-full rounded-xl p-6 text-left transition ${
                    isActive
                      ? 'border-[color:var(--oip-primary)] shadow-[0_0_0_1px_var(--oip-primary)]'
                      : ''
                  }`}
                  onClick={() => switchToEditMode(need)}
                  type="button"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <NeedPriorityBadge priority={need.priority} />
                        <NeedStatusBadge status={need.status} />
                        <span className="text-xs font-mono text-[var(--oip-text-muted)]">
                          {need.needId}
                        </span>
                      </div>
                      <h3 className="mt-4 text-2xl font-semibold text-[var(--oip-text-primary)]">
                        {need.title}
                      </h3>
                      <p className="mt-2 text-sm text-[var(--oip-text-muted)]">
                        {getNeedDomainLabel(need.domain)} · {need.productLine || '未指定产品线'} ·
                        发布日期 {formatDate(need.publishedAt)}
                      </p>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-3 text-sm font-medium">
                      <Link
                        className="text-ht-light-blue"
                        href={`/needs/${need.needId}`}
                        rel="noreferrer"
                        target="_blank"
                      >
                        查看公开页
                      </Link>
                      {role === 'admin' ? (
                        <Link
                          className="text-[var(--oip-text-secondary)]"
                          href={`/admin/collections/tech-needs/${need.id}`}
                          rel="noreferrer"
                          target="_blank"
                        >
                          后台详情
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-[var(--oip-text-secondary)]">
                    {truncateText(plainText || '暂无需求描述')}
                  </p>
                </button>
              )
            })
          ) : (
            <div className="theme-dashboard-panel rounded-xl p-6">
              <h3 className="text-xl font-semibold text-[var(--oip-text-primary)]">暂无技术需求</h3>
              <p className="mt-3 text-sm leading-7 text-[var(--oip-text-secondary)]">
                当前尚未录入公开需求，可以直接在右侧创建第一条技术需求。
              </p>
            </div>
          )}
        </div>

        <form className="theme-dashboard-panel h-fit rounded-xl p-6" onSubmit={onSubmit}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[var(--oip-text-muted)]">
                {mode === 'create' ? 'Create Need' : 'Update Need'}
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-[var(--oip-text-primary)]">
                {mode === 'create' ? '创建技术需求' : '编辑技术需求'}
              </h3>
              <p className="mt-2 text-sm text-[var(--oip-text-muted)]">
                {selectedNeed?.needId
                  ? `当前编号：${selectedNeed.needId}`
                  : '保存后将自动生成 RD-年份-流水号'}
              </p>
            </div>
            {mode === 'edit' ? (
              <button
                className="theme-outline-button rounded-md px-3 py-2 text-sm font-medium"
                onClick={switchToCreateMode}
                type="button"
              >
                切换新建
              </button>
            ) : null}
          </div>

          <div className="mt-6 space-y-5">
            <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
              需求标题
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                onChange={(event) => updateField('title', event.target.value)}
                placeholder="例如：烤箱产品线高温控制与传感一体化方案"
                value={form.title}
              />
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
                优先级
                <select
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => updateField('priority', event.target.value)}
                  value={form.priority}
                >
                  {Object.entries(needPriorityMap).map(([value, meta]) => (
                    <option key={value} value={value}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
                需求状态
                <select
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => updateField('status', event.target.value)}
                  value={form.status}
                >
                  {Object.entries(needStatusMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
                技术域
                <select
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => updateField('domain', event.target.value)}
                  value={form.domain}
                >
                  {Object.entries(needDomainMap).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
                发布日期
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => updateField('publishedAt', event.target.value)}
                  type="date"
                  value={form.publishedAt}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
              产品线 / 业务线
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                onChange={(event) => updateField('productLine', event.target.value)}
                placeholder="例如：烤箱产品线 / 汽车热管理 / 电动工具驱动"
                value={form.productLine}
              />
            </label>

            <label className="block space-y-2 text-sm font-medium text-[var(--oip-text-secondary)]">
              需求描述
              <textarea
                className="theme-input min-h-56 w-full rounded-lg px-4 py-3"
                onChange={(event) => updateField('description', event.target.value)}
                placeholder="请描述技术背景、性能要求、当前痛点、目标应用场景和期望合作方向。"
                value={form.description}
              />
            </label>
          </div>

          {error ? (
            <div className="mt-5 rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
              {error}
            </div>
          ) : null}

          {success ? (
            <div className="mt-5 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
              {success}
            </div>
          ) : null}

          <button
            className="theme-primary-button mt-6 w-full rounded-md px-5 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
            disabled={saving || isRefreshing}
            type="submit"
          >
            {saving ? '保存中...' : mode === 'create' ? '创建技术需求' : '保存需求修改'}
          </button>
        </form>
      </div>
    </div>
  )
}

'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BadgeCheck, Building2, Mail, Smartphone, UserRound } from 'lucide-react'

import type { User } from '@/payload-types'

import { roleLabelMap } from '@/lib/constants'
import { USERNAME_REGEX, emailRegex, phoneRegex } from '@/lib/validators'

type SettingsUser = Pick<
  User,
  | 'company'
  | 'email'
  | 'emailVerifiedAt'
  | 'name'
  | 'phone'
  | 'phoneVerifiedAt'
  | 'role'
  | 'username'
>

export function SettingsForm({ user }: { user: SettingsUser }) {
  const router = useRouter()
  const [isRefreshing, startTransition] = useTransition()
  const [form, setForm] = useState({
    company: user.company ?? '',
    email: user.email,
    name: user.name,
    phone: user.phone ?? '',
    username: user.username,
  })
  const [emailVerifiedAt, setEmailVerifiedAt] = useState<string | null>(
    user.emailVerifiedAt ?? null,
  )
  const [phoneVerifiedAt, setPhoneVerifiedAt] = useState<string | null>(
    user.phoneVerifiedAt ?? null,
  )
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function validateForm() {
    const trimmedName = form.name.trim()
    const trimmedUsername = form.username.trim()
    const trimmedCompany = form.company.trim()
    const trimmedEmail = form.email.trim().toLowerCase()
    const trimmedPhone = form.phone.trim()

    if (trimmedName.length < 2) {
      return '请输入联系人姓名'
    }

    if (trimmedUsername.length < 2) {
      return '请输入用户名'
    }

    if (!USERNAME_REGEX.test(trimmedUsername)) {
      return '用户名仅支持字母、数字、下划线和短横线'
    }

    if (trimmedCompany && trimmedCompany.length < 2) {
      return '请输入至少 2 个字符的公司名称'
    }

    if (!emailRegex.test(trimmedEmail)) {
      return '请输入正确的邮箱地址'
    }

    if (trimmedPhone && !phoneRegex.test(trimmedPhone)) {
      return '请输入正确的手机号码'
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

    try {
      const response = await fetch('/api/account/profile', {
        body: JSON.stringify({
          company: form.company,
          email: form.email,
          name: form.name,
          phone: form.phone,
          username: form.username,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
      })

      const rawText = await response.text()
      const data = rawText ? JSON.parse(rawText) : null

      if (!response.ok) {
        setError(data?.error || '保存失败，请稍后重试')
        return
      }

      const nextUser = data?.user as SettingsUser | undefined

      if (nextUser) {
        setForm({
          company: nextUser.company ?? '',
          email: nextUser.email,
          name: nextUser.name,
          phone: nextUser.phone ?? '',
          username: nextUser.username,
        })
        setEmailVerifiedAt(nextUser.emailVerifiedAt ?? null)
        setPhoneVerifiedAt(nextUser.phoneVerifiedAt ?? null)
      }

      setSuccess(data?.message || '个人信息已保存')
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
    <div className="space-y-8">
      <div className="theme-dashboard-panel rounded-[1rem] p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h2 className="theme-page-title text-3xl font-semibold">个人设置</h2>
            <p className="theme-page-description mt-2 text-sm">
              更新当前登录账号的基础资料与联系方式，保存后会同步写入 Payload 用户数据。
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-md border border-[color:var(--ht-border-soft)] bg-[var(--ht-card-soft)] px-4 py-2 text-sm text-[var(--ht-text-secondary)]">
            <BadgeCheck size={16} />
            当前角色：{roleLabelMap[user.role]}
          </div>
        </div>

        <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
          <form className="theme-dashboard-panel-soft space-y-6 rounded-xl p-6" onSubmit={onSubmit}>
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
                联系人姓名
                <div className="relative">
                  <UserRound
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ht-text-muted)]"
                    size={16}
                  />
                  <input
                    className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                    onChange={(event) => updateField('name', event.target.value)}
                    placeholder="请输入联系人姓名"
                    value={form.name}
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
                用户名
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => updateField('username', event.target.value)}
                  placeholder="请输入用户名"
                  value={form.username}
                />
              </label>
            </div>

            <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
              公司名称
              <div className="relative">
                <Building2
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ht-text-muted)]"
                  size={16}
                />
                <input
                  className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                  onChange={(event) => updateField('company', event.target.value)}
                  placeholder="请输入公司或机构名称"
                  value={form.company}
                />
              </div>
            </label>

            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
                联系邮箱
                <div className="relative">
                  <Mail
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ht-text-muted)]"
                    size={16}
                  />
                  <input
                    className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="请输入邮箱地址"
                    type="email"
                    value={form.email}
                  />
                </div>
              </label>

              <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
                联系手机
                <div className="relative">
                  <Smartphone
                    className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[var(--ht-text-muted)]"
                    size={16}
                  />
                  <input
                    className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                    onChange={(event) => updateField('phone', event.target.value)}
                    placeholder="请输入 11 位手机号"
                    value={form.phone}
                  />
                </div>
              </label>
            </div>

            <div
              className="rounded-lg border px-4 py-3 text-sm leading-6"
              style={{
                background: 'var(--ht-warning-bg)',
                borderColor: 'var(--ht-warning-border)',
                color: 'var(--ht-warning-text)',
              }}
            >
              若邮箱或手机号发生变更，系统会同步重置对应通道的已验证状态；账号始终需要保留至少一个已验证登录方式。
            </div>

            {error ? (
              <div className="rounded-md border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
                {error}
              </div>
            ) : null}
            {success ? (
              <div className="rounded-md border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-400">
                {success}
              </div>
            ) : null}

            <div className="flex justify-end">
              <button
                className="theme-primary-button rounded-md px-5 py-3 text-sm font-semibold disabled:opacity-60"
                disabled={saving || isRefreshing}
                type="submit"
              >
                {saving ? '保存中...' : isRefreshing ? '刷新中...' : '保存更新'}
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <div className="theme-dashboard-panel-soft rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">
                账号概览
              </p>
              <div className="mt-4 space-y-4 text-sm text-[var(--ht-text-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <span>角色</span>
                  <span className="font-semibold text-[var(--ht-text-primary)]">
                    {roleLabelMap[user.role]}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span>已验证通道</span>
                  <span className="font-semibold text-[var(--ht-text-primary)]">
                    {[emailVerifiedAt ? '邮箱' : null, phoneVerifiedAt ? '手机' : null]
                      .filter(Boolean)
                      .join(' / ') || '暂无'}
                  </span>
                </div>
              </div>
            </div>

            <div className="theme-dashboard-panel-soft rounded-xl p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">
                验证状态
              </p>
              <div className="mt-4 space-y-3 text-sm text-[var(--ht-text-secondary)]">
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Mail size={15} />
                    邮箱
                  </span>
                  <span className="font-semibold text-[var(--ht-text-primary)]">
                    {emailVerifiedAt ? '已验证' : '未验证'}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <Smartphone size={15} />
                    手机
                  </span>
                  <span className="font-semibold text-[var(--ht-text-primary)]">
                    {phoneVerifiedAt ? '已验证' : '未验证'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

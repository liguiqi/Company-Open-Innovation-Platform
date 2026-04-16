'use client'

import Link from 'next/link'
import { useState } from 'react'

export function RegisterForm() {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/auth/register', {
      body: JSON.stringify({
        company: formData.get('company'),
        email: formData.get('email'),
        name: formData.get('name'),
        password: formData.get('password'),
        passwordConfirm: formData.get('passwordConfirm'),
        phone: formData.get('phone'),
        username: formData.get('username'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.error || '注册失败')
      return
    }

    setSuccess(data.message)
  }

  return (
    <form action={onSubmit} className="auth-panel w-full space-y-5 rounded-[1rem] p-8">
      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          联系人姓名
          <input className="theme-input w-full rounded-lg px-4 py-3" name="name" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          用户名
          <input className="theme-input w-full rounded-lg px-4 py-3" name="username" required />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          联系邮箱
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="email"
            required
            type="email"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          联系手机
          <input className="theme-input w-full rounded-lg px-4 py-3" name="phone" />
        </label>
      </div>

      <label className="block space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
        公司名称
        <input className="theme-input w-full rounded-lg px-4 py-3" name="company" required />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          登录密码
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="password"
            required
            type="password"
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
          确认密码
          <input
            className="theme-input w-full rounded-lg px-4 py-3"
            name="passwordConfirm"
            required
            type="password"
          />
        </label>
      </div>

      <button
        className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? '注册中...' : '创建合作伙伴账号'}
      </button>

      {error ? (
        <p className="rounded-lg border border-rose-200/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="rounded-lg border border-emerald-200/70 bg-emerald-50/85 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}

      <p className="text-sm text-[var(--ht-text-muted)]">
        已有账号？{' '}
        <Link className="font-semibold text-ht-blue" href="/login">
          返回登录
        </Link>
      </p>
    </form>
  )
}

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Mode = 'password' | 'sms'

export function LoginPanel({ redirectTo }: { redirectTo?: string }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  async function onPasswordLogin(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/auth/login', {
      body: JSON.stringify({
        identifier: formData.get('identifier'),
        password: formData.get('password'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.error || '登录失败')
      return
    }

    router.push(redirectTo || data.redirectTo || '/dashboard')
    router.refresh()
  }

  async function sendCode() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    setDebugCode(null)

    const response = await fetch('/api/sms/send', {
      body: JSON.stringify({ phone }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.error || '验证码发送失败')
      return
    }

    setSuccess(data.message)
    if (data.debugCode) {
      setDebugCode(data.debugCode)
    }
  }

  async function onSMSLogin(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const response = await fetch('/api/sms/verify', {
      body: JSON.stringify({
        code: formData.get('code'),
        phone: formData.get('phone'),
      }),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json()
    setLoading(false)

    if (!response.ok) {
      setError(data.error || '验证码登录失败')
      return
    }

    router.push(redirectTo || data.redirectTo || '/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-panel w-full max-w-[460px] rounded-[1rem] p-7 md:p-8">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.35em] text-[var(--ht-text-muted)]">
          Workspace Access
        </p>
        <h2 className="text-3xl font-semibold text-[var(--ht-text-primary)]">登录工作台</h2>
        <p className="text-sm leading-7 text-[var(--ht-text-muted)]">
          使用邮箱/手机号密码，或短信验证码进入开放创新平台工作台。
        </p>
      </div>

      <div className="auth-tabset mt-6 inline-flex rounded-md p-1">
        <button
          className={`auth-tab rounded-md px-4 py-2 text-sm font-semibold ${mode === 'password' ? 'is-active' : ''}`}
          onClick={() => setMode('password')}
          type="button"
        >
          邮箱 / 手机
        </button>
        <button
          className={`auth-tab rounded-md px-4 py-2 text-sm font-semibold ${mode === 'sms' ? 'is-active' : ''}`}
          onClick={() => setMode('sms')}
          type="button"
        >
          手机短信
        </button>
      </div>

      <div className="mt-6">
        {mode === 'password' ? (
          <form action={onPasswordLogin} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
              邮箱或手机号
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="identifier"
                placeholder="请输入邮箱或手机号"
                required
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
              登录密码
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="password"
                placeholder="请输入密码"
                required
                type="password"
              />
            </label>
            <button
              className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? '登录中...' : '登录工作台'}
            </button>
          </form>
        ) : (
          <form action={onSMSLogin} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
              手机号码
              <div className="flex gap-3">
                <input
                  className="theme-input min-w-0 flex-1 rounded-lg px-4 py-3"
                  name="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="请输入 11 位手机号"
                  required
                  value={phone}
                />
                <button
                  className="rounded-md border border-ht-light-blue px-4 py-2 text-sm font-semibold text-ht-light-blue transition hover:bg-[var(--ht-hover-soft)] disabled:opacity-60"
                  disabled={loading || phone.length !== 11}
                  onClick={sendCode}
                  type="button"
                >
                  发送验证码
                </button>
              </div>
            </label>
            <label className="block space-y-2 text-sm font-medium text-[var(--ht-text-secondary)]">
              验证码
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="code"
                placeholder="请输入短信验证码"
                required
              />
            </label>
            <button
              className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? '验证中...' : '验证码登录'}
            </button>
          </form>
        )}
      </div>

      {error ? (
        <p className="mt-5 rounded-lg border border-rose-200/70 bg-rose-50/85 px-4 py-3 text-sm text-rose-700">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-5 rounded-lg border border-emerald-200/70 bg-emerald-50/85 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      {debugCode ? (
        <p className="mt-3 rounded-lg border border-sky-200/70 bg-sky-50/85 px-4 py-3 text-sm text-sky-700">
          当前为开发联调模式，验证码：<strong>{debugCode}</strong>
        </p>
      ) : null}

      <p className="mt-6 text-sm text-[var(--ht-text-muted)]">
        还没有账号？{' '}
        <Link className="font-semibold text-ht-blue" href="/register">
          立即注册
        </Link>
      </p>

      <div className="mt-4 border-t border-[color:var(--ht-border-soft)] pt-4 text-xs text-[var(--ht-text-muted)]">
        登录后可查看公开需求、提交方案并进入内部评审流转。
      </div>
    </div>
  )
}

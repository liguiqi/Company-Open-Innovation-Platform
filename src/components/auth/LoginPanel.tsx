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
    <div className="w-full rounded-[2rem] border border-white/60 bg-white/90 p-8 shadow-2xl shadow-slate-200/80 backdrop-blur">
      <div className="inline-flex rounded-full bg-slate-100 p-1">
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'password' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}
          onClick={() => setMode('password')}
          type="button"
        >
          邮箱 / 用户名
        </button>
        <button
          className={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sms' ? 'bg-slate-950 text-white' : 'text-slate-500'}`}
          onClick={() => setMode('sms')}
          type="button"
        >
          手机短信
        </button>
      </div>

      <div className="mt-6">
        {mode === 'password' ? (
          <form action={onPasswordLogin} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              邮箱或用户名
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
                name="identifier"
                placeholder="请输入邮箱或用户名"
                required
              />
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              登录密码
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
                name="password"
                placeholder="请输入密码"
                required
                type="password"
              />
            </label>
            <button
              className="w-full rounded-full bg-ht-blue px-5 py-3 font-semibold text-white transition hover:bg-slate-950 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? '登录中...' : '登录工作台'}
            </button>
          </form>
        ) : (
          <form action={onSMSLogin} className="space-y-5">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              手机号码
              <div className="flex gap-3">
                <input
                  className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
                  name="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="请输入 11 位手机号"
                  required
                  value={phone}
                />
                <button
                  className="rounded-full border border-ht-light-blue px-4 py-2 text-sm font-semibold text-ht-light-blue transition hover:bg-sky-50 disabled:opacity-60"
                  disabled={loading || phone.length !== 11}
                  onClick={sendCode}
                  type="button"
                >
                  发送验证码
                </button>
              </div>
            </label>
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              验证码
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none transition focus:border-ht-blue"
                name="code"
                placeholder="请输入短信验证码"
                required
              />
            </label>
            <button
              className="w-full rounded-full bg-ht-blue px-5 py-3 font-semibold text-white transition hover:bg-slate-950 disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? '验证中...' : '验证码登录'}
            </button>
          </form>
        )}
      </div>

      {error ? (
        <p className="mt-5 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
      ) : null}
      {success ? (
        <p className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </p>
      ) : null}
      {debugCode ? (
        <p className="mt-3 rounded-2xl bg-sky-50 px-4 py-3 text-sm text-sky-700">
          当前为开发联调模式，验证码：<strong>{debugCode}</strong>
        </p>
      ) : null}

      <p className="mt-6 text-sm text-slate-500">
        还没有账号？{' '}
        <Link className="font-semibold text-ht-blue" href="/register">
          立即注册
        </Link>
      </p>
    </div>
  )
}

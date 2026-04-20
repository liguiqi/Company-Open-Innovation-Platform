'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Mail, ShieldCheck, Smartphone } from 'lucide-react'

import { emitRouteTransitionStart } from '@/lib/navigation'

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

    emitRouteTransitionStart()
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

    emitRouteTransitionStart()
    router.push(redirectTo || data.redirectTo || '/dashboard')
    router.refresh()
  }

  return (
    <div className="auth-panel w-full max-w-[500px] rounded-[1rem] p-6 md:p-8">
      <div className="auth-form-shell">
        <div className="auth-form-header">
          <p className="auth-form-kicker">Open Innovation Access</p>
          <h2 className="auth-form-title">登录开放创新工作台</h2>
          <p className="auth-form-description">
            使用邮箱或手机号登录，进入需求跟进、方案提交、评审协同与状态流转的统一工作区。
          </p>
        </div>

        <div className="auth-callout">
          当前登录页仅支持邮箱 / 手机号两种账号口径，不再开放用户名登录。
        </div>

        <div className="auth-tabset grid w-full grid-cols-2 rounded-lg p-1">
          <button
            className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'password' ? 'is-active' : ''}`}
            onClick={() => setMode('password')}
            type="button"
          >
            邮箱 / 手机密码
          </button>
          <button
            className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'sms' ? 'is-active' : ''}`}
            onClick={() => setMode('sms')}
            type="button"
          >
            短信验证码
          </button>
        </div>

        {mode === 'password' ? (
          <form action={onPasswordLogin} className="auth-form-shell">
            <div className="auth-section-card">
              <div className="auth-section-heading">
                <Mail size={17} />
                <span>账号验证</span>
              </div>
              <p className="auth-section-text">
                输入已注册邮箱或手机号，以及对应密码。手机号注册用户也可以直接使用手机号密码登录。
              </p>
              <label className="auth-field">
                邮箱或手机号
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  name="identifier"
                  placeholder="请输入邮箱或手机号"
                  required
                />
              </label>
              <label className="auth-field">
                登录密码
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  name="password"
                  placeholder="请输入密码"
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
              {loading ? '登录中...' : '登录工作台'}
            </button>
          </form>
        ) : (
          <form action={onSMSLogin} className="auth-form-shell">
            <div className="auth-section-card">
              <div className="auth-section-heading">
                <Smartphone size={17} />
                <span>短信验证</span>
              </div>
              <p className="auth-section-text">
                输入手机号并发送验证码。当前短信链路已经切换为阿里云 Dypnsapi，验证码 5 分钟内有效。
              </p>
              <label className="auth-field">
                手机号码
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  name="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="请输入 11 位手机号"
                  required
                  value={phone}
                />
              </label>
              <div className="auth-code-row">
                <input
                  className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
                  name="code"
                  placeholder="请输入短信验证码"
                  required
                />
                <button
                  className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
                  disabled={loading || phone.length !== 11}
                  onClick={sendCode}
                  type="button"
                >
                  发送验证码
                </button>
              </div>
              <p className="auth-field-hint">
                验证通过后将直接进入工作台；如该手机号未注册，系统会自动建立一个待补全资料的合作伙伴账号。
              </p>
            </div>

            <button
              className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? '验证中...' : '验证码登录'}
            </button>
          </form>
        )}

        {error ? <p className="auth-feedback auth-feedback--error">{error}</p> : null}
        {success ? <p className="auth-feedback auth-feedback--success">{success}</p> : null}
        {debugCode ? (
          <p className="auth-feedback auth-feedback--info">
            当前为开发联调模式，验证码：<strong>{debugCode}</strong>
          </p>
        ) : null}

        <div className="auth-link-row">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            登录后可直接进入协同工作台
          </span>
          <Link className="font-semibold text-ht-blue" href="/register">
            立即注册
          </Link>
        </div>
      </div>
    </div>
  )
}

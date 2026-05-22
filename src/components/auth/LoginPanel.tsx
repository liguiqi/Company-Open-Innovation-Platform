'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'

import { emitRouteTransitionStart } from '@/lib/navigation'

type Mode = 'password' | 'code'
type IdentifierType = 'email' | 'phone'

type RegisterPrompt = {
  identifier: string
  identifierType: IdentifierType
  redirectTo: string
} | null

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const phonePattern = /^1\d{10}$/

function getIdentifierType(identifier: string) {
  const normalizedIdentifier = identifier.trim()

  if (emailPattern.test(normalizedIdentifier)) {
    return 'email' as const
  }

  if (phonePattern.test(normalizedIdentifier)) {
    return 'phone' as const
  }

  return null
}

export function LoginPanel({
  redirectTo,
  initialIdentifier,
  initialSuccessMessage,
}: {
  redirectTo?: string
  initialIdentifier?: string
  initialSuccessMessage?: string
}) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('password')
  const [identifier, setIdentifier] = useState(initialIdentifier || '')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(initialSuccessMessage || null)
  const [debugCode, setDebugCode] = useState<string | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [codeSending, setCodeSending] = useState(false)
  const [codeVerifying, setCodeVerifying] = useState(false)
  const [registerPrompt, setRegisterPrompt] = useState<RegisterPrompt>(null)

  const identifierType = getIdentifierType(identifier)

  async function onPasswordLogin() {
    setPasswordLoading(true)
    setError(null)
    setSuccess(null)
    setRegisterPrompt(null)

    try {
      const response = await fetch('/api/auth/login', {
        body: JSON.stringify({
          identifier,
          password,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError((typeof data.error === 'string' && data.error) || '登录失败')
        return
      }

      emitRouteTransitionStart()
      router.push(redirectTo || data.redirectTo || '/dashboard')
      router.refresh()
    } catch {
      setError('登录请求失败，请检查网络后重试')
    } finally {
      setPasswordLoading(false)
    }
  }

  async function sendCode() {
    if (!identifierType) {
      setError('请输入正确的邮箱或手机号')
      return
    }

    setCodeSending(true)
    setError(null)
    setSuccess(null)
    setDebugCode(null)
    setRegisterPrompt(null)

    try {
      const response = await fetch('/api/auth/login-code/send', {
        body: JSON.stringify({ identifier }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError((typeof data.error === 'string' && data.error) || '验证码发送失败')
        return
      }

      setSuccess(typeof data.message === 'string' ? data.message : '验证码已发送')

      if (typeof data.debugCode === 'string' && data.debugCode) {
        setDebugCode(data.debugCode)
      }
    } catch {
      setError('验证码发送失败，请检查网络后重试')
    } finally {
      setCodeSending(false)
    }
  }

  async function onCodeLogin() {
    if (!identifierType) {
      setError('请输入正确的邮箱或手机号')
      return
    }

    setCodeVerifying(true)
    setError(null)
    setSuccess(null)
    setRegisterPrompt(null)

    try {
      const response = await fetch('/api/auth/login-code/verify', {
        body: JSON.stringify({
          code,
          identifier,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (
          response.status === 404 &&
          data &&
          typeof data === 'object' &&
          'action' in data &&
          data.action === 'register'
        ) {
          setRegisterPrompt({
            identifier: typeof data.identifier === 'string' ? data.identifier : identifier.trim(),
            identifierType: data.identifierType === 'email' ? 'email' : 'phone',
            redirectTo: typeof data.redirectTo === 'string' ? data.redirectTo : '/register',
          })
          setError((typeof data.error === 'string' && data.error) || '当前账号未注册')
          return
        }

        setError((typeof data.error === 'string' && data.error) || '验证码登录失败')
        return
      }

      emitRouteTransitionStart()
      router.push(redirectTo || data.redirectTo || '/dashboard')
      router.refresh()
    } catch {
      setError('验证码登录请求失败，请检查网络后重试')
    } finally {
      setCodeVerifying(false)
    }
  }

  function handleRegisterRedirect() {
    if (!registerPrompt) {
      return
    }

    emitRouteTransitionStart()
    router.push(registerPrompt.redirectTo)
  }

  return (
    <>
      <div className="auth-panel w-full max-w-[500px] rounded-[1rem] p-6 md:p-8">
        <div className="auth-form-shell">
          <div className="auth-form-header">
            <p className="auth-form-kicker">Open Innovation Access</p>
            <h2 className="auth-form-title">欢迎使用Innovation Workspace</h2>
            <p className="auth-form-description">
              使用邮箱或手机号登录，进入需求跟进、方案提交、评审协同与状态流转的统一工作区。
            </p>
          </div>

          <div className="auth-tabset grid w-full grid-cols-2 rounded-lg p-1">
            <button
              className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'password' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('password')
                setError(null)
                setRegisterPrompt(null)
              }}
              type="button"
            >
              邮箱/手机密码登录
            </button>
            <button
              className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${mode === 'code' ? 'is-active' : ''}`}
              onClick={() => {
                setMode('code')
                setError(null)
                setRegisterPrompt(null)
              }}
              type="button"
            >
              邮箱/短信验证码登录
            </button>
          </div>

          {mode === 'password' ? (
            <form
              className="auth-form-shell"
              onSubmit={(event) => {
                event.preventDefault()
                void onPasswordLogin()
              }}
            >
              <div className="auth-section-card">
                <div className="auth-section-heading">
                  <Mail size={17} />
                  <span>账号验证</span>
                </div>
                <label className="auth-field">
                  邮箱或手机号
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    name="identifier"
                    onChange={(event) => {
                      setIdentifier(event.target.value)
                      setRegisterPrompt(null)
                    }}
                    placeholder="请输入邮箱或手机号"
                    required
                    value={identifier}
                  />
                </label>
                <label className="auth-field">
                  登录密码
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    name="password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="请输入密码"
                    required
                    type="password"
                    value={password}
                  />
                </label>
              </div>

              <button
                className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
                disabled={passwordLoading}
                type="submit"
              >
                {passwordLoading ? '登录中...' : '登录工作台'}
              </button>
            </form>
          ) : (
            <form
              className="auth-form-shell"
              onSubmit={(event) => {
                event.preventDefault()
                void onCodeLogin()
              }}
            >
              <div className="auth-section-card">
                <div className="auth-section-heading">
                  <KeyRound size={17} />
                  <span>验证码验证</span>
                </div>
                <label className="auth-field">
                  邮箱或手机号
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    name="identifier"
                    onChange={(event) => {
                      setIdentifier(event.target.value)
                      setRegisterPrompt(null)
                    }}
                    placeholder="请输入邮箱或手机号"
                    required
                    value={identifier}
                  />
                </label>
                <div className="auth-code-row">
                  <input
                    className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
                    name="code"
                    onChange={(event) => setCode(event.target.value)}
                    placeholder="请输入邮箱或短信验证码"
                    required
                    value={code}
                  />
                  <button
                    className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
                    disabled={codeSending || codeVerifying || !identifierType}
                    onClick={() => void sendCode()}
                    type="button"
                  >
                    {codeSending ? '发送中' : '发送验证码'}
                  </button>
                </div>
                <p className="auth-field-hint">邮箱/短信验证码 5 分钟内有效。</p>
              </div>

              <button
                className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
                disabled={codeVerifying}
                type="submit"
              >
                {codeVerifying ? '验证中...' : '验证码登录'}
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

      {registerPrompt ? (
        <div className="auth-dialog-backdrop">
          <div className="auth-dialog">
            <div className="auth-dialog__header">
              <h3 className="auth-dialog__title">当前账号未注册</h3>
              <p className="auth-dialog__description">
                {registerPrompt.identifierType === 'email'
                  ? `邮箱 ${registerPrompt.identifier} 还没有创建合作伙伴账号。`
                  : `手机号 ${registerPrompt.identifier} 还没有创建合作伙伴账号。`}
              </p>
            </div>
            <div className="auth-dialog__actions">
              <button
                className="theme-outline-button rounded-md px-4 py-2.5 text-sm font-semibold"
                onClick={() => setRegisterPrompt(null)}
                type="button"
              >
                取消
              </button>
              <button
                className="theme-primary-button rounded-md px-4 py-2.5 text-sm font-semibold"
                onClick={handleRegisterRedirect}
                type="button"
              >
                去注册
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

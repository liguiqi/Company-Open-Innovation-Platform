'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Building2, KeyRound, Mail, ShieldCheck, Smartphone, UserRound } from 'lucide-react'

type VerificationChannel = 'email' | 'sms'

const SEND_CODE_COOLDOWN = 60

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailSending, setEmailSending] = useState(false)
  const [smsSending, setSMSSending] = useState(false)
  const [emailCooldown, setEmailCooldown] = useState(0)
  const [smsCooldown, setSMSCooldown] = useState(0)
  const [emailStatus, setEmailStatus] = useState<string | null>(null)
  const [smsStatus, setSMSStatus] = useState<string | null>(null)
  const [emailDebugCode, setEmailDebugCode] = useState<string | null>(null)
  const [smsDebugCode, setSMSDebugCode] = useState<string | null>(null)

  useEffect(() => {
    if (emailCooldown <= 0 && smsCooldown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setEmailCooldown((current) => (current > 0 ? current - 1 : 0))
      setSMSCooldown((current) => (current > 0 ? current - 1 : 0))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [emailCooldown, smsCooldown])

  async function sendCode(channel: VerificationChannel) {
    const isEmail = channel === 'email'
    const endpoint = isEmail ? '/api/auth/email-code' : '/api/sms/send'
    const payload = isEmail ? { email } : { phone }
    const setSending = isEmail ? setEmailSending : setSMSSending
    const setStatus = isEmail ? setEmailStatus : setSMSStatus
    const setDebugCode = isEmail ? setEmailDebugCode : setSMSDebugCode
    const setCooldown = isEmail ? setEmailCooldown : setSMSCooldown

    setError(null)
    setSuccess(null)
    setStatus(null)
    setDebugCode(null)
    setSending(true)

    const response = await fetch(endpoint, {
      body: JSON.stringify(payload),
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
    })

    const data = await response.json()
    setSending(false)

    if (!response.ok) {
      setError(data.error || `${isEmail ? '邮箱' : '短信'}验证码发送失败`)
      return
    }

    setStatus(data.message || '验证码已发送')
    setCooldown(SEND_CODE_COOLDOWN)

    if (data.debugCode) {
      setDebugCode(data.debugCode)
    }
  }

  async function onSubmit(formData: FormData) {
    setLoading(true)
    setError(null)
    setSuccess(null)

    const emailValue = String(formData.get('email') || '').trim()
    const phoneValue = String(formData.get('phone') || '').trim()
    const emailCode = String(formData.get('emailCode') || '').trim()
    const smsCode = String(formData.get('smsCode') || '').trim()

    if (!emailValue && !phoneValue) {
      setLoading(false)
      setError('请至少填写邮箱或手机号')
      return
    }

    if (!(emailValue && emailCode) && !(phoneValue && smsCode)) {
      setLoading(false)
      setError('邮箱验证码或短信验证码至少完成一种')
      return
    }

    const response = await fetch('/api/auth/register', {
      body: JSON.stringify({
        company: formData.get('company'),
        email: emailValue,
        emailCode,
        name: formData.get('name'),
        password: formData.get('password'),
        passwordConfirm: formData.get('passwordConfirm'),
        phone: phoneValue,
        smsCode,
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

    setSuccess(data.message || '注册成功')
  }

  return (
    <div className="auth-panel w-full max-w-[520px] rounded-[1rem] p-6 md:p-8">
      <form action={onSubmit} className="auth-form-shell">
        <div className="auth-form-header">
          <p className="auth-form-kicker">Partner Enrollment</p>
          <h2 className="auth-form-title">注册合作伙伴账号</h2>
          <p className="auth-form-description">
            通过邮箱验证码或短信验证码完成注册验证，至少完成一种即可创建账号并进入开放创新平台。
          </p>
        </div>

        <div className="auth-callout">
          验证码支持邮箱和手机双通道。若两种方式都填写，系统会同时记录两种验证状态；若只使用手机号注册，将自动生成系统邮箱标识用于后台数据落库。
        </div>

        <div className="auth-section-card">
          <div className="auth-section-heading">
            <UserRound size={17} />
            <span>基础信息</span>
          </div>
          <p className="auth-section-text">
            先填写合作伙伴账号基础资料，用户名仅支持字母、数字、下划线和短横线。
          </p>
          <div className="auth-grid-two">
            <label className="auth-field">
              联系人姓名
              <input className="theme-input w-full rounded-lg px-4 py-3" name="name" required />
            </label>
            <label className="auth-field">
              用户名
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="username"
                placeholder="如 lgq_partner"
                required
              />
            </label>
          </div>
          <label className="auth-field">
            公司名称
            <div className="relative">
              <Building2 className="auth-field-icon" size={16} />
              <input
                className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                name="company"
                placeholder="请输入公司或机构名称"
                required
              />
            </div>
          </label>
        </div>

        <div className="auth-section-card">
          <div className="auth-section-heading">
            <Mail size={17} />
            <span>邮箱验证</span>
          </div>
          <p className="auth-section-text">
            推荐优先填写常用企业邮箱。邮箱验证码 5 分钟有效，发送后 60 秒内不可重复获取。
          </p>
          <label className="auth-field">
            联系邮箱
            <input
              className="theme-input w-full rounded-lg px-4 py-3"
              name="email"
              onChange={(event) => {
                setEmail(event.target.value)
                setEmailStatus(null)
                setEmailDebugCode(null)
              }}
              placeholder="填写邮箱后可发送邮箱验证码"
              type="email"
              value={email}
            />
          </label>
          <div className="auth-code-row">
            <input
              className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
              name="emailCode"
              placeholder="请输入邮箱验证码"
            />
            <button
              className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
              disabled={emailSending || emailCooldown > 0 || !email.trim()}
              onClick={() => void sendCode('email')}
              type="button"
            >
              {emailCooldown > 0 ? `${emailCooldown}s` : emailSending ? '发送中' : '发送邮箱验证码'}
            </button>
          </div>
          <p className="auth-field-hint">邮箱验证完成后，可直接使用邮箱 + 密码进行常规登录。</p>
          {emailStatus ? (
            <p className="auth-feedback auth-feedback--success">{emailStatus}</p>
          ) : null}
          {emailDebugCode ? (
            <p className="auth-feedback auth-feedback--info">
              当前为开发联调模式，邮箱验证码：<strong>{emailDebugCode}</strong>
            </p>
          ) : null}
        </div>

        <div className="auth-section-card">
          <div className="auth-section-heading">
            <Smartphone size={17} />
            <span>手机验证</span>
          </div>
          <p className="auth-section-text">
            短信验证码通过阿里云下发，验证码 5 分钟有效。手机号可用于通知、找回和快速登录。
          </p>
          <label className="auth-field">
            联系手机
            <input
              className="theme-input w-full rounded-lg px-4 py-3"
              name="phone"
              onChange={(event) => {
                setPhone(event.target.value)
                setSMSStatus(null)
                setSMSDebugCode(null)
              }}
              placeholder="请输入 11 位手机号"
              value={phone}
            />
          </label>
          <div className="auth-code-row">
            <input
              className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
              name="smsCode"
              placeholder="请输入短信验证码"
            />
            <button
              className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
              disabled={smsSending || smsCooldown > 0 || phone.trim().length !== 11}
              onClick={() => void sendCode('sms')}
              type="button"
            >
              {smsCooldown > 0 ? `${smsCooldown}s` : smsSending ? '发送中' : '发送短信验证码'}
            </button>
          </div>
          <p className="auth-field-hint">
            如只填写手机号注册，系统会为该账号生成内部邮箱标识，不影响后续使用。
          </p>
          {smsStatus ? <p className="auth-feedback auth-feedback--success">{smsStatus}</p> : null}
          {smsDebugCode ? (
            <p className="auth-feedback auth-feedback--info">
              当前为开发联调模式，短信验证码：<strong>{smsDebugCode}</strong>
            </p>
          ) : null}
        </div>

        <div className="auth-section-card">
          <div className="auth-section-heading">
            <KeyRound size={17} />
            <span>安全设置</span>
          </div>
          <p className="auth-section-text">
            设置登录密码后，后续可直接通过邮箱或手机号配合密码登录。
          </p>
          <div className="auth-grid-two">
            <label className="auth-field">
              登录密码
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="password"
                placeholder="至少 6 位"
                required
                type="password"
              />
            </label>
            <label className="auth-field">
              确认密码
              <input
                className="theme-input w-full rounded-lg px-4 py-3"
                name="passwordConfirm"
                placeholder="再次输入密码"
                required
                type="password"
              />
            </label>
          </div>
        </div>

        <div className="auth-link-row border-none pt-0">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            邮箱验证码或短信验证码至少完成一种
          </span>
        </div>

        <button
          className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? '注册中...' : '创建合作伙伴账号'}
        </button>

        {error ? <p className="auth-feedback auth-feedback--error">{error}</p> : null}
        {success ? <p className="auth-feedback auth-feedback--success">{success}</p> : null}

        <div className="auth-link-row">
          <span>已有账号？</span>
          <Link className="font-semibold text-ht-blue" href="/login">
            返回登录
          </Link>
        </div>
      </form>
    </div>
  )
}

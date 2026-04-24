'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Building2, KeyRound, Mail, ShieldCheck, Smartphone, UserRound } from 'lucide-react'

import { emitRouteTransitionStart } from '@/lib/navigation'
import { USER_PASSWORD_MIN_LENGTH, USERNAME_REGEX } from '@/lib/validators'

type VerificationChannel = 'email' | 'sms'
type RegisterStep = 'basic' | 'email' | 'phone'

type RegisterFormProps = {
  initialEmail?: string
  initialPhone?: string
}

const SEND_CODE_COOLDOWN = 60

export function RegisterForm({ initialEmail = '', initialPhone = '' }: RegisterFormProps) {
  const router = useRouter()
  const [activeStep, setActiveStep] = useState<RegisterStep>('basic')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [email, setEmail] = useState(initialEmail)
  const [emailCode, setEmailCode] = useState('')
  const [phone, setPhone] = useState(initialPhone)
  const [smsCode, setSMSCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [basicAttempted, setBasicAttempted] = useState(false)
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

  const trimmedName = name.trim()
  const trimmedUsername = username.trim()
  const trimmedCompany = company.trim()
  const trimmedEmail = email.trim().toLowerCase()
  const trimmedPhone = phone.trim()
  const passwordLengthValid = password.length >= USER_PASSWORD_MIN_LENGTH

  const nameError =
    (basicAttempted || name.length > 0) && trimmedName.length < 2 ? '联系人姓名至少 2 个字符' : null
  const usernameError =
    basicAttempted || username.length > 0
      ? trimmedUsername.length < 2
        ? '用户名至少 2 个字符'
        : !USERNAME_REGEX.test(trimmedUsername)
          ? '用户名仅支持字母、数字、下划线和短横线'
          : null
      : null
  const companyError =
    (basicAttempted || company.length > 0) && trimmedCompany.length < 2 ? '请输入公司名称' : null
  const passwordError =
    (basicAttempted || password.length > 0) && !passwordLengthValid
      ? `密码至少 ${USER_PASSWORD_MIN_LENGTH} 位`
      : null
  const passwordConfirmError =
    basicAttempted || passwordConfirm.length > 0
      ? passwordConfirm.length < USER_PASSWORD_MIN_LENGTH
        ? `请再次输入至少 ${USER_PASSWORD_MIN_LENGTH} 位密码`
        : password !== passwordConfirm
          ? '两次输入的密码不一致'
          : null
      : null

  function getBasicValidationMessage() {
    if (trimmedName.length < 2) {
      return '请先完整填写联系人姓名'
    }

    if (trimmedUsername.length < 2 || !USERNAME_REGEX.test(trimmedUsername)) {
      return '请先填写合法用户名'
    }

    if (trimmedCompany.length < 2) {
      return '请先完整填写公司名称'
    }

    if (!passwordLengthValid) {
      return `密码至少 ${USER_PASSWORD_MIN_LENGTH} 位`
    }

    if (password !== passwordConfirm) {
      return '请确认两次输入的密码一致'
    }

    return null
  }

  function validateBasicStep() {
    setBasicAttempted(true)
    const validationMessage = getBasicValidationMessage()

    if (validationMessage) {
      setError(validationMessage)
      return false
    }

    setError(null)
    return true
  }

  function getNextVerificationStep() {
    if (trimmedPhone && !trimmedEmail) {
      return 'phone' as const
    }

    return 'email' as const
  }

  function moveToStep(step: RegisterStep) {
    if (step === 'basic') {
      setActiveStep('basic')
      setError(null)
      return
    }

    if (!validateBasicStep()) {
      setActiveStep('basic')
      return
    }

    setActiveStep(step)
  }

  async function sendCode(channel: VerificationChannel) {
    const isEmail = channel === 'email'
    const endpoint = isEmail ? '/api/auth/email-code' : '/api/sms/send'
    const payload = isEmail ? { email: trimmedEmail } : { phone: trimmedPhone }
    const setSending = isEmail ? setEmailSending : setSMSSending
    const setStatus = isEmail ? setEmailStatus : setSMSStatus
    const setDebugCode = isEmail ? setEmailDebugCode : setSMSDebugCode
    const setCooldown = isEmail ? setEmailCooldown : setSMSCooldown

    if (isEmail && !trimmedEmail) {
      setError('请先填写邮箱再发送邮箱验证码')
      return
    }

    if (!isEmail && trimmedPhone.length !== 11) {
      setError('请先填写正确的手机号再发送短信验证码')
      return
    }

    setError(null)
    setSuccess(null)
    setStatus(null)
    setDebugCode(null)
    setSending(true)

    try {
      const response = await fetch(endpoint, {
        body: JSON.stringify(payload),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })
      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError(
          (typeof data.error === 'string' && data.error) ||
            `${isEmail ? '邮箱' : '短信'}验证码发送失败`,
        )
        return
      }

      setStatus((typeof data.message === 'string' && data.message) || '验证码已发送')
      setCooldown(SEND_CODE_COOLDOWN)

      if (typeof data.debugCode === 'string' && data.debugCode) {
        setDebugCode(data.debugCode)
      }
    } catch {
      setError(`${isEmail ? '邮箱' : '短信'}验证码发送失败，请检查网络后重试`)
    } finally {
      setSending(false)
    }
  }

  async function submitRegistration() {
    if (!validateBasicStep()) {
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    if (!trimmedEmail && !trimmedPhone) {
      setLoading(false)
      setError('请至少填写邮箱或手机号')
      return
    }

    if (!(trimmedEmail && emailCode.trim()) && !(trimmedPhone && smsCode.trim())) {
      setLoading(false)
      setError('邮箱验证码或短信验证码至少完成一种')
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        body: JSON.stringify({
          company: trimmedCompany,
          email: trimmedEmail,
          emailCode: emailCode.trim(),
          name: trimmedName,
          password,
          passwordConfirm,
          phone: trimmedPhone,
          smsCode: smsCode.trim(),
          username: trimmedUsername,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        setError((typeof data.error === 'string' && data.error) || '注册失败')
        return
      }

      const loginIdentifier = trimmedEmail || trimmedPhone
      setSuccess('注册成功，正在跳转登录页面...')

      window.setTimeout(() => {
        emitRouteTransitionStart()
        router.push(`/login?registered=1&identifier=${encodeURIComponent(loginIdentifier)}`)
      }, 700)
    } catch {
      setError('注册请求失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-panel w-full max-w-[520px] rounded-[1rem] p-6 md:p-8">
      <div className="auth-form-shell">
        <div className="auth-form-header">
          <p className="auth-form-kicker">Partner Enrollment</p>
          <h2 className="auth-form-title">注册合作伙伴账号</h2>
        </div>

        <div className="auth-tabset grid w-full grid-cols-3 rounded-lg p-1">
          <button
            className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${activeStep === 'basic' ? 'is-active' : ''}`}
            onClick={() => moveToStep('basic')}
            type="button"
          >
            基础信息
          </button>
          <button
            className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${activeStep === 'email' ? 'is-active' : ''}`}
            onClick={() => moveToStep('email')}
            type="button"
          >
            邮箱验证
          </button>
          <button
            className={`auth-tab rounded-md px-4 py-2.5 text-sm font-semibold ${activeStep === 'phone' ? 'is-active' : ''}`}
            onClick={() => moveToStep('phone')}
            type="button"
          >
            手机验证
          </button>
        </div>

        {activeStep === 'basic' ? (
          <div className="auth-form-shell">
            <div className="auth-section-card">
              <div className="auth-section-heading">
                <UserRound size={17} />
                <span>基础信息</span>
              </div>
              <div className="auth-grid-two">
                <label className="auth-field">
                  联系人姓名
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    onChange={(event) => setName(event.target.value)}
                    placeholder="请输入联系人姓名"
                    value={name}
                  />
                  {nameError ? <span className="auth-field-error">{nameError}</span> : null}
                </label>
                <label className="auth-field">
                  用户名
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="如 lgq_partner"
                    value={username}
                  />
                  {usernameError ? <span className="auth-field-error">{usernameError}</span> : null}
                </label>
              </div>
              <label className="auth-field">
                公司名称
                <div className="relative">
                  <Building2 className="auth-field-icon" size={16} />
                  <input
                    className="theme-input w-full rounded-lg py-3 pr-4 pl-10"
                    onChange={(event) => setCompany(event.target.value)}
                    placeholder="请输入公司或机构名称"
                    value={company}
                  />
                </div>
                {companyError ? <span className="auth-field-error">{companyError}</span> : null}
              </label>
            </div>

            <div className="auth-section-card">
              <div className="auth-section-heading">
                <KeyRound size={17} />
                <span>安全设置</span>
              </div>
              <div className="auth-grid-two">
                <label className="auth-field">
                  登录密码
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={`至少 ${USER_PASSWORD_MIN_LENGTH} 位`}
                    type="password"
                    value={password}
                  />
                  {passwordError ? <span className="auth-field-error">{passwordError}</span> : null}
                </label>
                <label className="auth-field">
                  确认密码
                  <input
                    className="theme-input w-full rounded-lg px-4 py-3"
                    onChange={(event) => setPasswordConfirm(event.target.value)}
                    placeholder="再次输入密码"
                    type="password"
                    value={passwordConfirm}
                  />
                  {passwordConfirmError ? (
                    <span className="auth-field-error">{passwordConfirmError}</span>
                  ) : null}
                </label>
              </div>
            </div>

            <button
              className="theme-primary-button w-full rounded-md px-5 py-3 font-semibold"
              onClick={() => moveToStep(getNextVerificationStep())}
              type="button"
            >
              下一步
            </button>
          </div>
        ) : null}

        {activeStep === 'email' ? (
          <div className="auth-form-shell">
            <div className="auth-section-card">
              <div className="auth-section-heading">
                <Mail size={17} />
                <span>邮箱验证</span>
              </div>
              <label className="auth-field">
                联系邮箱
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => {
                    setEmail(event.target.value)
                    setEmailStatus(null)
                    setEmailDebugCode(null)
                    setError(null)
                  }}
                  placeholder="填写邮箱后可发送邮箱验证码"
                  type="email"
                  value={email}
                />
              </label>
              <div className="auth-code-row">
                <input
                  className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
                  onChange={(event) => setEmailCode(event.target.value)}
                  placeholder="请输入邮箱验证码"
                  value={emailCode}
                />
                <button
                  className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
                  disabled={emailSending || emailCooldown > 0 || !trimmedEmail}
                  onClick={() => void sendCode('email')}
                  type="button"
                >
                  {emailCooldown > 0
                    ? `${emailCooldown}s`
                    : emailSending
                      ? '发送中'
                      : '发送邮箱验证码'}
                </button>
              </div>
              <p className="auth-field-hint">
                若你更希望走手机注册，可直接点击上方“手机验证”标签切换。
              </p>
              {emailStatus ? (
                <p className="auth-feedback auth-feedback--success">{emailStatus}</p>
              ) : null}
              {emailDebugCode ? (
                <p className="auth-feedback auth-feedback--info">
                  当前为开发联调模式，邮箱验证码：<strong>{emailDebugCode}</strong>
                </p>
              ) : null}
            </div>

            <div className="auth-step-actions">
              <button
                className="theme-outline-button rounded-md px-4 py-2.5 text-sm font-semibold"
                onClick={() => moveToStep('basic')}
                type="button"
              >
                返回基础信息
              </button>
              <button
                className="theme-primary-button rounded-md px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading}
                onClick={() => void submitRegistration()}
                type="button"
              >
                {loading ? '注册中...' : '创建合作伙伴账号'}
              </button>
            </div>
          </div>
        ) : null}

        {activeStep === 'phone' ? (
          <div className="auth-form-shell">
            <div className="auth-section-card">
              <div className="auth-section-heading">
                <Smartphone size={17} />
                <span>手机验证</span>
              </div>
              <label className="auth-field">
                联系手机
                <input
                  className="theme-input w-full rounded-lg px-4 py-3"
                  onChange={(event) => {
                    setPhone(event.target.value)
                    setSMSStatus(null)
                    setSMSDebugCode(null)
                    setError(null)
                  }}
                  placeholder="请输入 11 位手机号"
                  value={phone}
                />
              </label>
              <div className="auth-code-row">
                <input
                  className="theme-input min-w-0 rounded-lg px-4 py-3 text-sm"
                  onChange={(event) => setSMSCode(event.target.value)}
                  placeholder="请输入短信验证码"
                  value={smsCode}
                />
                <button
                  className="theme-outline-button auth-send-button rounded-md px-3 py-2.5 text-sm font-semibold disabled:opacity-60"
                  disabled={smsSending || smsCooldown > 0 || trimmedPhone.length !== 11}
                  onClick={() => void sendCode('sms')}
                  type="button"
                >
                  {smsCooldown > 0 ? `${smsCooldown}s` : smsSending ? '发送中' : '发送短信验证码'}
                </button>
              </div>
              <p className="auth-field-hint">
                只完成手机验证也可以创建账号，注册成功后可直接用手机号或手机号验证码登录。
              </p>
              {smsStatus ? (
                <p className="auth-feedback auth-feedback--success">{smsStatus}</p>
              ) : null}
              {smsDebugCode ? (
                <p className="auth-feedback auth-feedback--info">
                  当前为开发联调模式，短信验证码：<strong>{smsDebugCode}</strong>
                </p>
              ) : null}
            </div>

            <div className="auth-step-actions">
              <button
                className="theme-outline-button rounded-md px-4 py-2.5 text-sm font-semibold"
                onClick={() => moveToStep('basic')}
                type="button"
              >
                返回基础信息
              </button>
              <button
                className="theme-primary-button rounded-md px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                disabled={loading}
                onClick={() => void submitRegistration()}
                type="button"
              >
                {loading ? '注册中...' : '创建合作伙伴账号'}
              </button>
            </div>
          </div>
        ) : null}

        {error ? <p className="auth-feedback auth-feedback--error">{error}</p> : null}
        {success ? <p className="auth-feedback auth-feedback--success">{success}</p> : null}

        <div className="auth-link-row">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck size={15} />
            邮箱验证码或短信验证码至少完成一种
          </span>
          <Link className="font-semibold text-ht-blue" href="/login">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  )
}

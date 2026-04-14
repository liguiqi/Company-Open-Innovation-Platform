'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

type VerifyState = 'error' | 'idle' | 'success'

export function VerifyClient({ token }: { token?: string }) {
  const [message, setMessage] = useState(
    token ? '正在校验验证链接...' : '缺少验证 token，请从邮箱中的完整链接重新进入。',
  )
  const [state, setState] = useState<VerifyState>(token ? 'idle' : 'error')

  useEffect(() => {
    if (!token) {
      return
    }

    fetch(`/api/auth/verify?token=${token}`)
      .then(async (response) => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || '验证失败')
        }

        setState('success')
        setMessage('邮箱验证成功，当前已自动登录，可直接进入工作台。')
      })
      .catch((error: Error) => {
        setState('error')
        setMessage(error.message)
      })
  }, [token])

  return (
    <div className="w-full rounded-[2rem] border border-white/60 bg-white/90 p-8 text-center shadow-2xl shadow-slate-200/80 backdrop-blur">
      <p className="font-display text-3xl font-semibold text-slate-950">邮箱验证</p>
      <p className="mt-4 text-sm leading-7 text-slate-500">{message}</p>

      <div className="mt-6 flex justify-center gap-3">
        {state === 'success' ? (
          <Link
            className="rounded-full bg-ht-blue px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-950"
            href="/dashboard"
          >
            进入工作台
          </Link>
        ) : (
          <Link
            className="rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-ht-blue hover:text-ht-blue"
            href="/login"
          >
            返回登录
          </Link>
        )}
      </div>
    </div>
  )
}

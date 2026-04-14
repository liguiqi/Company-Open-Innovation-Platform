'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { User } from '@/payload-types'

import { roleLabelMap } from '@/lib/constants'

export function DashboardTopBar({ user }: { user: Pick<User, 'name' | 'role' | 'email'> }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="glass-panel mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/60 p-5 shadow-lg shadow-slate-200/80 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-slate-950">欢迎回来，{user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          {roleLabelMap[user.role]} · {user.email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-ht-blue hover:text-ht-blue"
          href="/admin"
        >
          管理后台
        </Link>
        <button
          className="rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-ht-blue"
          onClick={logout}
          type="button"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

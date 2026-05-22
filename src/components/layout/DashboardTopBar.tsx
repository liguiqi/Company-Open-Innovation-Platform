'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import type { User } from '@/payload-types'

import { roleLabelMap } from '@/lib/constants'
import { emitRouteTransitionStart } from '@/lib/navigation'

export function DashboardTopBar({ user }: { user: Pick<User, 'name' | 'role' | 'email'> }) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    emitRouteTransitionStart()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="theme-dashboard-panel mb-8 flex flex-col gap-4 rounded-xl p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--oip-text-muted)]">Workspace</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--oip-text-primary)]">
          欢迎回来，{user.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--oip-text-muted)]">
          {roleLabelMap[user.role]} · {user.email}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Link
          className="theme-outline-button rounded-md px-4 py-2 text-sm font-medium"
          href="/admin"
        >
          管理后台
        </Link>
        <button
          className="theme-primary-button rounded-md px-4 py-2 text-sm font-medium"
          onClick={logout}
          type="button"
        >
          退出登录
        </button>
      </div>
    </div>
  )
}

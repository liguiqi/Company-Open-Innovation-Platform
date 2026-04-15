'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Blocks, BriefcaseBusiness, LayoutDashboard, Settings, Users } from 'lucide-react'

import { HetWordmark } from '@/components/shared/HetWordmark'
import type { User } from '@/payload-types'

import { cn } from '@/lib/utils'

const baseItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: '概览' },
  { href: '/dashboard/proposals', icon: Blocks, label: '方案管理' },
  { href: '/dashboard/settings', icon: Settings, label: '个人设置' },
]

const adminItems = [
  { href: '/dashboard/partners', icon: BriefcaseBusiness, label: '伙伴管理' },
  { href: '/dashboard/users', icon: Users, label: '用户管理' },
]

export function DashboardSidebar({ role }: { role: User['role'] }) {
  const pathname = usePathname()
  const items = role === 'admin' ? [...baseItems, ...adminItems] : baseItems

  return (
    <aside className="glass-panel sticky top-4 rounded-[2rem] border border-white/60 p-5 shadow-2xl shadow-slate-200/80">
      <div className="mb-8 border-b border-slate-200 pb-5">
        <HetWordmark className="h-9" />
        <p className="mt-2 text-sm text-slate-500">Innovation Workspace</p>
      </div>

      <nav className="space-y-2">
        {items.map((item) => {
          const active =
            pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              className={cn(
                'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-ht-blue',
                active && 'bg-slate-950 text-white hover:bg-slate-950 hover:text-white',
              )}
              href={item.href}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="mt-8 rounded-2xl bg-slate-950 p-4 text-sm text-slate-300">
        <p className="font-semibold text-white">Payload Admin</p>
        <p className="mt-2 leading-6">内容结构、媒体资产和权限策略仍可直接在 `/admin` 中维护。</p>
      </div>
    </aside>
  )
}

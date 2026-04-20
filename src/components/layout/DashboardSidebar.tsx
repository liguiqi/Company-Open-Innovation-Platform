'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Blocks, BriefcaseBusiness, LayoutDashboard, Settings, Users } from 'lucide-react'

import type { User } from '@/payload-types'

import { HetBrandLogo } from '@/components/shared/HetBrandLogo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
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
    <aside className="dashboard-sidebar theme-dashboard-panel relative overflow-hidden rounded-xl p-5 lg:flex lg:h-full lg:min-h-0 lg:flex-col">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{
          background:
            'radial-gradient(circle at top left, var(--ht-dashboard-shell-glow), transparent 72%)',
        }}
      />

      <div className="dashboard-sidebar-brand theme-dashboard-highlight relative mb-8 rounded-lg p-4">
        <Link aria-label="返回首页" className="block" href="/">
          <HetBrandLogo className="theme-logo-adaptive w-[152px] sm:w-[164px]" priority />
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <span className="h-px flex-1 bg-[color:var(--ht-border-soft)]" />
          <p className="text-[11px] uppercase tracking-[0.3em] text-[var(--ht-text-muted)]">
            Workspace
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <p className="text-[13px] leading-5 text-[var(--ht-text-secondary)]">开放创新工作台</p>
          <ThemeToggle className="shrink-0" />
        </div>
      </div>

      <div className="dashboard-sidebar-scroll min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
        <nav className="space-y-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                className={cn(
                  'theme-dashboard-nav-link group flex items-center gap-3 rounded-lg border border-transparent px-3 py-3 text-sm font-medium',
                  active && 'is-active',
                )}
                href={item.href}
              >
                <span className="theme-dashboard-nav-icon flex h-10 w-10 items-center justify-center rounded-lg">
                  <Icon size={18} />
                </span>
                <span className="flex-1">{item.label}</span>
                {active ? <span className="h-2.5 w-2.5 rounded-sm bg-ht-light-blue" /> : null}
              </Link>
            )
          })}
        </nav>

        <div className="theme-dashboard-info mt-8 rounded-lg p-4 text-sm text-[var(--ht-text-secondary)]">
          <p className="text-xs uppercase tracking-[0.3em] text-ht-light-blue">Content Ops</p>
          <p className="mt-2 font-semibold text-[var(--ht-text-primary)]">Payload Admin</p>
          <p className="mt-2 leading-6 text-[var(--ht-text-secondary)]">
            内容结构、媒体资产和权限策略仍可直接在{' '}
            <span className="font-semibold text-ht-blue">/admin</span> 中维护。
          </p>
        </div>
      </div>

      <div className="theme-dashboard-legal mt-6 border-t border-[color:var(--ht-border-soft)] pt-4 text-center lg:mt-4 lg:shrink-0">
        <p>2026 HET. All rights reserved.</p>
        <p>HET Tech Research Inst. | LGQ</p>
      </div>
    </aside>
  )
}

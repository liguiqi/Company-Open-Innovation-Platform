'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'

const navItems = [
  { href: '/', label: '首页' },
  { href: '/needs', label: '技术需求大厅' },
  { href: '/ecosystem', label: '生态伙伴目录' },
  { href: '/cases', label: '联合创新案例' },
  { href: '/process', label: '合作流程' },
]

export function PublicHeader({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/90 backdrop-blur-xl">
      <div className="container-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
        <Link className="flex items-center gap-3" href="/">
          <div className="font-display text-4xl font-bold italic tracking-tight text-ht-blue">
            H&T
          </div>
          <div className="h-9 w-px bg-slate-200" />
          <div className="space-y-1">
            <p className="text-[11px] uppercase tracking-[0.35em] text-slate-500">
              Open Innovation
            </p>
            <p className="text-sm font-semibold text-slate-900">Open Innovation Platform</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 lg:flex">
          {navItems.map((item) => {
            const active =
              pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                className={cn(
                  'relative py-3 transition hover:text-ht-blue',
                  active &&
                    'text-ht-blue after:absolute after:-bottom-5 after:left-0 after:h-0.5 after:w-full after:bg-ht-light-blue',
                )}
                href={item.href}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <Link
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-ht-blue hover:text-ht-blue"
              href="/dashboard"
            >
              进入工作台
            </Link>
          ) : (
            <Link
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold text-slate-700 transition hover:border-ht-blue hover:text-ht-blue"
              href="/login"
            >
              登录
            </Link>
          )}
          <Link
            className="rounded-full bg-ht-light-blue px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-200 transition hover:bg-ht-blue"
            href="/submit"
          >
            提交创新方案
          </Link>
        </div>
      </div>
    </header>
  )
}

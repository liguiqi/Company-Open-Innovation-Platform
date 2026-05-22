'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { BrandLogo } from '@/components/shared/BrandLogo'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
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
    <header className="theme-header sticky top-0 z-40 backdrop-blur-sm">
      <div className="container-shell flex min-h-20 flex-wrap items-center justify-between gap-4 py-4">
        <div className="flex shrink-0 items-center gap-3">
          <Link className="flex items-center gap-3" href="/">
            <BrandLogo className="theme-logo-adaptive w-[168px] lg:w-[182px]" priority />
            <div className="h-9 w-px bg-[color:var(--oip-border-soft)]" />
            <div className="space-y-1 leading-tight">
              <p className="text-[11px] uppercase tracking-[0.35em] text-[var(--oip-text-muted)]">
                Open Innovation
              </p>
              <p className="text-sm font-semibold text-[var(--oip-text-primary)]">
                Open Innovation Platform
              </p>
            </div>
          </Link>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-[var(--oip-text-secondary)] lg:flex">
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
          <ThemeToggle />
          {isLoggedIn ? (
            <Link
              className="theme-outline-button rounded-md px-5 py-2 text-sm font-semibold"
              href="/dashboard"
            >
              进入工作台
            </Link>
          ) : (
            <Link
              className="theme-outline-button rounded-md px-5 py-2 text-sm font-semibold"
              href="/login"
            >
              登录
            </Link>
          )}
          <Link
            className="theme-accent-button rounded-md px-5 py-2 text-sm font-semibold shadow-sm shadow-sky-200/30"
            href="/submit"
          >
            提交方案
          </Link>
        </div>
      </div>
    </header>
  )
}

import Link from 'next/link'
import React from 'react'

import { HetWordmark } from '@/components/shared/HetWordmark'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-[#00316f] via-[#004098] to-[#00A0E9] p-10 text-white shadow-2xl shadow-slate-950/30 lg:flex lg:flex-col lg:justify-between">
          <div>
            <Link href="/">
              <HetWordmark className="h-14 text-white" />
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.4em] text-sky-100">
              Open Innovation Platform
            </p>
          </div>
          <div>
            <h1 className="font-display text-6xl font-semibold leading-none">
              开放协同，快速导入。
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-blue-50">
              统一的合作伙伴认证入口，连接公开需求、联合创新案例与方案评审工作台。
            </p>
          </div>
        </div>

        <div className="flex items-center justify-center">{children}</div>
      </div>
    </div>
  )
}

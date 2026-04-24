import Link from 'next/link'
import React from 'react'

import { RouteTransition } from '@/components/shared/RouteTransition'
import { HetBrandLogo } from '@/components/shared/HetBrandLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-auth-shell relative min-h-screen overflow-hidden">
      <div
        className="theme-auth-shell__media absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')",
        }}
      />
      <div className="hero-grid absolute inset-0 opacity-20" />
      <div className="theme-auth-shell__overlay absolute inset-0" />

      <div className="container-shell relative flex min-h-screen flex-col py-8 lg:py-12">
        <div className="grid flex-1 w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-14">
          <div className="space-y-10 text-[var(--ht-auth-text)]">
            <div className="space-y-4">
              <Link className="inline-flex" href="/">
                <HetBrandLogo className="theme-logo-adaptive w-[180px] md:w-[210px]" priority />
              </Link>
              <div className="space-y-2">
                <p className="text-xs uppercase tracking-[0.42em] text-[var(--ht-auth-muted)]">
                  Open Innovation Platform
                </p>
                <p className="text-sm font-semibold text-[var(--ht-auth-text)]">
                  Open Innovation Platform
                </p>
              </div>
            </div>

            <div className="max-w-2xl space-y-6">
              <h1 className="font-display text-4xl font-semibold leading-[1.14] md:text-6xl md:leading-[1.08] xl:text-7xl">
                开放协同，
                <br />
                高效导入。
              </h1>
              <p className="max-w-xl text-base leading-8 text-[var(--ht-auth-muted)] md:text-lg">
                从公开需求发布、合作伙伴方案提交到内部评审流转，登录后即可进入与官网视觉一致的创新协作入口。
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-sm">
              <div className="theme-auth-chip rounded-md px-4 py-2 backdrop-blur-sm">
                公开需求对接
              </div>
              <div className="theme-auth-chip rounded-md px-4 py-2 backdrop-blur-sm">
                创新方案提交
              </div>
              <div className="theme-auth-chip rounded-md px-4 py-2 backdrop-blur-sm">
                评审工作台
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <RouteTransition className="w-full max-w-[520px]">{children}</RouteTransition>
          </div>
        </div>

        <p className="theme-auth-footer mt-8 text-center text-xs">
          © 2026 Shenzhen HET Intelligent Control Co., Ltd. All rights reserved. Powered by LGQ
          {' | '}Ver 2026.04
        </p>
      </div>
    </div>
  )
}

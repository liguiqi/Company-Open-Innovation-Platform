import type { Metadata } from 'next'
import { Barlow_Condensed, Noto_Sans_SC } from 'next/font/google'
import React from 'react'

import { THEME_BOOTSTRAP_SCRIPT } from '@/lib/theme'

import './globals.css'

const bodyFont = Noto_Sans_SC({
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-body',
  weight: ['400', '500', '700'],
})

const displayFont = Barlow_Condensed({
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
})

export const metadata: Metadata = {
  description:
    'HeT开放创新平台，连接全球产业链伙伴，共创智能控制、汽车电子与电动工具领域的联合创新方案。',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'HeT Open Innovation Platform',
    template: '%s | HeT Open Innovation Platform',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP_SCRIPT }} />
      </head>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-[var(--ht-surface)] text-[var(--ht-text-primary)]`}
      >
        {children}
      </body>
    </html>
  )
}

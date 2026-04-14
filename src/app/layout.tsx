import type { Metadata } from 'next'
import { Barlow_Condensed, Noto_Sans_SC } from 'next/font/google'
import React from 'react'

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
    'Open Innovation Platform，连接全球产业链伙伴，共创智能控制、汽车电子与电动工具领域的联合创新方案。',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'),
  title: {
    default: 'H&T Open Innovation Platform',
    template: '%s | H&T Open Innovation Platform',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${bodyFont.variable} ${displayFont.variable} min-h-screen bg-[var(--ht-surface)] text-slate-900`}
      >
        {children}
      </body>
    </html>
  )
}

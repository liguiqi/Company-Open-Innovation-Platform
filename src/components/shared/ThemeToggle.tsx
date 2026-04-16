'use client'

import Image from 'next/image'

import { THEME_ATTRIBUTE, THEME_STORAGE_KEY, type AppTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

function resolveTheme() {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const savedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
  if (savedTheme === 'dark' || savedTheme === 'light') {
    return savedTheme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme: AppTheme) {
  const root = document.documentElement
  root.setAttribute(THEME_ATTRIBUTE, theme)
  root.style.colorScheme = theme
  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export function ThemeToggle({ className }: { className?: string }) {
  return (
    <button
      aria-label="切换深浅主题"
      className={cn('theme-toggle', className)}
      onClick={() => {
        const resolvedTheme = resolveTheme() === 'dark' ? 'light' : 'dark'
        applyTheme(resolvedTheme)
      }}
      title="切换深浅主题"
      type="button"
    >
      <Image
        alt=""
        aria-hidden="true"
        className="theme-toggle__image theme-toggle__image--light"
        height={20}
        src="/theme/toggle-light.png"
        unoptimized
        width={90}
      />
      <Image
        alt=""
        aria-hidden="true"
        className="theme-toggle__image theme-toggle__image--dark"
        height={20}
        src="/theme/toggle-dark.png"
        unoptimized
        width={90}
      />
    </button>
  )
}

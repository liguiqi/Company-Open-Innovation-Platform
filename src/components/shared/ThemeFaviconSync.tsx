'use client'

import { useEffect } from 'react'

import { THEME_ATTRIBUTE, type AppTheme } from '@/lib/theme'

const ICON_BY_THEME: Record<AppTheme, string> = {
  dark: '/branding/brand-favicon-32-white.png',
  light: '/branding/brand-favicon-32.png',
}

const THEME_COLOR_BY_THEME: Record<AppTheme, string> = {
  dark: '#07111d',
  light: '#f8fafc',
}

function getResolvedTheme(): AppTheme {
  const theme = document.documentElement.getAttribute(THEME_ATTRIBUTE)

  if (theme === 'light' || theme === 'dark') {
    return theme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function upsertLink(key: string, rel: string, href: string, sizes?: string) {
  const selector = 'link[data-oip-managed="true"][data-oip-key="' + key + '"]'
  let link = document.head.querySelector(selector) as HTMLLinkElement | null

  if (!link) {
    link = document.createElement('link')
    link.dataset.oipManaged = 'true'
    link.dataset.oipKey = key
    link.rel = rel
    document.head.appendChild(link)
  }

  if (link.href !== href) {
    link.href = href
  }

  if (link.type !== 'image/png') {
    link.type = 'image/png'
  }

  if (sizes) {
    if (link.getAttribute('sizes') !== sizes) {
      link.setAttribute('sizes', sizes)
    }
  } else {
    link.removeAttribute('sizes')
  }
}

function upsertThemeColor(content: string) {
  let meta = document.head.querySelector(
    'meta[name="theme-color"][data-oip-managed="true"]',
  ) as HTMLMetaElement | null

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'theme-color'
    meta.dataset.oipManaged = 'true'
    document.head.appendChild(meta)
  }

  if (meta.content !== content) {
    meta.content = content
  }
}

function applyThemeAssets() {
  const theme = getResolvedTheme()
  const href = ICON_BY_THEME[theme]

  upsertLink('icon', 'icon', href, '32x32')
  upsertLink('shortcut', 'shortcut icon', href, '32x32')
  upsertLink('apple', 'apple-touch-icon', '/branding/brand-apple-touch-180.png', '180x180')
  upsertThemeColor(THEME_COLOR_BY_THEME[theme])
}

export function ThemeFaviconSync() {
  useEffect(() => {
    const root = document.documentElement
    const apply = () => {
      applyThemeAssets()
    }

    apply()

    const rootObserver = new MutationObserver(apply)
    rootObserver.observe(root, {
      attributeFilter: [THEME_ATTRIBUTE],
      attributes: true,
    })

    return () => {
      rootObserver.disconnect()
    }
  }, [])

  return null
}

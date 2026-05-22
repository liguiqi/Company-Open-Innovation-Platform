/* eslint-disable @next/next/no-img-element */
'use client'

import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

function getResolvedTheme() {
  const theme = document.documentElement.getAttribute('data-theme')

  if (theme === 'light' || theme === 'dark') {
    return theme
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function AdminLoginLogo() {
  const [theme, setTheme] = useState<'dark' | 'light'>('light')

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')

    const applyTheme = () => {
      setTheme(getResolvedTheme())
    }

    applyTheme()

    const observer = new MutationObserver(applyTheme)
    observer.observe(document.documentElement, {
      attributeFilter: ['data-theme'],
      attributes: true,
    })

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', applyTheme)
    } else {
      media.addListener(applyTheme)
    }

    return () => {
      observer.disconnect()

      if (typeof media.removeEventListener === 'function') {
        media.removeEventListener('change', applyTheme)
      } else {
        media.removeListener(applyTheme)
      }
    }
  }, [])

  return (
    <div aria-label="Open Innovation OIP" className="payload-brand-logo" role="img">
      <img
        alt=""
        aria-hidden="true"
        className={cn(
          'payload-brand-logo__image',
          theme === 'dark' && 'payload-brand-logo__image--inverted',
        )}
        src="/branding/brand-full-logo.png"
      />
    </div>
  )
}

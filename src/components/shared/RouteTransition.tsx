'use client'

import type { ReactNode } from 'react'

import { usePathname } from 'next/navigation'
import { startTransition, useEffect, useEffectEvent, useRef, useState } from 'react'

import { ROUTE_TRANSITION_EVENT } from '@/lib/navigation'
import { cn } from '@/lib/utils'

function isInternalNavigableLink(anchor: HTMLAnchorElement) {
  const href = anchor.getAttribute('href')
  const target = anchor.getAttribute('target')
  const currentURL = new URL(window.location.href)

  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false
  }

  if (anchor.dataset.noTransition === 'true' || anchor.hasAttribute('download')) {
    return false
  }

  if (target && target !== '_self') {
    return false
  }

  const nextURL = new URL(anchor.href, currentURL)
  const currentPathWithSearch = `${currentURL.pathname}${currentURL.search}`
  const nextPathWithSearch = `${nextURL.pathname}${nextURL.search}`

  if (nextURL.origin !== currentURL.origin) {
    return false
  }

  if (nextPathWithSearch === currentPathWithSearch) {
    return false
  }

  return true
}

export function RouteTransition({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  const pathname = usePathname()
  const initialRenderRef = useRef(true)
  const resetTimerRef = useRef<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)

  const routeKey = pathname

  const clearResetTimer = useEffectEvent(() => {
    if (resetTimerRef.current) {
      window.clearTimeout(resetTimerRef.current)
      resetTimerRef.current = null
    }
  })

  const beginTransition = useEffectEvent(() => {
    clearResetTimer()

    startTransition(() => {
      setIsNavigating(true)
    })

    resetTimerRef.current = window.setTimeout(() => {
      setIsNavigating(false)
      resetTimerRef.current = null
    }, 1600)
  })

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return
      }

      const target = event.target

      if (!(target instanceof Element)) {
        return
      }

      const anchor = target.closest('a')

      if (!(anchor instanceof HTMLAnchorElement) || !isInternalNavigableLink(anchor)) {
        return
      }

      beginTransition()
    }

    function handleProgrammaticNavigation() {
      beginTransition()
    }

    function handlePopState() {
      beginTransition()
    }

    document.addEventListener('click', handleDocumentClick, true)
    window.addEventListener(ROUTE_TRANSITION_EVENT, handleProgrammaticNavigation)
    window.addEventListener('popstate', handlePopState)

    return () => {
      document.removeEventListener('click', handleDocumentClick, true)
      window.removeEventListener(ROUTE_TRANSITION_EVENT, handleProgrammaticNavigation)
      window.removeEventListener('popstate', handlePopState)
      clearResetTimer()
    }
  }, [])

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false
      return
    }

    clearResetTimer()

    const timer = window.setTimeout(() => {
      setIsNavigating(false)
      resetTimerRef.current = null
    }, 260)

    resetTimerRef.current = timer

    return () => {
      window.clearTimeout(timer)
    }
  }, [routeKey])

  return (
    <div className={cn('route-transition-shell', className)}>
      <div
        aria-hidden="true"
        className={cn('route-transition-overlay', isNavigating && 'is-active')}
      />
      <div className="route-transition-stage" key={routeKey}>
        {children}
      </div>
    </div>
  )
}

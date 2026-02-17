'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'

const UnicornScene = dynamic(
  () => import('unicornstudio-react/next'),
  { ssr: false }
)

const SDK_URL = 'https://cdn.jsdelivr.net/gh/hiunicornstudio/unicornstudio.js@v2.0.5/dist/unicornStudio.umd.js'

function removeWatermark() {
  const links = document.querySelectorAll('a[href*="unicorn.studio"], a[href*="unicorn"]')
  links.forEach((el) => {
    const htmlEl = el as HTMLElement
    htmlEl.style.display = 'none'
    htmlEl.style.visibility = 'hidden'
    htmlEl.style.opacity = '0'
    htmlEl.style.pointerEvents = 'none'
    htmlEl.style.width = '0'
    htmlEl.style.height = '0'
    htmlEl.style.overflow = 'hidden'
    htmlEl.style.position = 'absolute'
    htmlEl.remove()
  })
}

type UnicornProps = {
  height?: string
  projectId?: string
}

export function UnicornAnimation({
  height = '400px',
  projectId = 'UZtv9BBSpmcBeRuGwvZU',
}: UnicornProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const startWatermarkRemoval = useCallback(() => {
    removeWatermark()
    const interval = setInterval(removeWatermark, 500)
    setTimeout(() => {
      clearInterval(interval)
      removeWatermark()
    }, 10000)
    return interval
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!isVisible) return
    const timeout = setTimeout(() => {
      const interval = startWatermarkRemoval()
      return () => clearInterval(interval)
    }, 1000)
    return () => clearTimeout(timeout)
  }, [isVisible, startWatermarkRemoval])

  return (
    <div
      ref={containerRef}
      style={{ width: '100%', height }}
      className="overflow-hidden relative"
    >
      {isVisible ? (
        <UnicornScene
          projectId={projectId}
          sdkUrl={SDK_URL}
          width="100%"
          height="100%"
          fps={24}
          lazyLoad={true}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-background to-muted animate-pulse" />
      )}
    </div>
  )
}

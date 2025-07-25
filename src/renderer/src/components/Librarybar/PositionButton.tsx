import { Button } from '~/components/ui/button'
import React, { useEffect, useRef, useState } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { cn, scrollToElement } from '~/utils'
import { create } from 'zustand'

interface PositionButtonProps {
  className?: string
  scrollBehavior?: ScrollBehavior
  iconClassName?: string
  targetSelector?: string
  threshold?: number
  position?: string
}

interface usePositionButtonStore {
  lazyloadMark: string
  setLazyloadMark: (mark: string) => void
}

// eslint-disable-next-line
export const usePositionButtonStore = create<usePositionButtonStore>((set) => ({
  lazyloadMark: 'lazyload',
  setLazyloadMark: (mark: string): void => set(() => ({ lazyloadMark: mark }))
}))

export const PositionButton = React.memo(function PositionButton({
  className,
  scrollBehavior = 'instant',
  iconClassName = 'icon-[mdi--crosshairs-gps] w-5 h-5',
  targetSelector,
  threshold = 0.5,
  position = 'bottom-4 right-4'
}: PositionButtonProps): React.JSX.Element | null {
  // Getting Routing Information
  const { location } = useRouterState()
  const { pathname } = location
  const lazyloadMark = usePositionButtonStore((state) => state.lazyloadMark)
  const [isTargetVisible, setIsTargetVisible] = useState(true)
  const visibilityTimeout = useRef<NodeJS.Timeout | null>(null)

  // Determine if you are on the game details page
  const isGameDetailPage = pathname.includes('/library/games/')

  // Get the selector of the target element
  const getTargetSelector = (): string => {
    if (targetSelector) return targetSelector

    // Builds the game element selector based on the current path by default
    const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
    const currentGroupId = decodeURIComponent(pathname.split('/games/')[1]?.split('/')[1] || '')

    if (!currentGameId || !currentGroupId) return ''
    return `[data-game-id="${currentGameId}"][data-group-id="${currentGroupId}"]`
  }

  // Scroll to target element
  const scrollToTarget = (): void => {
    const selector = getTargetSelector()
    if (!selector) return

    scrollToElement({
      selector,
      behavior: scrollBehavior,
      block: 'center'
    })
  }

  // Set element visibility listener - always on top of the component
  useEffect(() => {
    // If you are not on the game details page, the listening logic is not executed
    if (!isGameDetailPage) return

    const selector = getTargetSelector()
    if (!selector) return

    const targetElement = document.querySelector(selector)
    if (!targetElement) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (visibilityTimeout.current) {
          clearTimeout(visibilityTimeout.current)
        }

        // Reducing the frequency of state updates with setTimeout and requestAnimationFrame
        visibilityTimeout.current = setTimeout(() => {
          requestAnimationFrame(() => {
            setIsTargetVisible(entry.isIntersecting)
          })
        }, 150)
      },
      {
        root: null,
        threshold,
        rootMargin: '20px'
      }
    )

    observer.observe(targetElement)

    return (): void => {
      observer.disconnect()
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current)
      }
    }
  }, [pathname, threshold, isGameDetailPage, lazyloadMark])

  if (!isGameDetailPage) {
    return null
  }

  return (
    <Button
      size="icon"
      className={cn(
        'absolute transition-all duration-200 shadow-md hover:bg-primary',
        'transform',
        position,
        isTargetVisible
          ? 'opacity-0 translate-y-2 pointer-events-none'
          : 'opacity-0 translate-y-0 group-hover:opacity-100',
        className
      )}
      onClick={scrollToTarget}
    >
      <span className={cn(iconClassName)} />
    </Button>
  )
})

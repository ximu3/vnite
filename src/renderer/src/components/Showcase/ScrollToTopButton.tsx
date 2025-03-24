import React, { useEffect, useRef, useState } from 'react'
import { Button } from '@ui/button'
import { cn } from '~/utils'

interface ScrollToTopButtonProps {
  scrollAreaRef: React.RefObject<HTMLDivElement>
  className?: string
  scrollBehavior?: ScrollBehavior
  threshold?: number
}

export const ScrollToTopButton = React.memo(function ScrollToTopButton({
  scrollAreaRef,
  className,
  scrollBehavior = 'instant',
  threshold = 300
}: ScrollToTopButtonProps): JSX.Element {
  const [isVisible, setIsVisible] = useState(false)
  const visibilityTimeout = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!scrollAreaRef.current) return

    const viewportElement = scrollAreaRef.current.querySelector('[class*="h-full w-full"]')

    if (!viewportElement) {
      console.error('viewport element not found')
      return
    }

    const handleScroll = (): void => {
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current)
      }

      visibilityTimeout.current = setTimeout(() => {
        requestAnimationFrame(() => {
          setIsVisible((viewportElement as HTMLElement).scrollTop > threshold)
        })
      }, 150)
    }

    viewportElement.addEventListener('scroll', handleScroll)

    return (): void => {
      viewportElement.removeEventListener('scroll', handleScroll)
      if (visibilityTimeout.current) {
        clearTimeout(visibilityTimeout.current)
      }
    }
  }, [scrollAreaRef, threshold])

  const scrollToTop = (): void => {
    if (!scrollAreaRef.current) return

    const viewportElement = scrollAreaRef.current.querySelector('[class*="h-full w-full"]')

    if (viewportElement) {
      ;(viewportElement as HTMLElement).scrollTo({
        top: 0,
        behavior: scrollBehavior
      })
    }
  }

  return (
    <Button
      size="icon"
      className={cn(
        'fixed z-50 transition-all duration-200 shadow-md hover:bg-primary',
        'bottom-6 right-6',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none',
        className
      )}
      onClick={scrollToTop}
    >
      <span className={cn('icon-[mdi--arrow-up] w-5 h-5')} />
    </Button>
  )
})

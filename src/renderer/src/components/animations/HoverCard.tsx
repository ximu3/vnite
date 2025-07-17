import { animated, useSpring } from '@react-spring/web'
import { ReactNode, HTMLAttributes, useEffect, useRef } from 'react'
import { cn } from '~/utils'

interface HoverCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  imageConfig?: {
    scale: {
      initial: number
      hover: number
    }
  }
  animationConfig?: {
    tension?: number
    friction?: number
  }
}

export function HoverCardAnimation({
  children,
  className,
  imageConfig = {
    scale: {
      initial: 1,
      hover: 1.02
    }
  },
  animationConfig = {
    tension: 750,
    friction: 95
  },
  ...rest
}: HoverCardProps): React.JSX.Element {
  // Reference to the element
  const cardRef = useRef<HTMLDivElement>(null)

  // Animation configuration
  const springConfig = {
    tension: animationConfig.tension,
    friction: animationConfig.friction,
    precision: 0.0001,
    mass: 1,
    clamp: true
  }

  // Image scaling animation state
  const [springs, api] = useSpring(() => ({
    imageScale: imageConfig.scale.initial,
    config: springConfig,
    immediate: true
  }))

  // Use useEffect to listen for hover events on the parent element
  useEffect(() => {
    // Get the parent element containing the 'group' class
    const findGroupParent = (element: HTMLElement | null): HTMLElement | null => {
      if (!element) return null
      if (element.classList.contains('group')) return element
      return findGroupParent(element.parentElement)
    }

    const card = cardRef.current
    if (!card) return

    const groupParent = findGroupParent(card)
    if (!groupParent) return

    // Listen for hover events on the parent element
    const handleGroupEnter = (): void => {
      api.start({
        imageScale: imageConfig.scale.hover
      })
    }

    const handleGroupLeave = (): void => {
      api.start({
        imageScale: imageConfig.scale.initial
      })
    }

    groupParent.addEventListener('mouseenter', handleGroupEnter)
    groupParent.addEventListener('mouseleave', handleGroupLeave)

    return (): void => {
      groupParent.removeEventListener('mouseenter', handleGroupEnter)
      groupParent.removeEventListener('mouseleave', handleGroupLeave)
    }
  }, [api, imageConfig.scale])

  return (
    <animated.div
      ref={cardRef}
      className={cn(
        'relative overflow-hidden rounded-lg',
        'transform-gpu',
        'will-change-transform',
        className
      )}
      {...rest}
    >
      {/* Image layer */}
      <animated.div
        style={{
          transform: springs.imageScale.to((s) => `scale(${s})`),
          willChange: 'transform',
          width: '100%',
          height: '100%'
        }}
      >
        {children}
      </animated.div>
    </animated.div>
  )
}

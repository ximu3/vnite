import { animated, useSpring } from '@react-spring/web'
import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '~/utils'

interface HoverSquareCardProps extends HTMLAttributes<HTMLDivElement> {
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

export function HoverSquareCardAnimation({
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
}: HoverSquareCardProps): JSX.Element {
  // Animation Configuration
  const springConfig = {
    tension: animationConfig.tension,
    friction: animationConfig.friction,
    precision: 0.0001,
    mass: 1,
    clamp: true
  }

  // Image zoom animation state
  const [springs, api] = useSpring(() => ({
    imageScale: imageConfig.scale.initial,
    config: springConfig,
    immediate: true
  }))

  const handleMouseEnter = (): void => {
    api.start({
      imageScale: imageConfig.scale.hover
    })
  }

  const handleMouseLeave = (): void => {
    api.start({
      imageScale: imageConfig.scale.initial
    })
  }

  return (
    <animated.div
      className={cn(
        'relative overflow-hidden rounded-lg',
        'transform-gpu',
        'will-change-transform',
        className
      )}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* image layer */}
      <animated.div
        style={{
          transform: springs.imageScale.to((s) => `scale(${s})`),
          willChange: 'transform'
        }}
      >
        {children}
      </animated.div>
    </animated.div>
  )
}

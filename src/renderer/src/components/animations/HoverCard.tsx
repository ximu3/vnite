import { animated, useSpring, to } from '@react-spring/web'
import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '~/utils'

interface HoverCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  liftAmount?: number
  shadowConfig?: {
    initial: string
    hover: string
  }
  animationConfig?: {
    tension?: number
    friction?: number
  }
}

export function HoverCardAnimation({
  children,
  className,
  onClick,
  liftAmount = 6,
  shadowConfig = {
    initial: '0 2px 5px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.3)',
    hover: '0 3px 6px rgba(0, 0, 0, 0.35), 0 8px 16px rgba(0, 0, 0, 0.6)'
  },
  animationConfig = {
    tension: 750,
    friction: 95
  },
  ...rest
}: HoverCardProps): JSX.Element {
  const springConfig = {
    tension: animationConfig.tension,
    friction: animationConfig.friction,
    precision: 0.0001,
    mass: 1,
    clamp: true
  }

  const [springs, api] = useSpring(() => ({
    y: 0,
    boxShadow: shadowConfig.initial,
    shineX: 45,
    shineY: -45,
    shineScale: 1,
    shineOpacity: 0.3,
    config: springConfig,
    immediate: true
  }))

  const handleMouseEnter = (): void => {
    api.start({
      y: -liftAmount,
      boxShadow: shadowConfig.hover,
      shineX: 30,
      shineY: -30,
      shineScale: 1.2,
      shineOpacity: 1
    })
  }

  const handleMouseLeave = (): void => {
    api.start({
      y: 0,
      boxShadow: shadowConfig.initial,
      shineX: 45,
      shineY: -45,
      shineScale: 1,
      shineOpacity: 0.3
    })
  }

  const shineTransform = to(
    [springs.shineX, springs.shineY, springs.shineScale],
    (x, y, s) => `translate3d(${x}%, ${y}%, 0) rotate(-45deg) scale(${s})`
  )

  return (
    <animated.div
      className={cn(
        'relative overflow-hidden',
        'transform-gpu', // Accelerating with the GPU
        'will-change-transform',
        className
      )}
      onClick={onClick}
      style={{
        transform: springs.y.to((y) => `translate3d(0, ${y}px, 0) translateZ(0)`),
        boxShadow: springs.boxShadow,
        backfaceVisibility: 'hidden',
        WebkitFontSmoothing: 'antialiased'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {/* Glossy Effects - Blur Layer */}
      <animated.div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-40%',
          width: '150%',
          height: '150%',
          background: `linear-gradient(
            225deg,
            rgba(255, 255, 255, 0.4) 0%,
            rgba(255, 255, 255, 0.2) 30%,
            rgba(255, 255, 255, 0.1) 40%,
            rgba(255, 255, 255, 0) 60%
          )`,
          filter: 'blur(5px)',
          pointerEvents: 'none',
          zIndex: 1,
          transform: shineTransform,
          opacity: springs.shineOpacity,
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden'
        }}
      />

      {/* Glossy Effects - Main Layer */}
      <animated.div
        style={{
          position: 'absolute',
          top: '-40%',
          right: '-40%',
          width: '150%',
          height: '150%',
          background: `linear-gradient(
            225deg,
            transparent 0%,
            rgba(255, 255, 255, 0.15) 69.9%,
            rgba(255, 255, 255, 0.15) 90%,
            rgba(255, 255, 255, 0.05) 100%,
            transparent 100%
          )`,
          filter: 'blur(3px)',
          pointerEvents: 'none',
          zIndex: 2,
          transform: shineTransform,
          opacity: springs.shineOpacity,
          willChange: 'transform, opacity',
          backfaceVisibility: 'hidden'
        }}
      />

      <div className="relative z-0">{children}</div>
    </animated.div>
  )
}

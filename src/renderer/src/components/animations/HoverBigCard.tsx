import { animated, useSpring, to } from '@react-spring/web'
import { ReactNode, HTMLAttributes } from 'react'
import { cn } from '~/utils'

interface HoverBigCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  className?: string
  shineConfig?: {
    opacity: {
      initial: number
      hover: number
    }
    scale: {
      initial: number
      hover: number
    }
  }
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

export function HoverBigCardAnimation({
  children,
  className,
  shineConfig = {
    opacity: {
      initial: 0.3,
      hover: 1
    },
    scale: {
      initial: 1,
      hover: 1.2
    }
  },
  imageConfig = {
    scale: {
      initial: 1,
      hover: 1.03
    }
  },
  animationConfig = {
    tension: 750,
    friction: 95
  },
  ...rest
}: HoverBigCardProps): JSX.Element {
  // Animation Configuration
  const springConfig = {
    tension: animationConfig.tension,
    friction: animationConfig.friction,
    precision: 0.0001,
    mass: 1,
    clamp: true
  }

  // Merge shine and image animation states
  const [springs, api] = useSpring(() => ({
    shineX: 50,
    shineY: -30,
    shineScale: shineConfig.scale.initial,
    shineOpacity: shineConfig.opacity.initial,
    imageScale: imageConfig.scale.initial,
    config: springConfig,
    immediate: true
  }))

  const handleMouseEnter = (): void => {
    api.start({
      shineX: 30,
      shineY: -40,
      shineScale: shineConfig.scale.hover,
      shineOpacity: shineConfig.opacity.hover,
      imageScale: imageConfig.scale.hover
    })
  }

  const handleMouseLeave = (): void => {
    api.start({
      shineX: 50,
      shineY: -30,
      shineScale: shineConfig.scale.initial,
      shineOpacity: shineConfig.opacity.initial,
      imageScale: imageConfig.scale.initial
    })
  }

  const shineTransform = to(
    [springs.shineX, springs.shineY, springs.shineScale],
    (x, y, s) => `translate3d(${x}%, ${y}%, 0) rotate(30deg) scale(${s})`
  )

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
        className={cn('w-full h-full')}
      >
        {children}
      </animated.div>

      {/* Glossy Effects - Blur Layer */}
      <animated.div
        style={{
          position: 'absolute',
          top: '-55%',
          right: '-40%',
          width: '250%',
          height: '130%',
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
          top: '-55%',
          right: '-40%',
          width: '250%',
          height: '130%',
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
    </animated.div>
  )
}

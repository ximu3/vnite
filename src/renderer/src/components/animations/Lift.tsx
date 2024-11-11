import { animated, useSpring, SpringConfig } from '@react-spring/web'
import { ReactNode, HTMLAttributes } from 'react'

interface LiftProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  liftAmount?: number
  shadowConfig?: {
    initial: string
    hover: string
  }
  springConfig?: Partial<SpringConfig>
}

export function Lift({
  children,
  className,
  liftAmount = 2,
  shadowConfig = {
    initial: '0 4px 8px rgba(0, 0, 0, 0.7)',
    hover: '0 8px 16px rgba(0, 0, 0, 1)'
  },
  springConfig,
  ...rest
}: LiftProps): JSX.Element {
  const defaultConfig = {
    tension: 140,
    friction: 25,
    precision: 0.001,
    clamp: true
  }

  const [spring, api] = useSpring(() => ({
    y: 0,
    boxShadow: shadowConfig.initial,
    config: { ...defaultConfig, ...springConfig },
    immediate: true
  }))

  const handleMouseEnter = (): void => {
    api.start({
      y: -liftAmount,
      boxShadow: shadowConfig.hover
    })
  }

  const handleMouseLeave = (): void => {
    api.start({
      y: 0,
      boxShadow: shadowConfig.initial
    })
  }

  return (
    <animated.div
      className={className}
      style={{
        ...spring,
        transform: spring.y.to((y) => `translateY(${y}px)`)
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      {...rest}
    >
      {children}
    </animated.div>
  )
}

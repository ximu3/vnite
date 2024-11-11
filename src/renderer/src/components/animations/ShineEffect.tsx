import { animated, useSpring, to } from '@react-spring/web'
import { ReactNode } from 'react'
import { AnimationConfig } from './types'

interface ShineEffectProps {
  children: ReactNode
  className?: string
  isActive?: boolean // 新增控制属性
  springConfig?: AnimationConfig
}

export function ShineEffect({
  children,
  className,
  isActive = false, // 由父组件控制动画状态
  springConfig
}: ShineEffectProps): JSX.Element {
  const defaultConfig = {
    tension: 350,
    friction: 30,
    precision: 0.001,
    clamp: true
  }

  const [spring] = useSpring(
    () => ({
      x: 45,
      y: -45,
      scale: 1,
      opacity: 0.3,
      config: { ...defaultConfig, ...springConfig }
    }),
    []
  ) // 移除本地的鼠标事件处理

  // 响应父组件的状态变化
  useSpring({
    from: {
      x: 45,
      y: -45,
      scale: 1,
      opacity: 0.3
    },
    to: {
      x: isActive ? 30 : 45,
      y: isActive ? -30 : -45,
      scale: isActive ? 1.2 : 1,
      opacity: isActive ? 1 : 0.3
    },
    config: { ...defaultConfig, ...springConfig }
  })

  const shineTransform = to(
    [spring.x, spring.y, spring.scale],
    (x, y, s) => `translate(${x}%, ${y}%) rotate(-45deg) scale(${s})`
  )

  return (
    <animated.div className={`relative overflow-hidden ${className}`}>
      {/* 模糊层 */}
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
          opacity: spring.opacity,
          willChange: 'transform, opacity'
        }}
      />

      {/* 主层 */}
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
          opacity: spring.opacity,
          willChange: 'transform, opacity'
        }}
      />

      <div className="relative z-0">{children}</div>
    </animated.div>
  )
}

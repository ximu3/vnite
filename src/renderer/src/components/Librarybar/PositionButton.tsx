import { Button } from '@ui/button'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { cn } from '~/utils'

interface PositionButtonProps {
  /** 自定义类名 */
  className?: string
  /** 滚动到元素时的行为，默认为'instant' */
  scrollBehavior?: ScrollBehavior
  /** 自定义图标类名 */
  iconClassName?: string
  /** 目标元素的选择器，默认查找当前游戏元素 */
  targetSelector?: string
  /** 监听阈值，控制元素多大比例可见时触发，0-1之间 */
  threshold?: number
  /** 位置信息，默认"bottom-4 right-4" */
  position?: string
}

/**
 * 可复用的位置定位按钮组件
 * 当指定的元素不在视图中时，悬浮显示一个按钮，点击后滚动到该元素
 */
export const PositionButton = React.memo(function PositionButton({
  className,
  scrollBehavior = 'instant',
  iconClassName = 'icon-[mdi--crosshairs-gps] w-5 h-5',
  targetSelector,
  threshold = 0.5,
  position = 'bottom-4 right-4'
}: PositionButtonProps): JSX.Element | null {
  // 获取路由信息
  const { pathname } = useLocation()
  const [isTargetVisible, setIsTargetVisible] = useState(true)
  const visibilityTimeout = useRef<NodeJS.Timeout>()

  // 确定是否在游戏详情页面
  const isGameDetailPage = pathname.includes('/library/games/')

  // 获取目标元素的选择器
  const getTargetSelector = (): string => {
    if (targetSelector) return targetSelector

    // 默认根据当前路径构建游戏元素选择器
    const currentGameId = pathname.split('/games/')[1]?.split('/')[0]
    const currentGroupId = pathname.split('/games/')[1]?.split('/')[1]

    if (!currentGameId || !currentGroupId) return ''
    return `[data-game-id="${currentGameId}"][data-group-id="${currentGroupId}"]`
  }

  // 滚动到目标元素
  const scrollToTarget = (): void => {
    const selector = getTargetSelector()
    if (!selector) return

    const element = document.querySelector(selector)
    if (element) {
      element.scrollIntoView({
        behavior: scrollBehavior,
        block: 'center'
      })
    }
  }

  // 设置元素可见性监听 - 始终放在组件顶层
  useEffect(() => {
    // 如果不在游戏详情页面，不执行监听逻辑
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

        // 使用setTimeout和requestAnimationFrame减少状态更新频率
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
  }, [pathname, threshold, isGameDetailPage]) // 添加isGameDetailPage作为依赖

  // 使用条件渲染而不是早期返回
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

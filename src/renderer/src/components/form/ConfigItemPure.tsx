import React from 'react'
import { Card, CardContent } from '@ui/card'
import { cn } from '~/utils'

export interface ConfigItemPureProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
  controlClassName?: string
  disabled?: boolean
}

/**
 * 纯样式的ConfigItem组件，不涉及任何状态管理
 * 右侧控件完全由children参数传入
 */
export function ConfigItemPure({
  title,
  description,
  children,
  className = '',
  controlClassName = '',
  disabled = false
}: ConfigItemPureProps): React.ReactElement {
  return (
    <Card className={cn('w-full pb-5 bg-card/20 shadow-sm', { 'opacity-50': disabled }, className)}>
      <CardContent className="flex items-center justify-between">
        <div className="flex-col flex items-start justify-center">
          <div className="text-sm font-medium leading-none">{title}</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        <div className={cn('flex-shrink-0 ml-6', controlClassName)}>{children}</div>
      </CardContent>
    </Card>
  )
}

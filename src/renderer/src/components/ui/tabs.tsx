import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '~/utils'

// 定义变体类型
type TabsVariant = 'default' | 'underline'

// 扩展接口以支持变体
interface TabsProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root> {
  variant?: TabsVariant
}

interface TabsListProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> {
  variant?: TabsVariant
}

interface TabsTriggerProps extends React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> {
  variant?: TabsVariant
}

function Tabs({ className, variant = 'default', ...props }: TabsProps): React.JSX.Element {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-variant={variant}
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function TabsList({ className, variant = 'default', ...props }: TabsListProps): React.JSX.Element {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(
        'flex flex-wrap', // Add flex-wrap to allow wrapping
        variant === 'default'
          ? 'bg-muted/[calc(var(--glass-opacity)/2)] text-foreground inline-flex h-auto w-fit items-center justify-center rounded-lg p-[3px]'
          : variant === 'underline'
            ? 'w-fit justify-start rounded-none bg-transparent p-0 inline-flex items-center'
            : '',
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  variant = 'default',
  ...props
}: TabsTriggerProps): React.JSX.Element {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      data-variant={variant}
      className={cn(
        variant === 'default'
          ? "cursor-pointer data-[state=active]:bg-background dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:bg-input/30 text-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-7 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
          : variant === 'underline'
            ? 'relative rounded-none border-b-2 cursor-pointer border-b-transparent bg-transparent px-7 pb-1 pt-2 text-sm font-medium text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none inline-flex items-center justify-center whitespace-nowrap disabled:pointer-events-none disabled:opacity-50'
            : '',
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>): React.JSX.Element {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn('flex-1 outline-none', className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { cn } from '~/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  description?: string
  className?: string
}

export function StatCard({
  title,
  value,
  icon,
  description,
  className
}: StatCardProps): JSX.Element {
  return (
    <Card className={cn(className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="w-4 h-4 text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-row items-end gap-2 text-2xl font-bold">
          {value}
          {description && (
            <span className="text-xs font-normal text-muted-foreground">{description}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { cn } from '~/utils'

export function RecordCard({
  title,
  content,
  icon,
  className = ''
}: {
  title: string
  content: string
  icon?: string
  className?: string
}): JSX.Element {
  return (
    <Card className={cn(className, 'h-[96px]')}>
      <CardHeader className={cn('-mt-1')}>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('font-normal text-sm')}>{title}</div>
            <span className={cn('w-3 h-3', icon)}></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('-mt-4')}>
        <div className={cn('text-xl font-bold')}>{content}</div>
      </CardContent>
    </Card>
  )
}

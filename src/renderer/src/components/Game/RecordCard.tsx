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
  icon: string
  className?: string
}): JSX.Element {
  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('pb-1')}>{title}</div>
            <span className={cn('w-6 h-6', icon)}></span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('-mt-4')}>
        <div className={cn('text-3xl font-bold')}>{content}</div>
      </CardContent>
    </Card>
  )
}

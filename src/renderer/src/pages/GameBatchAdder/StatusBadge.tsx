import { Badge } from '@ui/badge'
import { GameStatus } from './store'

export function StatusBadge({ status }: { status: GameStatus }): JSX.Element {
  switch (status) {
    case 'loading':
      return <Badge variant="secondary">正在添加</Badge>
    case 'success':
      return <Badge variant="default">添加成功</Badge>
    case 'error':
      return <Badge variant="destructive">添加失败</Badge>
    default:
      return <Badge variant="outline">等待添加</Badge>
  }
}

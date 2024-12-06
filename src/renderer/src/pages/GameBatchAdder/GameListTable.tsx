import { useGameBatchAdderStore } from './store'
import { GameListItem } from './GameListItem'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@ui/table'
import { cn } from '~/utils'

export const TABLE_COLUMN_WIDTHS = {
  dataSource: 'w-[150px] 3xl:w-[350px]',
  name: 'w-[300px] 3xl:w-[350px]',
  id: 'w-[150px] 3xl:w-[200px]',
  status: 'w-[120px] 3xl:w-[200px]',
  actions: 'w-[150px] 3xl:w-[200px]'
} as const

export function GameListTable(): JSX.Element {
  const { games } = useGameBatchAdderStore()

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cn(TABLE_COLUMN_WIDTHS.dataSource)}>数据源</TableHead>
            <TableHead className={cn(TABLE_COLUMN_WIDTHS.name)}>游戏名称</TableHead>
            <TableHead className={cn(TABLE_COLUMN_WIDTHS.id)}>游戏ID</TableHead>
            <TableHead className={cn(TABLE_COLUMN_WIDTHS.status)}>状态</TableHead>
            <TableHead className={cn(TABLE_COLUMN_WIDTHS.actions)}>操作</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <Table>
        <TableBody>
          <div className={cn('overflow-auto scrollbar-base w-full', 'h-[570px] 3xl:h-[712px]')}>
            {games.map((game) => (
              <GameListItem key={game.dataId} game={game} />
            ))}
          </div>
        </TableBody>
      </Table>
    </>
  )
}

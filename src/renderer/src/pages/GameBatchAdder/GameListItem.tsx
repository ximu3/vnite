import { useGameAdder } from './hooks/useGameAdder'
import { useGameBatchAdderStore, DataSource, Game } from './store'
import { StatusBadge } from './StatusBadge'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { TableRow, TableCell } from '@ui/table'
import { toast } from 'sonner'
import { TABLE_COLUMN_WIDTHS } from './GameListTable'
import { cn } from '~/utils'

export function GameListItem({ game }: { game: Game }): JSX.Element {
  const { actions } = useGameBatchAdderStore()
  const { addGame } = useGameAdder()

  const handleAddGame = (): void => {
    toast.promise(() => addGame(game.dataId), {
      loading: `正在添加游戏 ${game.name}...`,
      success: `游戏 ${game.name} 添加成功`,
      error: (error) => error.message
    })
  }
  return (
    <TableRow className={cn('w-full')}>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.dataSource)}>
        <Select
          value={game.dataSource}
          onValueChange={(value) =>
            actions.updateGame(game.dataId, {
              dataSource: value as DataSource
            })
          }
        >
          <SelectTrigger className={cn('w-full')}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>数据来源</SelectLabel>
              <SelectItem value="steam">Steam</SelectItem>
              <SelectItem value="vndb">VNDB</SelectItem>
              <SelectItem value="bangumi">Bangumi</SelectItem>
              <SelectItem value="igdb">IGDB</SelectItem>
              <SelectItem value="ymgal">YMgal</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.name)}>
        <Input
          value={game.name}
          onChange={(e) =>
            actions.updateGame(game.dataId, {
              name: e.target.value
            })
          }
          placeholder="请输入游戏名称"
        />
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.id)}>
        <Input
          value={game.id}
          onChange={(e) =>
            actions.updateGame(game.dataId, {
              id: e.target.value
            })
          }
          placeholder="游戏ID(可选)"
        />
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.status)}>
        <StatusBadge status={game.status} />
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.actions)}>
        <div className="flex gap-2">
          <Button
            disabled={game.status === 'loading' || game.status === 'success'}
            onClick={handleAddGame}
          >
            {game.status === 'error' ? '重试' : '添加'}
          </Button>
          <Button variant="outline" onClick={() => actions.removeGame(game.dataId)}>
            删除
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

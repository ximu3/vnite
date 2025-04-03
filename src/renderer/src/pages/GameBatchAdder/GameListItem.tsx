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
import { useTranslation } from 'react-i18next'

export function GameListItem({ game }: { game: Game }): JSX.Element {
  const { t } = useTranslation('adder')
  const { actions } = useGameBatchAdderStore()
  const { addGame } = useGameAdder()

  const handleAddGame = (): void => {
    toast.promise(() => addGame(game.dataId), {
      loading: t('gameBatchAdder.notifications.addingGame', { name: game.name }),
      success: t('gameBatchAdder.notifications.gameAdded', { name: game.name }),
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
              <SelectLabel>{t('gameBatchAdder.form.dataSource')}</SelectLabel>
              <SelectItem value="steam">{t('gameAdder.search.dataSources.steam')}</SelectItem>
              <SelectItem value="vndb">{t('gameAdder.search.dataSources.vndb')}</SelectItem>
              <SelectItem value="bangumi">{t('gameAdder.search.dataSources.bangumi')}</SelectItem>
              <SelectItem value="igdb">{t('gameAdder.search.dataSources.igdb')}</SelectItem>
              <SelectItem value="ymgal">{t('gameAdder.search.dataSources.ymgal')}</SelectItem>
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
          placeholder={t('gameBatchAdder.form.namePlaceholder')}
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
          placeholder={t('gameBatchAdder.form.idPlaceholder')}
        />
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.status)}>
        <StatusBadge status={game.status} />
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.actions)}>
        <div className="flex gap-2">
          <Button
            disabled={
              game.status === 'loading' || game.status === 'success' || game.status === 'existed'
            }
            onClick={handleAddGame}
          >
            {game.status === 'error'
              ? t('gameBatchAdder.actions.retry')
              : t('gameBatchAdder.actions.add')}
          </Button>
          <Button variant="outline" onClick={() => actions.removeGame(game.dataId)}>
            {t('gameBatchAdder.actions.delete')}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

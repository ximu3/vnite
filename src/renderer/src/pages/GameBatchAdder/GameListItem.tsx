import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { BatchGameInfo } from '@appTypes/models'
import { ScraperCapabilities } from '@appTypes/utils'
import { Button } from '@ui/button'
import { Dialog, DialogContent } from '@ui/dialog'
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
import { TableCell, TableRow } from '@ui/table'
import { ipcManager } from '~/app/ipc'
import { DuplicateReview } from '~/components/Game/DuplicateReview'
import { cn } from '~/utils'
import { TABLE_COLUMN_WIDTHS } from './GameListTable'
import { useGameAdder } from './hooks/useGameAdder'
import { StatusBadge } from './StatusBadge'
import { DataSource, useGameBatchAdderStore } from './store'

export function GameListItem({ game }: { game: BatchGameInfo }): React.JSX.Element {
  const { t } = useTranslation('adder')
  const { actions } = useGameBatchAdderStore()
  const { addGame } = useGameAdder()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [availableDataSources, setAvailableDataSources] = useState<
    { id: string; name: string; capabilities: ScraperCapabilities[] }[]
  >([])

  const handleAddGame = (skipDuplicateCheck = false): void => {
    if (game.duplicateIds && !skipDuplicateCheck) {
      setReviewOpen(true)
      return
    }
    setReviewOpen(false)
    toast.promise(() => addGame(game.dataId, skipDuplicateCheck), {
      loading: t('gameBatchAdder.notifications.addingGame', { name: game.name }),
      success: (status) => {
        return {
          type: status === 'review' ? 'info' : 'success',
          message:
            status === 'review'
              ? t('gameBatchAdder.status.review')
              : t('gameBatchAdder.notifications.gameAdded', { name: game.name })
        }
      },
      error: (error) => error.message
    })
  }

  useEffect(() => {
    const fetchAvailableDataSources = async (): Promise<void> => {
      const sources = await ipcManager.invoke('scraper:get-provider-infos-with-capabilities', [
        'searchGames',
        'checkGameExists',
        'getGameMetadata',
        'getGameBackgrounds',
        'getGameCovers'
      ])
      setAvailableDataSources(sources)
      if (sources.length > 0) {
        if (!sources.some((ds) => ds.id === game.dataSource)) {
          actions.updateGame(game.dataId, { dataSource: sources[0].id })
        }
      } else {
        toast.error(t('gameBatchAdder.notifications.noDataSources'))
      }
    }
    fetchAvailableDataSources()
  }, [actions, game.dataId, game.dataSource, t])

  return (
    <TableRow className={cn('w-full relative')}>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.dataSource)}>
        <Select
          disabled={game.status === 'loading'}
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
              {availableDataSources.map((source) => (
                <SelectItem key={source.id} value={source.id}>
                  {source.name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className={cn(TABLE_COLUMN_WIDTHS.name)}>
        <Input
          disabled={game.status === 'loading'}
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
          disabled={game.status === 'loading'}
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
            onClick={() => handleAddGame()}
          >
            {game.duplicateIds
              ? t('gameBatchAdder.actions.review')
              : game.status === 'error'
                ? t('gameBatchAdder.actions.retry')
                : t('gameBatchAdder.actions.add')}
          </Button>
          <Button variant="outline" onClick={() => actions.removeGame(game.dataId)}>
            {t('gameBatchAdder.actions.delete')}
          </Button>
        </div>
        {game.duplicateIds && (
          <Dialog open={reviewOpen} onOpenChange={setReviewOpen}>
            <DialogContent>
              <DuplicateReview gameIds={game.duplicateIds} onConfirm={() => handleAddGame(true)} />
            </DialogContent>
          </Dialog>
        )}
      </TableCell>
    </TableRow>
  )
}

import { isEqual } from 'lodash'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '~/components/ui/table'
import { useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'

export function Save({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [saveList, setSaveList, saveSaveList, setSaveListAndSave] = useGameState(
    gameId,
    'save.saveList',
    true
  )

  const [savePaths] = useGameLocalState(gameId, 'path.savePaths')

  async function restoreGameSave(saveId: string): Promise<void> {
    if (isEqual(savePaths, [''])) {
      toast.error(t('detail.save.notifications.noSavePath'))
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        await ipcManager.invoke('game:restore-save', gameId, saveId)
      })(),
      {
        loading: t('detail.save.notifications.switchLoading'),
        success: t('detail.save.notifications.switchSuccess'),
        error: (err) => t('detail.save.notifications.switchError', { message: err.message })
      }
    )
  }

  async function deleteGameSave(saveId: string): Promise<void> {
    if (saveList[saveId]?.locked) {
      toast(t('detail.save.notifications.locked'), { duration: 1000 })
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        await ipcManager.invoke('game:delete-save', gameId, saveId)
        const newSaveList = { ...saveList }
        delete newSaveList[saveId]
        setSaveList(newSaveList)
      })(),
      {
        loading: t('detail.save.notifications.deleteLoading'),
        success: t('detail.save.notifications.deleteSuccess'),
        error: (err) => t('detail.save.notifications.deleteError', { message: err.message })
      }
    )
  }

  const toggleLock = (saveId: string): void => {
    const newSaveList = {
      ...saveList,
      [saveId]: {
        ...saveList[saveId],
        locked: !saveList[saveId]?.locked
      }
    }
    setSaveListAndSave(newSaveList)
  }

  return (
    <div className="pt-2 bg-transparent w-full min-h-[22vh]">
      <div className="w-full h-full">
        <div className={cn('h-full')}>
          <Table className="h-full">
            <TableHeader>
              <TableRow className={cn('')}>
                <TableHead className={cn('w-1/5')}>{t('detail.save.table.date')}</TableHead>
                <TableHead className={cn('w-2/3', 'sm:w-1/3')}>
                  {t('detail.save.table.note')}
                </TableHead>
                <TableHead className={cn('w-1/6')}>{t('detail.save.table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn('h-full')}>
              {isEqual(saveList, {}) ? (
                <div className={cn('mt-1')}>{t('detail.save.empty')}</div>
              ) : (
                Object.entries(saveList)
                  .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(([saveId, save]) => (
                    <TableRow key={saveId}>
                      <TableCell className={cn('w-1/5')}>
                        <div>{t('{{date, niceDateSeconds}}', { date: save.date })}</div>
                      </TableCell>
                      <TableCell className={cn('pr-10', '3xl:pr-24')}>
                        <Input
                          value={save.note}
                          onChange={(e) =>
                            setSaveList({
                              ...saveList,
                              [saveId]: { ...save, note: e.target.value }
                            })
                          }
                          onBlur={saveSaveList}
                          className={cn('h-8')}
                        />
                      </TableCell>
                      <TableCell className={cn('w-1/6')}>
                        <div className="flex flex-row gap-2">
                          <Button
                            variant={'outline'}
                            size={'icon'}
                            className={cn('h-8 w-8', saveList[saveId]?.locked ? 'border-ring' : '')}
                            onClick={() => toggleLock(saveId)}
                          >
                            <span
                              className={cn(
                                'w-5 h-5',
                                saveList[saveId]?.locked
                                  ? 'icon-[mdi--lock-outline]'
                                  : 'icon-[mdi--lock-open-variant-outline]'
                              )}
                            />
                          </Button>
                          <Button
                            variant={'outline'}
                            className={cn('min-h-0 h-8')}
                            onClick={() => restoreGameSave(saveId)}
                          >
                            {t('detail.save.actions.switch')}
                          </Button>
                          <Button
                            variant="delete"
                            className={cn('min-h-0 h-8 ')}
                            onClick={() => deleteGameSave(saveId)}
                          >
                            {t('detail.save.actions.delete')}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}

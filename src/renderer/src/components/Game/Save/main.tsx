import { isEqual } from 'lodash'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { ipcManager } from '~/app/ipc'
import { useGameLocalState, useGameState } from '~/hooks'
import { cn } from '~/utils'
import { useGameDetailStore } from '../store'

export function Save({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [saveList, setSaveList, saveSaveList, setSaveListAndSave] = useGameState(
    gameId,
    'save.saveList',
    true
  )

  const openPropertiesDialog = useGameDetailStore((state) => state.openPropertiesDialog)

  const [savePaths] = useGameLocalState(gameId, 'path.savePaths')
  const [isBackingUp, setIsBackingUp] = useState(false)
  const hasSavePath = savePaths.some(Boolean)

  function backupGameSave(): void {
    if (isBackingUp) {
      return
    }

    if (!hasSavePath) {
      toast.error(t('detail.save.notifications.noSavePath'))
      return
    }

    setIsBackingUp(true)

    const backupPromise = ipcManager
      .invoke('game:backup-save', gameId)
      .finally(() => setIsBackingUp(false))

    toast.promise(backupPromise, {
      loading: t('detail.save.notifications.backupLoading'),
      success: t('detail.save.notifications.backupSuccess'),
      error: (err) => t('detail.save.notifications.backupError', { message: err.message })
    })
  }

  function restoreGameSave(saveId: string): void {
    if (!hasSavePath) {
      toast.error(t('detail.save.notifications.noSavePath'))
      return
    }
    toast.promise(ipcManager.invoke('game:restore-save', gameId, saveId), {
      loading: t('detail.save.notifications.switchLoading'),
      success: t('detail.save.notifications.switchSuccess'),
      error: (err) => t('detail.save.notifications.switchError', { message: err.message })
    })
  }

  function deleteGameSave(saveId: string): void {
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
      <div className="mb-4">
        <div className="flex flex-wrap gap-3">
          <Button size="icon" onClick={backupGameSave} disabled={isBackingUp}>
            <span className={cn('icon-[mdi--backup-restore] w-4 h-4')}></span>
          </Button>
          <Button
            variant="secondary"
            onClick={() => openPropertiesDialog('path')}
            disabled={isBackingUp}
          >
            {t('detail.save.openPropertiesDialog')}
          </Button>
        </div>
      </div>
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
                          disabled={isBackingUp}
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
                            disabled={isBackingUp}
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
                            disabled={isBackingUp}
                            onClick={() => restoreGameSave(saveId)}
                          >
                            {t('detail.save.actions.switch')}
                          </Button>
                          <Button
                            variant="delete"
                            className={cn('min-h-0 h-8 ')}
                            disabled={isBackingUp}
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

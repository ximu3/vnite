import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { isEqual } from 'lodash'
import { toast } from 'sonner'
import { useGameLocalState, useGameState } from '~/hooks'
import { cn, formatDateToChineseWithSeconds, ipcInvoke } from '~/utils'

export function Save({ gameId }: { gameId: string }): JSX.Element {
  const [saveList, setSaveList] = useGameState(gameId, 'save.saveList')

  const [savePaths] = useGameLocalState(gameId, 'path.savePaths')

  async function restoreGameSave(saveId: string): Promise<void> {
    if (isEqual(savePaths, [''])) {
      toast.error('未找到存档路径')
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        await ipcInvoke('restore-game-save', gameId, saveId)
      })(),
      {
        loading: '切换存档中...',
        success: '切换存档成功',
        error: (err) => `切换存档失败: ${err.message}`
      }
    )
  }
  async function deleteGameSave(saveId: string): Promise<void> {
    if (saveList[saveId]?.locked) {
      toast('该存档已锁定', { duration: 1000 })
      return
    }
    toast.promise(
      (async (): Promise<void> => {
        await ipcInvoke('delete-game-save', gameId, saveId)
        const newSaveList = { ...saveList }
        delete newSaveList[saveId]
        setSaveList(newSaveList)
      })(),
      {
        loading: '删除存档中...',
        success: '删除存档成功',
        error: (err) => `删除存档失败: ${err.message}`
      }
    )
  }

  const toggleLock = (saveId: string): void => {
    const newSaveList = { ...saveList }
    saveList[saveId].locked = !saveList[saveId]?.locked
    setSaveList(newSaveList)
  }

  return (
    <div className="pt-2 bg-background w-full min-h-[22vh]">
      <div className="w-full h-full">
        <div className={cn('h-full')}>
          <Table className="h-full">
            <TableHeader>
              <TableRow className={cn('')}>
                <TableHead className={cn('w-1/5')}>日期</TableHead>
                <TableHead className={cn('w-2/3', 'sm:w-1/3')}>备注</TableHead>
                <TableHead className={cn('w-1/6')}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className={cn('h-full')}>
              {isEqual(saveList, {}) ? (
                <div className={cn('mt-1')}>暂无存档</div>
              ) : (
                Object.entries(saveList)
                  .sort(([, a], [, b]) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map(([saveId, save]) => (
                    <TableRow key={saveId}>
                      <TableCell className={cn('w-1/5')}>
                        <div>{formatDateToChineseWithSeconds(save.date)}</div>
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
                          className={cn('h-8')}
                        />
                      </TableCell>
                      <TableCell className={cn('w-1/6')}>
                        <div className="flex flex-row gap-2">
                          <Button
                            variant={'outline'}
                            size={'icon'}
                            className={cn(saveList[saveId]?.locked ? 'border-ring' : '')}
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
                            切换
                          </Button>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'min-h-0 h-8 hover:bg-destructive hover:text-destructive-foreground'
                            )}
                            onClick={() => deleteGameSave(saveId)}
                          >
                            删除
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

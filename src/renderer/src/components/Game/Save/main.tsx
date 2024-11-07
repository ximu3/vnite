import { Card } from '@ui/card'
import { cn } from '~/utils'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@ui/table'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { toast } from 'sonner'
import { ipcInvoke } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { formatDateToChineseWithSeconds } from '~/utils'
import { isEqual } from 'lodash'

export function Save({ gameId }: { gameId: string }): JSX.Element {
  const [saveList, setSaveList] = useDBSyncedState(
    { ['']: { id: '', date: '', note: '' } },
    `games/${gameId}/save.json`,
    ['#all']
  )
  const [savePathMode] = useDBSyncedState('', `games/${gameId}/path.json`, ['savePath', 'mode'])
  const [savePath] = useDBSyncedState([''], `games/${gameId}/path.json`, ['savePath', savePathMode])
  async function restoreGameSave(saveId: string): Promise<void> {
    if (savePath.length === 0 && savePath[0] !== '') {
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
  return (
    <div className="pt-2">
      <Card className="group w-full p-3">
        <div className={cn('overflow-auto h-[684px] scrollbar-base', '3xl:h-[870px]')}>
          <Table className="table-fixed">
            <TableHeader>
              <TableRow className={cn('hover:bg-transparent')}>
                <TableHead className={cn('w-1/5')}>日期</TableHead>
                <TableHead className={cn('w-2/3')}>备注</TableHead>
                <TableHead className={cn('w-1/6')}>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isEqual(saveList, {}) ? (
                <div className={cn('mt-1')}>暂无存档</div>
              ) : (
                Object.entries(saveList).map(([saveId, save]) => (
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
                          className={cn('min-h-0 h-8')}
                          onClick={() => restoreGameSave(saveId)}
                        >
                          切换
                        </Button>
                        <Button
                          variant={'outline'}
                          className={cn('min-h-0 h-8')}
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
      </Card>
    </div>
  )
}

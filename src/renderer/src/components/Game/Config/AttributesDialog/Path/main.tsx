import { cn } from '~/utils'
import { useDBSyncedState } from '~/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { ipcInvoke, canAccessImageFile } from '~/utils'
import { ArrayTextarea } from '@ui/array-textarea'
import { toast } from 'sonner'

export function Path({ gameId }: { gameId: string }): JSX.Element {
  const [_path] = useDBSyncedState('', `games/${gameId}/launcher.json`, ['fileConfig', 'path'])
  const [_workingDirectory] = useDBSyncedState('', `games/${gameId}/launcher.json`, [
    'fileConfig',
    'workingDirectory'
  ])
  const [_timerMode] = useDBSyncedState('folder', `games/${gameId}/launcher.json`, [
    'fileConfig',
    'timerMode'
  ])
  const [_timerPath] = useDBSyncedState('', `games/${gameId}/launcher.json`, [
    'fileConfig',
    'timerPath'
  ])

  const [launcherMode] = useDBSyncedState('file', `games/${gameId}/launcher.json`, ['mode'])
  const [timerPath] = useDBSyncedState('', `games/${gameId}/launcher.json`, [
    `${launcherMode}Config`,
    'timerPath'
  ])
  const [gamePath, setGamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])

  const [_savePathInDB, setSavePathInDB] = useDBSyncedState<string[]>(
    [],
    `games/${gameId}/path.json`,
    ['savePathInDB']
  )

  const [savePathInGame, setSavePathInGame] = useDBSyncedState<string[]>(
    [],
    `games/${gameId}/path.json`,
    ['savePathInGame']
  )

  async function selectGamePath(): Promise<void> {
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    if (!filePath) {
      return
    }
    await setGamePath(filePath)
    const icon = await canAccessImageFile(gameId, 'icon')
    if (!icon) {
      await ipcInvoke('save-game-icon', gameId, filePath)
    }
    if (!timerPath) {
      toast.promise(
        async () => {
          await ipcInvoke('launcher-preset', 'default', gameId)
        },
        {
          loading: '正在配置预设...',
          success: '预设配置成功',
          error: (error) => `${error}`
        }
      )
    }
  }
  async function selectSaveFolderPath(): Promise<void> {
    const folderPath: string[] = await ipcInvoke(
      'select-multiple-path-dialog',
      ['openDirectory'],
      undefined,
      gamePath
    )
    if (!folderPath) {
      return
    }
    const newSavePathInGame = savePathInGame.concat(folderPath)
    handlleSavePathInGameChange(newSavePathInGame)
  }
  async function selectSaveFilePath(): Promise<void> {
    const filePath: string[] = await ipcInvoke(
      'select-multiple-path-dialog',
      ['openFile'],
      undefined,
      gamePath
    )
    if (!filePath) {
      return
    }
    const newSavePathInGame = savePathInGame.concat(filePath)
    handlleSavePathInGameChange(newSavePathInGame)
  }

  async function handlleSavePathInGameChange(value: string[]): Promise<void> {
    await setSavePathInGame(value)
    const newSavePathInDB = Array.from({ length: value.length }, () => '')
    await setSavePathInDB(newSavePathInDB)
  }

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle>游戏与存档</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('flex flex-col gap-5')}>
          <div className={cn('flex flex-row gap-5 items-center justify-start')}>
            <div>游戏路径</div>
            <div className={cn('w-3/4')}>
              <Input value={gamePath} onChange={(e) => setGamePath(e.target.value)} />
            </div>
            <Button
              variant={'outline'}
              size={'icon'}
              className={cn('-ml-3')}
              onClick={selectGamePath}
            >
              <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
            </Button>
          </div>
          <div className={cn('flex flex-row gap-5 items-start')}>
            <div>存档路径</div>
            <div className={cn('w-3/4')}>
              <ArrayTextarea
                value={savePathInGame}
                onChange={handlleSavePathInGameChange}
                className={cn('max-h-[400px] min-h-[100px]')}
              />
            </div>
            <Button
              variant={'outline'}
              size={'icon'}
              className={cn('-ml-3')}
              onClick={selectSaveFolderPath}
            >
              <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
            </Button>
            <Button
              variant={'outline'}
              size={'icon'}
              className={cn('-ml-3')}
              onClick={selectSaveFilePath}
            >
              <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

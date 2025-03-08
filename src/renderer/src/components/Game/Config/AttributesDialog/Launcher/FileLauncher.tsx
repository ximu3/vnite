import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '@ui/input'
import { Button } from '@ui/button'
import { Separator } from '@ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { ipcInvoke } from '~/utils'
import { useTranslation } from 'react-i18next'

export function FileLauncher({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [path, setPath] = useGameLocalState(gameId, 'launcher.fileConfig.path')
  const [workingDirectory, setWorkingDirectory] = useGameLocalState(
    gameId,
    'launcher.fileConfig.workingDirectory'
  )
  const [monitorMode, setMonitorMode] = useGameLocalState(gameId, 'launcher.fileConfig.monitorMode')
  const [monitorPath, setMonitorPath] = useGameLocalState(gameId, 'launcher.fileConfig.monitorPath')

  async function selectFilePath(): Promise<void> {
    const filePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setPath(filePath)
  }

  async function selectWorkingDirectory(): Promise<void> {
    const workingDirectoryPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
    setWorkingDirectory(workingDirectoryPath)
  }

  async function selectMonitorPath(): Promise<void> {
    if (monitorMode === 'file') {
      const monitorPath: string = await ipcInvoke('select-path-dialog', ['openFile'])
      setMonitorPath(monitorPath)
    }
    if (monitorMode === 'folder') {
      const monitorPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
      setMonitorPath(monitorPath)
    }
  }

  return (
    <div className={cn('flex flex-col gap-5 w-full')}>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>{t('detail.properties.launcher.file.path')}</div>
        <div className={cn('w-3/4')}>
          <Input value={path} onChange={(e) => setPath(e.target.value)} />
        </div>
        <Button variant={'outline'} size={'icon'} className={cn('-ml-3')} onClick={selectFilePath}>
          <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
        </Button>
      </div>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>{t('detail.properties.launcher.file.workingDirectory')}</div>
        <div className={cn('w-3/4')}>
          <Input value={workingDirectory} onChange={(e) => setWorkingDirectory(e.target.value)} />
        </div>
        <Button
          variant={'outline'}
          size={'icon'}
          className={cn('-ml-3')}
          onClick={selectWorkingDirectory}
        >
          <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
        </Button>
      </div>
      <Separator />
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        <div>{t('detail.properties.launcher.monitor.title')}</div>
        <div className={cn('w-[120px]')}>
          <Select value={monitorMode} onValueChange={setMonitorMode}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('detail.properties.launcher.monitor.title')}</SelectLabel>
                <SelectItem value="folder">
                  {t('detail.properties.launcher.monitor.mode.folder')}
                </SelectItem>
                <SelectItem value="file">
                  {t('detail.properties.launcher.monitor.mode.file')}
                </SelectItem>
                <SelectItem value="process">
                  {t('detail.properties.launcher.monitor.mode.process')}
                </SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className={cn('flex flex-row gap-5 items-center justify-start')}>
        {['folder', 'file'].includes(monitorMode) ? (
          <div>{t('detail.properties.launcher.monitor.path')}</div>
        ) : (
          <div>{t('detail.properties.launcher.monitor.processName')}</div>
        )}
        <div className={cn('w-3/4')}>
          <Input value={monitorPath} onChange={(e) => setMonitorPath(e.target.value)} />
        </div>
        {['folder', 'file'].includes(monitorMode) && (
          <Button
            variant={'outline'}
            size={'icon'}
            className={cn('-ml-3')}
            onClick={selectMonitorPath}
          >
            <span
              className={cn(
                monitorMode === 'folder'
                  ? 'icon-[mdi--folder-open-outline] w-5 h-5'
                  : 'icon-[mdi--file-outline] w-5 h-5'
              )}
            ></span>
          </Button>
        )}
      </div>
    </div>
  )
}

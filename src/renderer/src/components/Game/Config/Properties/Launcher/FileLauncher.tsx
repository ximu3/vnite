import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Separator } from '~/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function FileLauncher({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [workingDirectory, setWorkingDirectory, saveWorkingDirectory] = useGameLocalState(
    gameId,
    'launcher.fileConfig.workingDirectory',
    'launcher.fileConfig.path',
    true
  )
  const [monitorMode, setMonitorMode] = useGameLocalState(gameId, 'launcher.fileConfig.monitorMode')
  const [monitorPath, setMonitorPath, saveMonitorPath, setMonitorPathAndSave] = useGameLocalState(
    gameId,
    'launcher.fileConfig.monitorPath',
    true
  )

  async function selectFilePath(): Promise<void> {
    const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
    if (!filePath) {
      return
    }
  async function selectWorkingDirectory(): Promise<void> {
    const workingDirectoryPath = await ipcManager.invoke('system:select-path-dialog', [
      'openDirectory'
    ])
    if (!workingDirectoryPath) {
      return
    }
    setWorkingDirectory(workingDirectoryPath)
    saveWorkingDirectory()
    await setPathAndSave(filePath)
  }

  async function selectMonitorPath(): Promise<void> {
    if (monitorMode === 'file') {
      const monitorPath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!monitorPath) {
        return
      }
      await setMonitorPathAndSave(monitorPath)
    }
    if (monitorMode === 'folder') {
      const monitorPath = await ipcManager.invoke('system:select-path-dialog', ['openDirectory'])
      if (!monitorPath) {
        return
      }
      await setMonitorPathAndSave(monitorPath)
    }
  }

  return (
    <div className={cn('grid grid-cols-[120px_1fr] gap-x-5 gap-y-5 items-center')}>
      {/* file path */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.file.path')}
      </div>
      <div className={cn('flex flex-row gap-3 items-center')}>
        <Input
          className={cn('flex-1')}
          value={path}
          onChange={(e) => setPath(e.target.value)}
          onBlur={savePath}
        />
        <Button variant={'outline'} size={'icon'} onClick={selectFilePath}>
          <span className={cn('icon-[mdi--file-outline] w-5 h-5')}></span>
        </Button>
      </div>

      {/* Work Directory */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.file.workingDirectory')}
      </div>
      <div className={cn('flex flex-row gap-3 items-center')}>
        <Input
          className={cn('flex-1')}
          value={workingDirectory}
          onChange={(e) => setWorkingDirectory(e.target.value)}
          onBlur={saveWorkingDirectory}
        />
        <Button variant={'outline'} size={'icon'} onClick={selectWorkingDirectory}>
          <span className={cn('icon-[mdi--folder-open-outline] w-5 h-5')}></span>
        </Button>
      </div>

      {/* 分隔线 - 占满整行 */}
      <div className={cn('col-span-2')}>
        <Separator />
      </div>

      {/* 监视器模式 */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.monitor.title')}
      </div>
      <div>
        <Select value={monitorMode} onValueChange={setMonitorMode}>
          <SelectTrigger className={cn('w-[120px]')}>
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

      {/* 监视路径/进程名 */}
      <div className={cn('whitespace-nowrap select-none')}>
        {['folder', 'file'].includes(monitorMode)
          ? t('detail.properties.launcher.monitor.path')
          : t('detail.properties.launcher.monitor.processName')}
      </div>
      <div className={cn('flex flex-row gap-3 items-center')}>
        <Input
          className={cn('flex-1')}
          value={monitorPath}
          onChange={(e) => setMonitorPath(e.target.value)}
          onBlur={saveMonitorPath}
        />
        {['folder', 'file'].includes(monitorMode) && (
          <Button variant={'outline'} size={'icon'} onClick={selectMonitorPath}>
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

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
  const [path, setPath, savePath, setPathAndSave] = useGameLocalState(
    gameId,
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
    <>
      {/* File Path */}
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

      <div className={cn('col-span-2')}>
        <Separator />
      </div>

      {/* Monitor Mode */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.monitor.title')}
      </div>
      <div>
        <Select value={monitorMode} onValueChange={setMonitorMode}>
          <SelectTrigger className={cn('min-w-[120px]')}>
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

      {/* Monitor Path / Process Name */}
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
    </>
  )
}

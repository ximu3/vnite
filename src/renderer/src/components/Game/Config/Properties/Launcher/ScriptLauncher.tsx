import { cn } from '~/utils'
import { useGameLocalState } from '~/hooks'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { ArrayTextarea } from '~/components/ui/array-textarea'
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

export function ScriptLauncher({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [command, setCommand, saveCommand] = useGameLocalState(
    gameId,
    'launcher.scriptConfig.command',
    true
  )
  const [workingDirectory, setWorkingDirectory, saveWorkingDirectory, setWorkingDirectoryAndSave] =
    useGameLocalState(gameId, 'launcher.scriptConfig.workingDirectory', true)
  const [monitorMode, setMonitorMode] = useGameLocalState(
    gameId,
    'launcher.scriptConfig.monitorMode'
  )
  const [monitorPath, setMonitorPath, saveMonitorPath, setMonitorPathAndSave] = useGameLocalState(
    gameId,
    'launcher.scriptConfig.monitorPath',
    true
  )

  async function selectWorkingDirectory(): Promise<void> {
    const workingDirectoryPath = await ipcManager.invoke('system:select-path-dialog', [
      'openDirectory'
    ])
    if (!workingDirectoryPath) {
      return
    }
    await setWorkingDirectoryAndSave(workingDirectoryPath)
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
      {/* Script content */}
      <div className={cn('whitespace-nowrap select-none self-start pt-2')}>
        {t('detail.properties.launcher.script.content')}
      </div>
      <div>
        <ArrayTextarea
          value={command}
          onChange={setCommand}
          onBlur={saveCommand}
          className={cn('max-h-[250px] min-h-[100px] w-full')}
        />
      </div>

      {/* Work Directory */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.script.workingDirectory')}
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

      <div className={cn('col-span-2')}>
        <Separator />
      </div>

      {/* Monitor mode */}
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

      {/* Monitor path/process name */}
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

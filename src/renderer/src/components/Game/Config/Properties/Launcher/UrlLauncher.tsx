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

export function UrlLauncher({ gameId }: { gameId: string }): React.JSX.Element {
  const { t } = useTranslation('game')
  const [url, setUrl, saveUrl] = useGameLocalState(gameId, 'launcher.urlConfig.url', true)
  const [browserPath, setBrowserPath, saveBrowserPath, setBrowserPathAndSave] = useGameLocalState(
    gameId,
    'launcher.urlConfig.browserPath',
    true
  )
  const [monitorMode, setMonitorMode] = useGameLocalState(gameId, 'launcher.urlConfig.monitorMode')
  const [monitorPath, setMonitorPath, saveMonitorPath, setMonitorPathAndSave] = useGameLocalState(
    gameId,
    'launcher.urlConfig.monitorPath',
    true
  )

  async function selectBorwserPath(): Promise<void> {
    const workingDirectoryPath = await ipcManager.invoke(
      'system:select-path-dialog',
      ['openFile'],
      ['exe']
    )
    if (!workingDirectoryPath) {
      return
    }
    await setBrowserPathAndSave(workingDirectoryPath)
  }

  async function selectMonitorPath(): Promise<void> {
    if (monitorMode === 'file') {
      const monitorPath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!monitorPath) {
        return
      }
      await setMonitorPathAndSave(monitorPath)
      ipcManager.send('native-monitor:update-local-game')
    }
    if (monitorMode === 'folder') {
      const monitorPath = await ipcManager.invoke('system:select-path-dialog', ['openDirectory'])
      if (!monitorPath) {
        return
      }
      await setMonitorPathAndSave(monitorPath)
      ipcManager.send('native-monitor:update-local-game')
    }
  }

  return (
    <>
      {/* URL Address */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.url.address')}
      </div>
      <div>
        <Input
          className={cn('w-full')}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onBlur={saveUrl}
        />
      </div>

      {/* Browser Path */}
      <div className={cn('whitespace-nowrap select-none')}>
        {t('detail.properties.launcher.url.browser')}
      </div>
      <div className={cn('flex flex-row gap-3 items-center')}>
        <Input
          className={cn('flex-1')}
          value={browserPath}
          onChange={(e) => setBrowserPath(e.target.value)}
          placeholder={t('detail.properties.launcher.url.defaultBrowser')}
          onBlur={saveBrowserPath}
        />
        <Button variant={'outline'} size={'icon'} onClick={selectBorwserPath}>
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
          onBlur={() => {
            saveMonitorPath()
            ipcManager.send('native-monitor:update-local-game')
          }}
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

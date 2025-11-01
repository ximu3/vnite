import React, { useCallback, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '~/components/ui/select'
import { Separator } from '~/components/ui/separator'
import { Switch } from '~/components/ui/switch'
import { useConfigLocalState, useGameLocalState } from '~/hooks'
import { cn } from '~/utils'
import { FileLauncher, FileLauncherHandle } from './FileLauncher'
import { PresetSelecter } from './PresetSelecter'
import { ScriptLauncher, ScriptLauncherHandle } from './ScriptLauncher'
import { UrlLauncher, UrlLauncherHandle } from './UrlLauncher'

export interface LauncherHandle {
  save: () => Promise<void>
}

function LauncherComponent(
  { gameId }: { gameId: string },
  ref: React.Ref<LauncherHandle>
): React.JSX.Element {
  const { t } = useTranslation('game')
  const [mode, setMode] = useGameLocalState(gameId, 'launcher.mode')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [useMagpie, setUseMagpie] = useGameLocalState(gameId, 'launcher.useMagpie')
  const [magpiePath, setMagpiePath] = useConfigLocalState('game.linkage.magpie.path')

  async function selectMagpiePath(): Promise<void> {
    const magpiePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
    if (!magpiePath) {
      return
    }
    setMagpiePath(magpiePath)
  }

  async function switchUseMagpie(): Promise<void> {
    if (!useMagpie && !magpiePath) {
      toast.error(t('detail.properties.launcher.magpie.pathNotSet'))
      await selectMagpiePath()
      await new Promise((resolve) => setTimeout(resolve, 300))
    }
    setUseMagpie(!useMagpie)
  }

  const fileRef = useRef<FileLauncherHandle>(null)
  const urlRef = useRef<UrlLauncherHandle>(null)
  const scriptRef = useRef<ScriptLauncherHandle>(null)

  const saveAll = useCallback(async () => {
    if (fileRef.current) {
      await fileRef.current?.save()
    } else if (urlRef.current) {
      await urlRef.current?.save()
    } else if (scriptRef.current) {
      await scriptRef.current?.save()
    }
  }, [])
  useImperativeHandle(ref, () => ({ save: saveAll }), [saveAll])

  return (
    <Card className={cn('group')}>
      {gamePath ? (
        <>
          <CardHeader>
            <CardTitle className={cn('relative')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div className={cn('flex items-center')}>
                  {t('detail.properties.launcher.title')}
                </div>
              </div>
              <PresetSelecter gameId={gameId} className={cn('top-0 right-0 absolute -mt-2')} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={cn('grid grid-cols-[auto_1fr] gap-x-5 gap-y-5 items-center')}>
              {/* Launch Mode Selection */}
              <div className={cn('whitespace-nowrap select-none')}>
                {t('detail.properties.launcher.mode.title')}
              </div>
              <div>
                <Select value={mode} onValueChange={setMode}>
                  <SelectTrigger className={cn('w-[120px]')}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('detail.properties.launcher.mode.title')}</SelectLabel>
                      <SelectItem value="file">
                        {t('detail.properties.launcher.mode.file')}
                      </SelectItem>
                      <SelectItem value="url">
                        {t('detail.properties.launcher.mode.url')}
                      </SelectItem>
                      <SelectItem value="script">
                        {t('detail.properties.launcher.mode.script')}
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {mode === 'file' && <FileLauncher gameId={gameId} ref={fileRef} />}
              {mode === 'url' && <UrlLauncher gameId={gameId} ref={urlRef} />}
              {mode === 'script' && <ScriptLauncher gameId={gameId} ref={scriptRef} />}

              <div className={cn('col-span-2')}>
                <Separator />
              </div>

              {/* Magpie Scaling */}
              <div className={cn('whitespace-nowrap select-none')}>
                {t('detail.properties.launcher.magpie.scaling')}
              </div>
              <div>
                <Switch className={cn('-mb-[2px]')} checked={useMagpie} onClick={switchUseMagpie} />
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <CardHeader className={cn('-m-3')}>
          <div>{t('detail.properties.launcher.setGamePathFirst')}</div>
        </CardHeader>
      )}
    </Card>
  )
}

export const Launcher = React.forwardRef(LauncherComponent)

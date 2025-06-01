import { cn } from '~/utils'
import { useGameLocalState, useConfigLocalState } from '~/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { Switch } from '@ui/switch'
import { Separator } from '@ui/separator'
import { toast } from 'sonner'
import { FileLauncher } from './FileLauncher'
import { UrlLauncher } from './UrlLauncher'
import { ScriptLauncher } from './ScriptLauncher'
import { PresetSelecter } from './PresetSelecter'
import { useTranslation } from 'react-i18next'

export function Launcher({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [mode, setMode] = useGameLocalState(gameId, 'launcher.mode')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [useMagpie, setUseMagpie] = useGameLocalState(gameId, 'launcher.useMagpie')
  const [magpiePath, setMagpiePath] = useConfigLocalState('game.linkage.magpie.path')

  async function selectMagpiePath(): Promise<void> {
    const magpiePath: string = await window.api.utils.selectPathDialog(['openFile'])
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
            <div className={cn('grid grid-cols-[120px_1fr] gap-x-5 gap-y-5 items-center')}>
              {/* 启动模式选择 */}
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

              <div className={cn('col-span-2')}>
                <div className={cn('w-full')}>
                  <div className={cn(mode === 'file' ? 'block' : 'hidden')}>
                    <FileLauncher gameId={gameId} />
                  </div>
                  <div className={cn(mode === 'url' ? 'block' : 'hidden')}>
                    <UrlLauncher gameId={gameId} />
                  </div>
                  <div className={cn(mode === 'script' ? 'block' : 'hidden')}>
                    <ScriptLauncher gameId={gameId} />
                  </div>
                </div>
              </div>

              <div className={cn('col-span-2')}>
                <Separator />
              </div>

              {/* Magpie zoom options */}
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

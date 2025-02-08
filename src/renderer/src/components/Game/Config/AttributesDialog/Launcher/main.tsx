import { cn, ipcInvoke } from '~/utils'
import { useDBSyncedState } from '~/hooks'
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

export function Launcher({ gameId }: { gameId: string }): JSX.Element {
  const [mode, setMode] = useDBSyncedState('file', `games/${gameId}/launcher.json`, ['mode'])
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [useMagpie, setUseMagpie] = useDBSyncedState(false, `games/${gameId}/launcher.json`, [
    'useMagpie'
  ])
  const [magpiePath, setMagpiePath] = useDBSyncedState('', 'config.json', [
    'advanced',
    'linkage',
    'magpie',
    'path'
  ])
  async function selectMagpiePath(): Promise<void> {
    const magpiePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
    setMagpiePath(magpiePath)
  }
  async function switchUseMagpie(): Promise<void> {
    if (!useMagpie && !magpiePath) {
      toast.error('请先设置Magpie路径')
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
                <div className={cn('flex items-center')}>启动器与追踪器</div>
              </div>
              <PresetSelecter gameId={gameId} className={cn('top-0 right-0 absolute -mt-2')} />
            </CardTitle>
          </CardHeader>
          <CardContent className={cn('')}>
            <div className={cn('flex flex-col gap-5 w-full')}>
              <div className={cn('flex flex-row gap-5 items-center')}>
                <div>启动模式</div>
                <div className={cn('w-[120px]')}>
                  <Select value={mode} onValueChange={setMode}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>启动模式</SelectLabel>
                        <SelectItem value="file">文件</SelectItem>
                        <SelectItem value="url">链接</SelectItem>
                        <SelectItem value="script">脚本</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className={cn('w-5/6 flex flex-col gap-5')}>
                <div className={cn(mode === 'file' ? 'block' : 'hidden')}>
                  <FileLauncher gameId={gameId} />
                </div>
                <div className={cn(mode === 'url' ? 'block' : 'hidden')}>
                  <UrlLauncher gameId={gameId} />
                </div>
                <div className={cn(mode === 'script' ? 'block' : 'hidden')}>
                  <ScriptLauncher gameId={gameId} />
                </div>
                <Separator className={cn('')} />
                <div className={cn('flex flex-row gap-5 items-center')}>
                  <div className={cn('text-center')}>Magpie缩放</div>
                  <Switch
                    className={cn('-mb-[2px]')}
                    checked={useMagpie}
                    onClick={switchUseMagpie}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </>
      ) : (
        <CardHeader className={cn('-m-3')}>
          <div>请先设置游戏路径</div>
        </CardHeader>
      )}
    </Card>
  )
}

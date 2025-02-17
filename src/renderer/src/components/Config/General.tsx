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
import { toast } from 'sonner'
import { useDBSyncedState } from '~/hooks'
import { cn, ipcInvoke } from '~/utils'
import { useTheme } from '../ThemeProvider'

export function General(): JSX.Element {
  const [openAtLogin, setOpenAtLogin] = useDBSyncedState(false, 'config.json', [
    'general',
    'openAtLogin'
  ])
  const [quitToTray, setQuitToTray] = useDBSyncedState(false, 'config.json', [
    'general',
    'quitToTray'
  ])
  const { themeSetting, setThemeSetting } = useTheme()
  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>通用</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 justify-center')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>开机自启</div>
            <Switch
              checked={openAtLogin}
              onCheckedChange={async (checked) => {
                try {
                  await setOpenAtLogin(checked)
                  await ipcInvoke('update-open-at-login')
                  await ipcInvoke('update-tray-config')
                  toast.success('设置已更新')
                } catch (error) {
                  toast.error('设置更新失败')
                  console.error('更新设置失败:', error)
                }
              }}
            />
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>主题样式</div>
            <Select
              value={themeSetting}
              onValueChange={(value: 'dark' | 'light' | 'follow-system') => setThemeSetting(value)}
            >
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>主题样式</SelectLabel>
                  <SelectItem value="dark">暗色</SelectItem>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="follow-system">跟随系统</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            {/* <Switch checked={isDark} onCheckedChange={toggleTheme} /> */}
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('grow')}>关闭主面板</div>
            <Select
              value={quitToTray.toString()} // 转换为字符串
              onValueChange={async (value) => {
                await setQuitToTray(value === 'true') // 转换回布尔值
                await ipcInvoke('update-tray-config')
              }}
            >
              <SelectTrigger className={cn('w-[200px]')}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>操作</SelectLabel>
                  <SelectItem value="false">退出vnite</SelectItem>
                  <SelectItem value="true">最小化到托盘</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

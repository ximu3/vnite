import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Switch } from '@ui/switch'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useDBSyncedState } from '~/hooks'
import { CloudSyncInfo } from './Info'

export function CloudSync(): JSX.Element {
  const [enabled, setEnabled] = useDBSyncedState(false, 'config.json', ['cloudSync', 'enabled'])
  const [webdavUrl, setWebdavUrl] = useDBSyncedState('', 'config.json', [
    'cloudSync',
    'config',
    'webdavUrl'
  ])
  const [username, setUsername] = useDBSyncedState('', 'config.json', [
    'cloudSync',
    'config',
    'username'
  ])
  const [password, setPassword] = useDBSyncedState('', 'config.json', [
    'cloudSync',
    'config',
    'password'
  ])
  const [remotePath, setRemotePath] = useDBSyncedState('', 'config.json', [
    'cloudSync',
    'config',
    'remotePath'
  ])
  const updateCloudSyncConfig = async (): Promise<void> => {
    if (enabled) {
      if (!webdavUrl || !username || !password || !remotePath) {
        toast.error('请填写完整的云同步配置')
        return
      }
    }
    toast.promise(
      async () => {
        await ipcInvoke('update-cloud-sync-config', {
          enabled,
          config: { webdavUrl, username, password, remotePath }
        })
      },
      {
        loading: '正在更新云同步配置...',
        success: '云同步配置更新成功',
        error: '云同步配置更新失败'
      }
    )
  }
  return (
    <div className={cn('flex flex-col gap-5')}>
      {enabled && (
        <Card className={cn('group')}>
          <CardHeader>
            <CardTitle className={cn('relative')}>
              <div className={cn('flex flex-row justify-between items-center')}>
                <div className={cn('flex items-center')}>云同步信息</div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className={cn('')}>
            <CloudSyncInfo />
          </CardContent>
        </Card>
      )}
      <Card className={cn('group')}>
        <CardHeader>
          <CardTitle className={cn('relative')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div className={cn('flex items-center')}>云同步设置</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className={cn('')}>
          <div className={cn('flex flex-col gap-5 justify-start')}>
            <div className={cn('flex flex-row gap-5 justify-between items-center')}>
              <div>是否启用</div>
              <div>
                <Switch checked={enabled} onCheckedChange={setEnabled} />
              </div>
            </div>
            {enabled && (
              <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                <div>WebDAV URL</div>
                <div>
                  <Input
                    className={cn('w-[400px]')}
                    value={webdavUrl}
                    onChange={(e) => setWebdavUrl(e.target.value)}
                  />
                </div>
              </div>
            )}
            {enabled && (
              <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                <div>用户名</div>
                <div>
                  <Input
                    className={cn('w-[400px]')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
              </div>
            )}
            {enabled && (
              <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                <div>密码</div>
                <div>
                  <Input
                    className={cn('w-[400px]')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            )}
            {enabled && (
              <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                <div>远程路径</div>
                <div>
                  <Input
                    className={cn('w-[400px]')}
                    value={remotePath}
                    onChange={(e) => setRemotePath(e.target.value)}
                  />
                </div>
              </div>
            )}
            {enabled && (
              <div className={cn('flex flex-row-reverse gap-5 justify-between items-center')}>
                <Button onClick={updateCloudSyncConfig}>保存</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

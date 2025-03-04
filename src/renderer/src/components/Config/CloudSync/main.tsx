import { cn, formatDateToChineseWithSeconds } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { Switch } from '@ui/switch'
import { ipcInvoke } from '~/utils'
import { toast } from 'sonner'
import { useConfigLocalState } from '~/hooks'
import { RadioGroup, RadioGroupItem } from '@ui/radio-group'
import { Separator } from '@ui/separator'
import { Label } from '@ui/label'
import { Avatar, AvatarFallback } from '@ui/avatar'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { User, LogOut, ChevronDown, HardDrive, Cloud, Key, InfoIcon } from 'lucide-react'
import { Link } from '@ui/link'
import { useCloudSyncStore } from './store'
import { ROLE_QUOTAS } from '@appTypes/sync'

export function CloudSync(): JSX.Element {
  const { status } = useCloudSyncStore()
  const [enabled, setEnabled] = useConfigLocalState('sync.enabled')
  const [syncMode, setSyncMode] = useConfigLocalState('sync.mode')
  const [_1, setOfficialUsername] = useConfigLocalState('sync.officialConfig.auth.username')
  const [_2, setOfficialPassword] = useConfigLocalState('sync.officialConfig.auth.password')
  const [selfHostedUrl, setSelfHostedUrl] = useConfigLocalState('sync.selfHostedConfig.url')
  const [selfHostedUsername, setSelfHostedUsername] = useConfigLocalState(
    'sync.selfHostedConfig.auth.username'
  )
  const [selfHostedPassword, setSelfHostedPassword] = useConfigLocalState(
    'sync.selfHostedConfig.auth.password'
  )
  const [userId, setUserId] = useConfigLocalState('userInfo.id')
  const [_3, setUserAccessToken] = useConfigLocalState('userInfo.accessToken')
  const [userRole, setUserRole] = useConfigLocalState('userInfo.role')

  const totalQuota = ROLE_QUOTAS[userRole]

  const [usedQuota, setUsedQuota] = useState(0)
  const [storagePercentage, setStoragePercentage] = useState(0)

  // 获取存储使用情况
  useEffect(() => {
    if (enabled && userId) {
      const fetchStorageInfo = async (): Promise<void> => {
        try {
          // 这里应该替换为实际的API调用
          const dbSize = (await ipcInvoke('calculate-db-size')) as number
          if (dbSize) {
            setUsedQuota(dbSize)
          }
        } catch (error) {
          console.error('获取存储信息失败', error)
        }
      }

      fetchStorageInfo()
    }
  }, [enabled, userId])

  // 计算存储百分比
  useEffect(() => {
    if (totalQuota > 0) {
      setStoragePercentage((usedQuota / totalQuota) * 100)
    } else {
      setStoragePercentage(0)
    }
  }, [usedQuota, totalQuota])

  // 格式化存储大小
  const formatStorage = (bytes: number): string => {
    if (bytes === 0) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const updateCloudSyncConfig = async (): Promise<void> => {
    if (enabled) {
      if (
        syncMode === 'selfHosted' &&
        (!selfHostedUrl || !selfHostedUsername || !selfHostedPassword)
      ) {
        toast.error('请填写完整的云同步配置')
        return
      }

      if (syncMode === 'official' && !userId) {
        toast.error('请先登录官方账号')
        return
      }
    }

    toast.promise(
      async () => {
        await ipcInvoke('restart-sync')
      },
      {
        loading: '正在更新云同步配置...',
        success: '云同步配置更新成功',
        error: '云同步配置更新失败'
      }
    )
  }

  const handleOfficialSignin = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcInvoke('auth-signin')
      },
      {
        loading: '正在登录...',
        success: '登录成功',
        error: '登录失败'
      }
    )
  }

  const handleOfficialSignup = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcInvoke('auth-signup')
      },
      {
        loading: '正在注册...',
        success: '注册成功',
        error: '注册失败'
      }
    )
  }

  const handleOfficialLogout = (): void => {
    setOfficialUsername('')
    setOfficialPassword('')
    setUserId('')
    setUserAccessToken('')
    setUserRole('')
    setUsedQuota(0)
    return
  }

  const getInitials = (name: string): string => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className={cn('flex flex-col gap-2')}>
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
                <div>同步模式</div>
                <div>
                  <RadioGroup
                    className="flex flex-row gap-4"
                    value={syncMode}
                    onValueChange={setSyncMode}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official" id="official" />
                      <Label htmlFor="official">官方</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selfHosted" id="selfHosted" />
                      <Label htmlFor="self-hosted">自托管</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            )}

            {enabled && syncMode === 'official' && (
              <div className={cn('flex flex-col gap-4')}>
                {!userId ? (
                  <div
                    className={cn('flex flex-col gap-3 items-center p-6 bg-muted/50 rounded-lg')}
                  >
                    <Cloud size={40} className="mb-2 text-primary" />
                    <h3 className="text-lg font-medium">连接云端存储</h3>
                    <p className="mb-2 text-sm text-center text-muted-foreground">
                      登录账号以启用云同步功能，获取跨设备同步和数据备份
                    </p>
                    <div className={cn('flex flex-row gap-3')}>
                      <Button onClick={handleOfficialSignin} className="mt-2">
                        登录
                      </Button>
                      <Button variant={'outline'} onClick={handleOfficialSignup} className="mt-2">
                        注册
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Card className="border shadow-sm border-muted">
                    <CardContent className="pt-6">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-12 h-12 border-2 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-background">
                              <AvatarFallback>{getInitials(userId)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 transition-colors outline-none hover:text-primary">
                                  <span className="font-medium">{userId}</span>
                                  <ChevronDown size={16} className="text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={handleOfficialLogout}
                                  >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span>注销</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-lg font-medium">
                                  社区版
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  最近同步:{' '}
                                  <span className="font-medium">
                                    {(status?.timestamp &&
                                      formatDateToChineseWithSeconds(status?.timestamp)) ||
                                      '还未同步'}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <span
                              className={cn(
                                'inline-block w-2 h-2 mr-1 rounded-full',
                                status?.status === 'error'
                                  ? 'bg-amber-500'
                                  : 'bg-green-500 animate-pulse'
                              )}
                            ></span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                status?.status === 'error' ? 'text-amber-500' : 'text-green-500'
                              )}
                            >
                              {status?.status === 'error' ? '未连接' : '已连接'}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-sm text-muted-foreground">
                              <HardDrive className="w-4 h-4 mr-1" />
                              存储空间
                            </span>
                            <span className="text-sm">
                              {formatStorage(usedQuota)} / {formatStorage(totalQuota)}
                            </span>
                          </div>

                          {/* 自定义进度条，替代Progress组件 */}
                          <div className="relative w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                storagePercentage > 90
                                  ? 'bg-red-500'
                                  : storagePercentage > 75
                                    ? 'bg-amber-500'
                                    : 'bg-green-500'
                              )}
                              style={{ width: `${storagePercentage}%` }}
                            ></div>
                          </div>

                          {/* 添加使用百分比显示 */}
                          <div className="flex justify-end mt-1">
                            <span className="text-xs text-muted-foreground">
                              {storagePercentage.toFixed(1)}% 已使用
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
            {enabled && syncMode === 'selfHosted' && (
              <Card className="border shadow-sm border-muted">
                <CardContent className="pt-6">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-md bg-primary/10">
                          <HardDrive className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium">自托管 CouchDB</h3>
                          <p className="text-sm text-muted-foreground">
                            配置您的自托管 CouchDB 服务器以启用跨设备同步
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="pt-2 space-y-4">
                      <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4" />
                          <span>CouchDB 地址</span>
                        </div>
                        <div>
                          <Input
                            className={cn('w-[400px]')}
                            value={selfHostedUrl}
                            onChange={(e) => setSelfHostedUrl(e.target.value)}
                            placeholder="https://your-couchdb-server.com"
                          />
                        </div>
                      </div>

                      <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>用户名</span>
                        </div>
                        <div>
                          <Input
                            className={cn('w-[400px]')}
                            value={selfHostedUsername}
                            onChange={(e) => setSelfHostedUsername(e.target.value)}
                            placeholder="admin"
                          />
                        </div>
                      </div>

                      <div className={cn('flex flex-row gap-5 justify-between items-center')}>
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4" />
                          <span>密码</span>
                        </div>
                        <div>
                          <Input
                            className={cn('w-[400px]')}
                            type="password"
                            value={selfHostedPassword}
                            onChange={(e) => setSelfHostedPassword(e.target.value)}
                            placeholder="••••••••"
                          />
                        </div>
                      </div>

                      <div className="pt-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <InfoIcon className="w-3.5 h-3.5" />
                          <span>
                            CouchDB 是一个开源的文档数据库，可用于存储和同步数据 ，可以通过{' '}
                            <Link name="Fly.io" url="https://fly.io" /> 或其他服务快速部署自托管
                            CouchDB
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
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

import { cn } from '~/utils'
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
import { useTranslation } from 'react-i18next'
import { useCloudSyncStore } from './store'
import { ROLE_QUOTAS } from '@appTypes/sync'

export function CloudSync(): JSX.Element {
  const { t } = useTranslation('config')
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
  const [userName, setUserName] = useConfigLocalState('userInfo.name')
  const [_3, setUserAccessToken] = useConfigLocalState('userInfo.accessToken')
  const [userRole, setUserRole] = useConfigLocalState('userInfo.role')

  const totalQuota = ROLE_QUOTAS[userRole].maxStorage

  const [usedQuota, setUsedQuota] = useState(0)
  const [storagePercentage, setStoragePercentage] = useState(0)

  // 获取存储使用情况
  useEffect(() => {
    if (enabled && userName) {
      const fetchStorageInfo = async (): Promise<void> => {
        try {
          // 这里应该替换为实际的API调用
          const dbSize = (await ipcInvoke('calculate-db-size')) as number
          if (dbSize) {
            setUsedQuota(dbSize)
          }
        } catch (error) {
          console.error(t('cloudSync.errors.fetchStorageFailed'), error)
        }
      }

      fetchStorageInfo()
    }
  }, [enabled, userName, t])

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
        toast.error(t('cloudSync.errors.incompleteConfig'))
        return
      }

      if (syncMode === 'official' && !userName) {
        toast.error(t('cloudSync.errors.loginRequired'))
        return
      }
    }

    toast.promise(
      async () => {
        await ipcInvoke('restart-sync')
      },
      {
        loading: t('cloudSync.notifications.updating'),
        success: t('cloudSync.notifications.updateSuccess'),
        error: t('cloudSync.notifications.updateError')
      }
    )
  }

  const handleOfficialSignin = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcInvoke('auth-signin')
      },
      {
        loading: t('cloudSync.notifications.loggingIn'),
        success: t('cloudSync.notifications.loginSuccess'),
        error: t('cloudSync.notifications.loginError')
      }
    )
  }

  const handleOfficialSignup = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcInvoke('auth-signup')
      },
      {
        loading: t('cloudSync.notifications.registering'),
        success: t('cloudSync.notifications.registerSuccess'),
        error: t('cloudSync.notifications.registerError')
      }
    )
  }

  const handleOfficialLogout = (): void => {
    setOfficialUsername('')
    setOfficialPassword('')
    setUserName('')
    setUserAccessToken('')
    setUserRole('community')
    setUsedQuota(0)
    return
  }

  const getInitials = (name: string): string => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  return (
    <div className={cn('flex flex-col gap-2')}>
      {enabled && (
        <Card className={cn('group p-4 px-6')}>
          {status ? (
            <div className={cn('flex flex-row gap-1 text-xs')}>
              <div className={cn('flex flex-row gap-2 items-center justify-between')}>
                <div className={cn('flex flex-row gap-2 items-center')}>
                  <div className={cn('flex flex-row')}>
                    {status.status === 'syncing' ? (
                      <div className={cn('flex flex-row gap-1 items-center')}>
                        <span
                          className={cn(
                            'inline-block w-2 h-2 mr-3 rounded-lg',
                            'bg-accent animate-pulse'
                          )}
                        ></span>
                        <div>{t('cloudSync.status.syncing')}</div>
                      </div>
                    ) : status.status === 'success' ? (
                      <div className={cn('flex flex-row items-center')}>
                        <span
                          className={cn(
                            'inline-block w-2 h-2 mr-3 rounded-lg text-center',
                            'bg-primary'
                          )}
                        ></span>
                        <div>{t('cloudSync.status.success')}</div>
                      </div>
                    ) : (
                      <div className={cn('flex flex-row gap-1 items-center')}>
                        <span
                          className={cn('inline-block w-2 h-2 mr-3 rounded-lg', 'bg-destructive')}
                        ></span>
                        <div>{t('cloudSync.status.error')}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div>|</div>
              <div className={cn('flex flex-row gap-2 items-center')}>
                <div className={cn('truncate')}>{status.message}</div>
              </div>
              <div>|</div>
              <div className={cn('flex flex-row gap-2 items-center')}>
                <div className={cn('')}>
                  {t('{{date, niceDateSeconds}}', { date: status.timestamp })}
                </div>
              </div>
            </div>
          ) : (
            <div>{t('cloudSync.status.noInfo')}</div>
          )}
        </Card>
      )}
      <Card className={cn('group')}>
        <CardHeader>
          <CardTitle className={cn('relative')}>
            <div className={cn('flex flex-row justify-between items-center')}>
              <div className={cn('flex items-center')}>{t('cloudSync.title')}</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={cn('space-y-5')}>
            {/* 启用/禁用开关 - 网格布局 */}
            <div className={cn('grid grid-cols-[1fr_auto] gap-5 items-center')}>
              <div className={cn('whitespace-nowrap select-none')}>{t('cloudSync.enable')}</div>
              <Switch checked={enabled} onCheckedChange={setEnabled} />
            </div>

            {enabled && (
              <>
                {/* 同步模式选择 - 网格布局 */}
                <div className={cn('grid grid-cols-[1fr_auto] gap-5 items-center')}>
                  <div className={cn('whitespace-nowrap select-none')}>
                    {t('cloudSync.syncMode')}
                  </div>
                  <RadioGroup
                    className="flex flex-row gap-4"
                    value={syncMode}
                    onValueChange={setSyncMode}
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="official" id="official" />
                      <Label htmlFor="official">{t('cloudSync.modes.official')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="selfHosted" id="selfHosted" />
                      <Label htmlFor="self-hosted">{t('cloudSync.modes.selfHosted')}</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* 官方模式UI */}
            {enabled && syncMode === 'official' && (
              <div className={cn('flex flex-col gap-4')}>
                {!userName ? (
                  <div
                    className={cn('flex flex-col gap-3 items-center p-6 bg-muted/50 rounded-lg')}
                  >
                    <Cloud size={40} className="mb-2 text-primary" />
                    <h3 className="text-lg font-medium">{t('cloudSync.official.connectTitle')}</h3>
                    <p className="mb-2 text-sm text-center text-muted-foreground">
                      {t('cloudSync.official.connectDescription')}
                    </p>
                    <div className={cn('flex flex-row gap-3')}>
                      <Button onClick={handleOfficialSignin} className="mt-2">
                        {t('cloudSync.official.login')}
                      </Button>
                      <Button variant={'outline'} onClick={handleOfficialSignup} className="mt-2">
                        {t('cloudSync.official.register')}
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
                              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 transition-colors outline-none hover:text-primary">
                                  <span className="font-medium">{userName}</span>
                                  <ChevronDown size={16} className="text-muted-foreground" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={handleOfficialLogout}
                                  >
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span>{t('cloudSync.official.logout')}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-lg font-medium">
                                  {t('cloudSync.official.communityEdition')}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {t('cloudSync.official.lastSync')}:{' '}
                                  <span className="font-medium">
                                    {(status?.timestamp &&
                                      t('{{date, niceDateSeconds}}', { date: status.timestamp })) ||
                                      t('cloudSync.official.notSynced')}
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
                                  ? 'bg-destructive'
                                  : 'bg-primary animate-pulse'
                              )}
                            ></span>
                            <span
                              className={cn(
                                'text-xs font-medium',
                                status?.status === 'error' ? 'text-destructive' : 'text-primary'
                              )}
                            >
                              {status?.status === 'error'
                                ? t('cloudSync.official.disconnected')
                                : t('cloudSync.official.connected')}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 mt-2 border-t">
                          <div className="flex items-center justify-between mb-2">
                            <span className="flex items-center text-sm text-muted-foreground">
                              <HardDrive className="w-4 h-4 mr-1" />
                              {t('cloudSync.official.storage')}
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
                                storagePercentage > 90 ? 'bg-destructive' : 'bg-primary'
                              )}
                              style={{ width: `${storagePercentage}%` }}
                            ></div>
                          </div>

                          {/* 添加使用百分比显示 */}
                          <div className="flex justify-end mt-1">
                            <span className="text-xs text-muted-foreground">
                              {storagePercentage.toFixed(1)}% {t('cloudSync.official.used')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* 自托管模式UI - 转换为网格布局 */}
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
                          <h3 className="text-lg font-medium">{t('cloudSync.selfHosted.title')}</h3>
                          <p className="text-sm text-muted-foreground">
                            {t('cloudSync.selfHosted.description')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* 自托管表单项 - 网格布局 */}
                    <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-4 items-center">
                      <div className="flex items-center gap-2 select-none whitespace-nowrap">
                        <HardDrive className="w-4 h-4" />
                        <span>{t('cloudSync.selfHosted.serverAddress')}</span>
                      </div>
                      <div>
                        <Input
                          className={cn('w-full')}
                          value={selfHostedUrl}
                          onChange={(e) => setSelfHostedUrl(e.target.value)}
                          placeholder="https://your-couchdb-server.com"
                        />
                      </div>

                      <div className="flex items-center gap-2 select-none whitespace-nowrap">
                        <User className="w-4 h-4" />
                        <span>{t('cloudSync.selfHosted.username')}</span>
                      </div>
                      <div>
                        <Input
                          className={cn('w-full')}
                          value={selfHostedUsername}
                          onChange={(e) => setSelfHostedUsername(e.target.value)}
                          placeholder="admin"
                        />
                      </div>

                      <div className="flex items-center gap-2 select-none whitespace-nowrap">
                        <Key className="w-4 h-4" />
                        <span>{t('cloudSync.selfHosted.password')}</span>
                      </div>
                      <div>
                        <Input
                          className={cn('w-full')}
                          type="password"
                          value={selfHostedPassword}
                          onChange={(e) => setSelfHostedPassword(e.target.value)}
                          placeholder="••••••••"
                        />
                      </div>

                      {/* 跨越两列的信息提示 */}
                      <div className="col-span-2 pt-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <InfoIcon className="w-3.5 h-3.5" />
                          <span>
                            {t('cloudSync.selfHosted.info', {
                              flyio: <Link name="Fly.io" url="https://fly.io" />
                            })}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 保存按钮 */}
            {enabled && (
              <div className={cn('flex justify-end pt-2')}>
                <Button onClick={updateCloudSyncConfig}>{t('ui:common.save')}</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

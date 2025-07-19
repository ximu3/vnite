import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useConfigLocalState } from '~/hooks'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { useEffect, useState } from 'react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '~/components/ui/dropdown-menu'
import { User, LogOut, HardDrive, Cloud, Key, InfoIcon } from 'lucide-react'
import { Link } from '~/components/ui/link'
import { useTranslation } from 'react-i18next'
import { useCloudSyncStore } from './store'
import { ROLE_QUOTAS } from '@appTypes/sync'
import { ConfigItem, ConfigItemPure } from '~/components/form'
import { Trans } from 'react-i18next'

export function CloudSync(): React.JSX.Element {
  const { t } = useTranslation('config')
  const { status, usedQuota, setUsedQuota } = useCloudSyncStore()
  const [enabled, setEnabled] = useConfigLocalState('sync.enabled')
  const [syncMode, setSyncMode] = useConfigLocalState('sync.mode')
  const [_1, setOfficialUsername] = useConfigLocalState('sync.officialConfig.auth.username')
  const [_2, setOfficialPassword] = useConfigLocalState('sync.officialConfig.auth.password')
  const [selfHostedUrl, setSelfHostedUrl, saveSelfHostedUrl] = useConfigLocalState(
    'sync.selfHostedConfig.url',
    true
  )
  const [selfHostedUsername, setSelfHostedUsername, saveSelfHostedUsername] = useConfigLocalState(
    'sync.selfHostedConfig.auth.username',
    true
  )
  const [selfHostedPassword, setSelfHostedPassword, saveSelfHostedPassword] = useConfigLocalState(
    'sync.selfHostedConfig.auth.password',
    true
  )
  const [userName, setUserName] = useConfigLocalState('userInfo.name')
  const [_3, setUserAccessToken] = useConfigLocalState('userInfo.accessToken')
  const [userRole, setUserRole] = useConfigLocalState('userInfo.role')
  const [userEmail, setUserEmail] = useConfigLocalState('userInfo.email')

  const totalQuota = ROLE_QUOTAS[userRole].maxStorage

  const [storagePercentage, setStoragePercentage] = useState(0)

  // Getting Storage Usage
  useEffect(() => {
    if (enabled && userName) {
      const fetchStorageInfo = async (): Promise<void> => {
        try {
          const dbSize = await ipcManager.invoke('db:get-couchdb-size')
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

  // Calculate storage percentage
  useEffect(() => {
    if (totalQuota > 0) {
      setStoragePercentage((usedQuota / totalQuota) * 100)
    } else {
      setStoragePercentage(0)
    }
  }, [usedQuota, totalQuota])

  useEffect(() => {
    ipcManager.on('account:auth-success', async () => {
      toast.success(t('cloudSync.notifications.authSuccess'))
      await updateCloudSyncConfig()
    })
    ipcManager.on('account:auth-failed', (_event, message) => {
      toast.error(`${t('cloudSync.notifications.authError')}, ${message}`)
    })
  }, [])

  // Formatted Storage Size
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
        await ipcManager.invoke('db:restart-sync')
      },
      {
        loading: t('cloudSync.notifications.updating'),
        success: t('cloudSync.notifications.updateSuccess'),
        error: t('cloudSync.notifications.updateError')
      }
    )
  }

  const handleFullSync = async (): Promise<void> => {
    try {
      await ipcManager.invoke('db:full-sync')
    } catch (error) {
      console.error('Full sync error:', error)
    }
  }

  const handleOfficialSignin = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcManager.invoke('account:auth-signin')
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
        await ipcManager.invoke('account:auth-signup')
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
    setUserEmail('')
    setUserRole('community')
    setUsedQuota(0)
    return
  }

  const getInitials = (name: string): string => {
    if (!name) return 'U'
    return name.charAt(0).toUpperCase()
  }

  const getEdtionText = (): string => {
    if (userRole === 'community') {
      return t('cloudSync.official.communityEdition')
    } else if (userRole === 'developer') {
      return t('cloudSync.official.developerEdition')
    } else {
      return t('cloudSync.official.premiumEdition')
    }
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
            <div className={cn('text-xs')}>{t('cloudSync.status.noInfo')}</div>
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
        <CardContent className={cn('')}>
          <div className={cn('space-y-5')}>
            {/* Enable/Disable Switch */}
            <ConfigItem
              hookType="configLocal"
              path="sync.enabled"
              title={t('cloudSync.enable')}
              description="启用云同步功能"
              controlType="switch"
              onChange={async (value) => {
                setEnabled(value)
                if (!value) {
                  await ipcManager.invoke('db:stop-sync')
                }
              }}
            ></ConfigItem>

            <ConfigItemPure
              title={t('cloudSync.syncFull')}
              description={t('cloudSync.syncFullDescription')}
            >
              <Button onClick={handleFullSync}>{t('cloudSync.syncFullButton')}</Button>
            </ConfigItemPure>

            {enabled && (
              <>
                {/* Synchronization mode selection */}
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

            {/* Official Mode UI */}
            {enabled && syncMode === 'official' && (
              <div className={cn('flex flex-col gap-4')}>
                {!userName ? (
                  <div
                    className={cn('flex flex-col gap-3 items-center p-6 bg-muted/30 rounded-lg')}
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
                  <Card className="shadow-sm">
                    <CardContent className="">
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Avatar className="border-2 w-14 h-14 bg-gradient-to-br from-primary to-primary/70 text-primary-foreground border-background">
                              <AvatarImage email={userEmail} />
                              <AvatarFallback>{getInitials(userName)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1 transition-colors outline-none hover:text-primary">
                                  <span className="font-medium">{userName}</span>
                                  <span className="icon-[mdi--keyboard-arrow-down] mt-1"></span>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                  <DropdownMenuItem onClick={handleOfficialLogout}>
                                    <LogOut className="w-4 h-4 mr-2" />
                                    <span>{t('cloudSync.official.logout')}</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-lg font-medium">
                                  {getEdtionText()}
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

                          <div className="relative w-full h-2.5 bg-muted/60 rounded-full overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                storagePercentage > 90 ? 'bg-destructive' : 'bg-primary'
                              )}
                              style={{ width: `${storagePercentage}%` }}
                            ></div>
                          </div>

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

            {/* Self-hosted mode UI */}
            {enabled && syncMode === 'selfHosted' && (
              <Card className="shadow-sm">
                <CardContent className="">
                  <div className="flex flex-col gap-5">
                    {/* Self-hosted form items */}
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
                          onBlur={saveSelfHostedUrl}
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
                          onBlur={saveSelfHostedUsername}
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
                          onBlur={saveSelfHostedPassword}
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="col-span-2 pt-2 text-xs text-muted-foreground">
                        <p className="flex items-center gap-1">
                          <InfoIcon className="w-3.5 h-3.5" />
                          <span>
                            <Trans
                              i18nKey="config:cloudSync.selfHosted.info"
                              components={{
                                couchdb: (
                                  <Link
                                    name="CouchDB"
                                    className="text-xs"
                                    url="https://couchdb.apache.org"
                                  />
                                )
                              }}
                            />
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Save button */}
            {enabled && (
              <div className={cn('flex justify-end pt-2')}>
                <Button onClick={updateCloudSyncConfig}>{t('utils:common.save')}</Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

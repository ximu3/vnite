import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Button } from '~/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog'
import { Switch } from '~/components/ui/switch'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'

export function Database(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [isPortable, setIsPortable] = useState<boolean>(false)
  const [isAdmin, setIsAdmin] = useState<boolean>(false)
  const [switchDialogOpen, setSwitchDialogOpen] = useState<boolean>(false)

  useEffect(() => {
    ipcManager.invoke('app:is-portable-mode').then((isPortable) => {
      setIsPortable(isPortable as boolean)
    })

    ipcManager.invoke('system:check-admin-permissions').then((hasAdminRights) => {
      setIsAdmin(hasAdminRights as boolean)
    })
  }, [])

  const backup = async (): Promise<void> => {
    toast.promise(
      async () => {
        const targetPath = await ipcManager.invoke('system:select-path-dialog', ['openDirectory'])
        if (!targetPath) return
        await ipcManager.invoke('db:backup', targetPath)
      },
      {
        loading: t('database.notifications.backingUp'),
        success: t('database.notifications.backupSuccess'),
        error: t('database.notifications.backupError')
      }
    )
  }

  const restore = async (): Promise<void> => {
    toast.promise(
      async () => {
        const sourcePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
        if (!sourcePath) return
        await ipcManager.invoke('db:restore', sourcePath)
      },
      {
        loading: t('database.notifications.importing'),
        success: t('database.notifications.importSuccess'),
        error: t('database.notifications.importError')
      }
    )
  }

  const importV2Data = async (): Promise<void> => {
    toast.promise(
      async () => {
        const sourcePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
        if (!sourcePath) return
        await ipcManager.invoke('importer:import-v2-data', sourcePath)
      },
      {
        loading: t('database.notifications.importing'),
        success: t('database.notifications.importSuccess'),
        error: t('database.notifications.importError')
      }
    )
  }

  const handleSwitchClick = async (): Promise<void> => {
    // If user wants to switch to portable mode but do not have administrator permissions
    if (!isPortable && !isAdmin) {
      const isNeedAdminRights = await ipcManager.invoke(
        'system:check-if-portable-directory-needs-admin-rights'
      )
      if (isNeedAdminRights) {
        toast.error(t('database.notifications.adminRightsRequired'))
        return
      }
    }
    // Open the confirmation dialog
    setSwitchDialogOpen(true)
  }

  const switchDatabaseMode = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcManager.invoke('app:switch-database-mode')
        setIsPortable((prev) => !prev)
        toast.info(t('database.notifications.restartCountdown'))
        setTimeout(() => {
          ipcManager.send('app:relaunch-app')
        }, 3000)
      },
      {
        loading: t('database.notifications.switchingMode'),
        success: t('database.notifications.switchSuccess'),
        error: t('database.notifications.switchError')
      }
    )
  }

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('database.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('space-y-5 w-full')}>
          {/* Portable Mode Setting */}
          <ConfigItemPure
            title={t('database.portableMode')}
            description={t('database.portableModeDescription')}
          >
            <Switch
              checked={isPortable}
              onClick={handleSwitchClick}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSwitchClick()
                }
              }}
            />
            <AlertDialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('database.confirmSwitch', {
                      mode: isPortable ? t('database.modes.normal') : t('database.modes.portable')
                    })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {!isPortable && (
                      <>
                        {t('database.portableAdminRequired')}
                        <br />
                      </>
                    )}
                    {t('database.switchDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={switchDatabaseMode}>
                    {t('utils:common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </ConfigItemPure>

          <Separator />

          {/* Database Operations */}
          <div className={cn('space-y-4')}>
            <ConfigItemPure
              title={t('database.openFolder')}
              description={t('database.openFolderDescription')}
            >
              <Button
                variant={'outline'}
                onClick={async () => {
                  await ipcManager.invoke('utils:open-database-path-in-explorer')
                }}
              >
                {t('database.openFolder')}
              </Button>
            </ConfigItemPure>

            <ConfigItemPure
              title={t('database.backup')}
              description={t('database.backupDescription')}
            >
              <div className={cn('flex flex-row gap-5 items-center')}>
                <Button onClick={backup}>{t('database.backup')}</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button>{t('database.import')}</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('database.confirmImport')}</AlertDialogTitle>
                      <AlertDialogDescription>{t('database.importWarning')}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={restore}>
                        {t('utils:common.confirm')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </ConfigItemPure>

            <ConfigItemPure
              title={t('database.importV2')}
              description={t('database.importV2Description')}
            >
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant={'outline'}>{t('database.importV2')}</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t('database.confirmImportV2')}</AlertDialogTitle>
                    <AlertDialogDescription>{t('database.importV2Warning')}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={importV2Data}>
                      {t('utils:common.confirm')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </ConfigItemPure>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

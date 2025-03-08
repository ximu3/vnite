import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Separator } from '@ui/separator'
import { Button } from '@ui/button'
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
} from '@ui/alert-dialog'
import { Switch } from '@ui/switch'
import { ipcInvoke, ipcSend } from '~/utils'
import { toast } from 'sonner'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

export function Database(): JSX.Element {
  const { t } = useTranslation('config')

  const backup = async (): Promise<void> => {
    toast.promise(
      async () => {
        const targetPath: string = await ipcInvoke('select-path-dialog', ['openDirectory'])
        if (!targetPath) return
        await ipcInvoke('backup-database', targetPath)
      },
      {
        loading: t('database.messages.backingUp'),
        success: t('database.messages.backupSuccess'),
        error: t('database.messages.backupError')
      }
    )
  }

  const restore = async (): Promise<void> => {
    toast.promise(
      async () => {
        const sourcePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
        if (!sourcePath) return
        await ipcInvoke('restore-database', sourcePath)
      },
      {
        loading: t('database.messages.importing'),
        success: t('database.messages.importSuccess'),
        error: t('database.messages.importError')
      }
    )
  }

  const importV1Data = async (): Promise<void> => {
    toast.promise(
      async () => {
        const sourcePath: string = await ipcInvoke('select-path-dialog', ['openFile'])
        if (!sourcePath) return
        await ipcInvoke('import-v1-data', sourcePath)
      },
      {
        loading: t('database.messages.importing'),
        success: t('database.messages.importSuccess'),
        error: t('database.messages.importError')
      }
    )
  }

  const [isPortable, setIsPortable] = useState<boolean>(false)

  useEffect(() => {
    ipcInvoke('is-portable-mode').then((isPortable) => {
      setIsPortable(isPortable as boolean)
    })
  }, [])

  const switchDatabaseMode = async (): Promise<void> => {
    toast.promise(
      async () => {
        await ipcInvoke('switch-database-mode')
        setIsPortable((prev) => !prev)
        toast.info(t('database.messages.restartCountdown'))
        setTimeout(() => {
          ipcSend('relaunch-app')
        }, 3000)
      },
      {
        loading: t('database.messages.switchingMode'),
        success: t('database.messages.switchSuccess'),
        error: t('database.messages.switchError')
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
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 w-full')}>
          <div className={cn('flex flex-row gap-5 items-center justify-between')}>
            <div>{t('database.portableMode')}</div>
            <AlertDialog>
              <AlertDialogTrigger>
                <Switch checked={isPortable} />
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {t('database.confirmSwitch', {
                      mode: isPortable ? t('database.modes.normal') : t('database.modes.portable')
                    })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t('database.switchDescription')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('ui:common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={switchDatabaseMode}>
                    {t('ui:common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <Separator />
          <div className={cn('flex flex-row gap-5 items-center')}>
            <Button
              variant={'outline'}
              onClick={async () => {
                await ipcInvoke('open-database-path-in-explorer')
              }}
            >
              {t('database.openFolder')}
            </Button>
          </div>
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
                  <AlertDialogCancel>{t('ui:common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={restore}>{t('ui:common.confirm')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className={cn('flex flex-row gap-5 items-center')}>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant={'outline'}>{t('database.importV1')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('database.confirmImportV1')}</AlertDialogTitle>
                  <AlertDialogDescription>{t('database.importV1Warning')}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('ui:common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={importV1Data}>
                    {t('ui:common.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

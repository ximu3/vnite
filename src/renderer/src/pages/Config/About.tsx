import { cn } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Separator } from '~/components/ui/separator'
import { Link } from '~/components/ui/link'
import { Button } from '~/components/ui/button'
import { ConfigItem } from '~/components/form/ConfigItem'
import { ConfigItemPure } from '~/components/form/ConfigItemPure'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdaterStore } from '~/pages/Updater/store'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'

export function About(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [version, setVersion] = useState('')
  const { setIsOpen: setUpdateDialogIsOpen, setUpdateInfo } = useUpdaterStore()

  useEffect(() => {
    async function getVersion(): Promise<void> {
      const version = await ipcManager.invoke('app:get-app-version')
      setVersion(version)
    }

    getVersion()
  }, [])

  return (
    <Card className={cn('group')}>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center')}>{t('about.title')}</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={cn('space-y-4')}>
          {/* Author Information */}
          <ConfigItemPure title={t('about.author')}>
            <Link name="ximu" url="https://github.com/ximu3" />
          </ConfigItemPure>

          {/* Version Information */}
          <ConfigItemPure title={t('about.version')}>
            <div className={cn('flex gap-2 text-sm items-center')}>
              <div>{version}</div>
              <Button
                variant="outline"
                size="icon"
                className={cn('w-6 h-6')}
                onClick={async () => {
                  toast.loading(t('utils:notifications.checkingForUpdate'), {
                    id: 'checking-for-update'
                  })
                  setUpdateInfo(null)
                  await ipcManager.invoke('updater:check-update')
                  toast.dismiss('checking-for-update')
                  setUpdateDialogIsOpen(true)
                }}
              >
                <span className={cn('icon-[mdi--reload] w-4 h-4')}></span>
              </Button>
            </div>
          </ConfigItemPure>

          {/* Repository Links */}
          <ConfigItemPure title={t('about.repository')}>
            <Link
              noToolTip
              name="https://github.com/ximu3/vnite"
              url="https://github.com/ximu3/vnite"
            />
          </ConfigItemPure>

          <Separator />

          {/* Feedback Links */}
          <ConfigItemPure title={t('about.feedback')}>
            <Link name="Github Issue" url="https://github.com/ximu3/vnite/issues" />
          </ConfigItemPure>

          {/* Group Link */}
          <ConfigItemPure title={t('about.group')}>
            <Link name="Telegram" url="https://t.me/+d65-R_xRx1JlYWZh" />
          </ConfigItemPure>

          <Separator />

          {/* Prerelease Setting */}
          <ConfigItem
            hookType="config"
            path="updater.allowPrerelease"
            title={t('about.prerelease')}
            controlType="switch"
            onChange={async (checked) => {
              await ipcManager.invoke('updater:update-config')
              if (checked) {
                toast.loading(t('utils:notifications.checkingForUpdate'), {
                  id: 'checking-for-update'
                })
                setUpdateInfo(null)
                await ipcManager.invoke('updater:check-update')
                toast.dismiss('checking-for-update')
                setUpdateDialogIsOpen(true)
              }
            }}
          />
        </div>
      </CardContent>
    </Card>
  )
}

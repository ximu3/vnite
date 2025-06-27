import { cn } from '~/utils'
import { Card, CardContent } from '@ui/card'
import { Separator } from '@ui/separator'
import { Link } from '@ui/link'
import { Button } from '@ui/button'
import { Switch } from '~/components/ui/switch'
import { useConfigState } from '~/hooks'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdaterStore } from '~/pages/Updater/store'
import { toast } from 'sonner'

export function About(): JSX.Element {
  const { t } = useTranslation('config')
  const [version, setVersion] = useState('')
  const { setIsOpen: setUpdateDialogIsOpen, setUpdateInfo } = useUpdaterStore()
  const [allowPrerelease, setAllowPrerelease] = useConfigState('updater.allowPrerelease')

  useEffect(() => {
    async function getVersion(): Promise<void> {
      const version = await window.api.utils.getAppVersion()
      setVersion(version)
    }

    getVersion()
  }, [])

  return (
    <Card className={cn('group')}>
      <CardContent>
        <div className={cn('grid grid-cols-[auto_1fr] gap-5 items-center select-none')}>
          {/* Author information */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.author')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="ximu" url="https://github.com/ximu3" />
          </div>

          {/* Version information */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.version')}</div>
          <div className={cn('flex justify-end gap-2 text-sm items-center')}>
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
                await window.api.updater.checkUpdate()
                toast.dismiss('checking-for-update')
                setUpdateDialogIsOpen(true)
              }}
            >
              <span className={cn('icon-[mdi--reload] w-4 h-4')}></span>
            </Button>
          </div>

          {/* Repository link */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.repository')}</div>
          <div className={cn('flex justify-end')}>
            <Link
              noToolTip
              name="https://github.com/ximu3/vnite"
              url="https://github.com/ximu3/vnite"
            />
          </div>

          <div className={cn('col-span-2 py-0')}>
            <Separator />
          </div>

          {/* Feedback link */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.feedback')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="Github Issue" url="https://github.com/ximu3/vnite/issues" />
          </div>

          {/* Social media links */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.group')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="Telegram" url="https://t.me/+d65-R_xRx1JlYWZh" />
          </div>

          <div className={cn('col-span-2 py-0')}>
            <Separator />
          </div>

          {/* Prerelease */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.prerelease')}</div>
          <div className={cn('flex justify-end')}>
            <Switch
              id="prerelease"
              checked={allowPrerelease}
              onCheckedChange={async (checked) => {
                await setAllowPrerelease(checked)
                await window.api.updater.updateUpdaterConfig()
                if (checked) {
                  toast.loading(t('utils:notifications.checkingForUpdate'), {
                    id: 'checking-for-update'
                  })
                  setUpdateInfo(null)
                  await window.api.updater.checkUpdate()
                  toast.dismiss('checking-for-update')
                  setUpdateDialogIsOpen(true)
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

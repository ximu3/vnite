import { cn, ipcSend } from '~/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Separator } from '@ui/separator'
import { Link } from '@ui/link'
import { Button } from '@ui/button'
import { ipcInvoke } from '~/utils'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useUpdaterStore } from '~/pages/Updater/store'

export function About(): JSX.Element {
  const { t } = useTranslation('config')
  const [version, setVersion] = useState('')
  const { setIsOpen: setUpdateDialogIsOpen } = useUpdaterStore()

  useEffect(() => {
    async function getVersion(): Promise<void> {
      const version = (await ipcInvoke('get-app-version')) as string
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
      <CardContent className={cn('')}>
        <div className={cn('flex flex-col gap-5 justify-center')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>{t('about.author')}</div>
            <Link name="ximu" url="https://github.com/ximu3" />
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>{t('about.version')}</div>
            <div className={cn('flex flex-row gap-2 text-sm items-center')}>
              <div>{version}</div>
              <Button
                variant="outline"
                size="icon"
                className={cn('w-6 h-6')}
                onClick={() => {
                  ipcSend('check-update')
                  setUpdateDialogIsOpen(true)
                }}
              >
                <span className={cn('icon-[mdi--reload] w-4 h-4')}></span>
              </Button>
            </div>
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>{t('about.repository')}</div>
            <Link
              noToolTip
              name="https://github.com/ximu3/vnite"
              url="https://github.com/ximu3/vnite"
            />
          </div>
          <Separator />
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>{t('about.feedback')}</div>
            <Link name="Github Issue" url="https://github.com/ximu3/vnite/issues" />
          </div>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div>{t('about.group')}</div>
            <Link name="Telegram" url="https://t.me/+d65-R_xRx1JlYWZh" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

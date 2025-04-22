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
      <CardContent>
        <div className={cn('grid grid-cols-[auto_1fr] gap-5 items-center')}>
          {/* Author Information */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.author')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="ximu" url="https://github.com/ximu3" />
          </div>

          {/* version information */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.version')}</div>
          <div className={cn('flex justify-end gap-2 text-sm items-center')}>
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

          {/* Warehouse Links */}
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

          {/* Feedback Links */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.feedback')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="Github Issue" url="https://github.com/ximu3/vnite/issues" />
          </div>

          {/* group link */}
          <div className={cn('whitespace-nowrap select-none')}>{t('about.group')}</div>
          <div className={cn('flex justify-end')}>
            <Link name="Telegram" url="https://t.me/+d65-R_xRx1JlYWZh" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

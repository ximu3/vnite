import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'
import { useCloudSyncStore } from './store'

export function CloudSyncInfo({ className }: { className?: string }): JSX.Element {
  const { t } = useTranslation('config')
  const { status } = useCloudSyncStore()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('flex flex-col gap-5 justify-start')}>
        {status ? (
          <div className={cn('flex flex-col gap-1')}>
            <div className={cn('flex flex-row gap-2 items-center justify-between')}>
              <div className={cn('flex flex-row gap-2 items-center')}>
                <div className={cn('')}>{t('cloudSync.info.status')}</div>
                <div className={cn('flex flex-row')}>
                  {status.status === 'syncing' ? (
                    <div className={cn('flex flex-row gap-1 items-center')}>
                      <span
                        className={cn(
                          'inline-block w-2 h-2 mr-1 rounded-lg',
                          'bg-accent animate-pulse'
                        )}
                      ></span>
                      <div>{t('cloudSync.status.syncing')}</div>
                    </div>
                  ) : status.status === 'success' ? (
                    <div className={cn('flex flex-row items-center')}>
                      <span
                        className={cn('inline-block w-2 h-2 mr-1 rounded-lg', 'bg-primary')}
                      ></span>
                      <div>{t('cloudSync.status.success')}</div>
                    </div>
                  ) : (
                    <div className={cn('flex flex-row gap-1 items-center')}>
                      <span
                        className={cn('inline-block w-2 h-2 mr-1 rounded-lg', 'bg-destructive')}
                      ></span>
                      <div>{t('cloudSync.status.error')}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={cn('flex flex-row gap-2 items-center')}>
              <div className={cn('flex-shrink-0')}>{t('cloudSync.info.message')}</div>
              <div className={cn('truncate')}>{status.message}</div>
            </div>
            <div className={cn('flex flex-row gap-2 items-center')}>
              <div className={cn('')}>{t('cloudSync.info.time')}</div>
              <div className={cn('')}>
                {t('{{date, niceDateSeconds}}', { date: status.timestamp })}
              </div>
            </div>
          </div>
        ) : (
          <div>{t('cloudSync.status.noInfo')}</div>
        )}
      </div>
    </div>
  )
}

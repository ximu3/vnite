import { cn } from '~/utils'
import { useTranslation } from 'react-i18next'
import { useCloudSyncStore } from './store'

export function CloudSyncInfo({ className }: { className?: string }): React.JSX.Element {
  const { t } = useTranslation('config')
  const { status } = useCloudSyncStore()

  return (
    <div className={cn('space-y-3', className)}>
      {status ? (
        <div className={cn('grid grid-cols-[auto_1fr] gap-x-2 gap-y-1')}>
          {/* Status */}
          <div className={cn('whitespace-nowrap select-none')}>{t('cloudSync.info.status')}</div>
          <div>
            {status.status === 'syncing' ? (
              <div className={cn('flex flex-row gap-1 items-center')}>
                <span
                  className={cn('inline-block w-2 h-2 mr-1 rounded-lg', 'bg-accent animate-pulse')}
                ></span>
                <div>{t('cloudSync.status.syncing')}</div>
              </div>
            ) : status.status === 'success' ? (
              <div className={cn('flex flex-row items-center')}>
                <span className={cn('inline-block w-2 h-2 mr-1 rounded-lg', 'bg-primary')}></span>
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

          {/* Message */}
          <div className={cn('whitespace-nowrap select-none')}>{t('cloudSync.info.message')}</div>
          <div className={cn('truncate')}>{status.message}</div>

          {/* Time */}
          <div className={cn('whitespace-nowrap select-none')}>{t('cloudSync.info.time')}</div>
          <div>{t('{{date, niceDateSeconds}}', { date: status.timestamp })}</div>
        </div>
      ) : (
        <div>{t('cloudSync.status.noInfo')}</div>
      )}
    </div>
  )
}

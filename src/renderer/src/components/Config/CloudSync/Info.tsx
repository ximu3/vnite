import { cn, formatDateToChineseWithSeconds } from '~/utils'

import { useCloudSyncStore } from './store'

export function CloudSyncInfo({ className }: { className?: string }): JSX.Element {
  const { status } = useCloudSyncStore()

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('flex flex-col gap-5 justify-start')}>
        {status ? (
          <div className={cn('flex flex-col gap-1')}>
            <div className={cn('flex flex-row gap-2 items-center justify-between')}>
              <div className={cn('flex flex-row gap-2 items-center')}>
                <div className={cn('')}>状态</div>
                <div className={cn('flex flex-row')}>
                  {status.status === 'syncing' ? (
                    <div className={cn('flex flex-row gap-1 items-center')}>
                      <div className={cn('w-3 h-3 rounded-lg bg-accent')}></div>
                      <div>同步中</div>
                    </div>
                  ) : status.status === 'success' ? (
                    <div className={cn('flex flex-row gap-1 items-center')}>
                      <div className={cn('w-3 h-3 rounded-lg bg-primary')}></div>
                      <div>同步成功</div>
                    </div>
                  ) : (
                    <div className={cn('flex flex-row gap-1 items-center')}>
                      <div className={cn('w-3 h-3 rounded-lg bg-destructive')}></div>
                      <div>同步失败</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={cn('flex flex-row gap-2 items-center')}>
              <div className={cn('flex-shrink-0')}>消息</div>
              <div className={cn('truncate')}>{status.message}</div>
            </div>
            <div className={cn('flex flex-row gap-2 items-center')}>
              <div className={cn('')}>时间</div>
              <div className={cn('')}>{formatDateToChineseWithSeconds(status.timestamp)}</div>
            </div>
          </div>
        ) : (
          <div>暂无同步信息</div>
        )}
      </div>
    </div>
  )
}

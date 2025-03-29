import { useTranslation } from 'react-i18next'
import { Separator } from '@ui/separator'
import React from 'react'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { ExtraInformationDialog } from './ExtraInformationDialog'
import { FilterAdder } from '../../FilterAdder'

export function ExtraInformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): JSX.Element {
  const { t } = useTranslation('game')
  const [extra] = useGameState(gameId, 'metadata.extra')

  const handleCopyExtra = (): void => {
    if (!extra || extra.length === 0) return

    copyWithToast(
      extra
        .map((item) => {
          // Combine arrays of values into comma-separated strings
          const valueStr = item.value.join(', ')
          return `${t(`detail.overview.extraInformation.fields.${item.key}`, item.key)}: ${valueStr}`
        })
        .join('\n')
    )
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopyExtra}>
          {t('detail.overview.sections.extraInfo')}
        </div>
        <ExtraInformationDialog gameId={gameId} />
      </div>

      <Separator className={cn('my-3 bg-primary')} />

      <div className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm')}>
        {!extra || extra.length === 0 ? (
          <div className={cn('col-span-2')}>{t('detail.overview.extraInformation.empty')}</div>
        ) : (
          extra.map((item, index) => (
            <React.Fragment key={index}>
              <div
                className={cn('whitespace-nowrap select-none cursor-pointer')}
                onClick={() => copyWithToast(item.key)}
              >
                {item.key}
              </div>
              <div
                className={cn(
                  'flex flex-wrap gap-x-1 gap-y-[6px]',
                  item.value.length > 0 && 'mt-[2px]'
                )}
              >
                {item.value.length === 0 ? (
                  <span>{t('detail.overview.extraInformation.empty')}</span>
                ) : (
                  item.value.map((val, i) => (
                    <div key={i} className={cn('flex items-center')}>
                      <FilterAdder filed={`metadata.extra.${item.key || 'unknown'}`} value={val} />
                    </div>
                  ))
                )}
              </div>
            </React.Fragment>
          ))
        )}
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { ExtraInformationDialog } from './ExtraInformationDialog'
import { SearchExtraInformationDialog } from './SearchExtraInformationDialog'
import { SeparatorDashed } from '@ui/separator-dashed'

export function ExtraInformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [extra, setExtra] = useGameState(gameId, 'metadata.extra')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false)

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

  const handleSelectExtraInfo = (newExtraInfo: { key: string; value: string }[]): void => {
    const groupedExtra = newExtraInfo.reduce<Array<{ key: string; value: string[] }>>(
      (acc, item) => {
        const existingItem = acc.find((x) => x.key === item.key)
        if (existingItem) {
          if (!existingItem.value.includes(item.value)) {
            existingItem.value.push(item.value)
          }
        } else {
          acc.push({ key: item.key, value: [item.value] })
        }
        return acc
      },
      []
    )

    setExtra(groupedExtra)
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopyExtra}>
          {t('detail.overview.sections.extraInfo')}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'cursor-pointer icon-[mdi--magnify] invisible group-hover:visible w-5 h-5 mb-[4px]'
            )}
            onClick={() => setIsSearchDialogOpen(true)}
          ></span>

          <ExtraInformationDialog gameId={gameId} />
        </div>
      </div>

      <SeparatorDashed />

      <div className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm')}>
        {!extra || extra.length === 0 ? (
          <div className={cn('col-span-2')}>{t('detail.overview.extraInformation.empty')}</div>
        ) : (
          extra.map((item, index) => (
            <React.Fragment key={index}>
              <div
                className={cn('whitespace-nowrap select-none cursor-pointer')}
                onClick={() => copyWithToast(item.value.join(', '))}
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
                  <span>{t('detail.overview.extraInformation.emptyValue')}</span>
                ) : (
                  item.value.map((val, i) => (
                    <div key={i} className={cn('flex items-center')}>
                      <FilterAdder field={`metadata.extra.${item.key || 'unknown'}`} value={val} />
                    </div>
                  ))
                )}
              </div>
            </React.Fragment>
          ))
        )}
      </div>

      <SearchExtraInformationDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        gameTitle={originalName}
        onSelect={handleSelectExtraInfo}
        initialExtraInfo={
          extra
            ? extra.flatMap((item) => item.value.map((val) => ({ key: item.key, value: val })))
            : []
        }
      />
    </div>
  )
}

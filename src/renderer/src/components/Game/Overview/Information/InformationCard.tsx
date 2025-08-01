import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { InformationDialog } from './InformationDialog'
import { SeparatorDashed } from '@ui/separator-dashed'

export function InformationCard({
  gameId,
  className = ''
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [name] = useGameState(gameId, 'metadata.name')
  const [developers] = useGameState(gameId, 'metadata.developers')
  const [publishers] = useGameState(gameId, 'metadata.publishers')
  const [releaseDate] = useGameState(gameId, 'metadata.releaseDate')
  const [genres] = useGameState(gameId, 'metadata.genres')
  const [platforms] = useGameState(gameId, 'metadata.platforms')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

  const handleCopySummary = (): void => {
    const fields = {
      originalName: t('detail.overview.information.fields.originalName'),
      name: t('detail.overview.information.fields.localizedName'),
      developers: t('detail.overview.information.fields.developers'),
      publishers: t('detail.overview.information.fields.publishers'),
      releaseDate: t('detail.overview.information.fields.releaseDate'),
      platforms: t('detail.overview.information.fields.platforms'),
      genres: t('detail.overview.information.fields.genres')
    }

    copyWithToast(
      Object.entries({
        originalName,
        name,
        developers,
        publishers,
        releaseDate,
        genres,
        platforms
      })
        .map(([key, value]) => `${fields[key]}: ${Array.isArray(value) ? value.join(', ') : value}`)
        .join('\n')
    )
  }

  return (
    <div className={cn(className, 'group')}>
      <div className={cn('flex flex-row justify-between items-center')}>
        <div className={cn('font-bold select-none cursor-pointer')} onClick={handleCopySummary}>
          {t('detail.overview.sections.basicInfo')}
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline] cursor-pointer'
            )}
            onClick={() => setIsEditDialogOpen(true)}
          ></span>
        </div>
      </div>

      <SeparatorDashed />

      <div className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm')}>
        {/* original name */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(originalName)}
        >
          {t('detail.overview.information.fields.originalName')}
        </div>
        <div>{originalName === '' ? t('detail.overview.information.empty') : originalName}</div>

        {/* name */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(name)}
        >
          {t('detail.overview.information.fields.localizedName')}
        </div>
        <div>
          {name === originalName || name === '' ? t('detail.overview.information.empty') : name}
        </div>

        {/* developers */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(developers.join(', '))}
        >
          {t('detail.overview.information.fields.developers')}
        </div>
        <div
          className={cn(
            'flex flex-wrap gap-x-1 gap-y-[6px]',
            developers.join(',') !== '' && 'mt-[2px]'
          )}
        >
          {developers.join(',') === ''
            ? t('detail.overview.information.empty')
            : developers.map((developer) => (
                <React.Fragment key={developer}>
                  <FilterAdder field="metadata.developers" value={developer} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* publishers */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(publishers.join(', '))}
        >
          {t('detail.overview.information.fields.publishers')}
        </div>
        <div
          className={cn(
            'flex flex-wrap gap-x-1 gap-y-1',
            publishers.join(',') !== '' && 'mt-[2px]'
          )}
        >
          {publishers.join(',') === ''
            ? t('detail.overview.information.empty')
            : publishers.map((publisher) => (
                <React.Fragment key={publisher}>
                  <FilterAdder field="metadata.publishers" value={publisher} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* releaseDate */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(releaseDate)}
        >
          {t('detail.overview.information.fields.releaseDate')}
        </div>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-1', releaseDate !== '' && 'mt-[2px]')}>
          {releaseDate === '' ? (
            t('detail.overview.information.empty')
          ) : (
            <FilterAdder
              field="metadata.releaseDate"
              className={cn('hover:no-underline')}
              value={releaseDate}
            />
          )}
        </div>

        {/* platforms */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(platforms.join(', '))}
        >
          {t('detail.overview.information.fields.platforms')}
        </div>
        <div
          className={cn('flex flex-wrap gap-x-1 gap-y-1', platforms.join(',') !== '' && 'mt-[2px]')}
        >
          {platforms.join(',') === ''
            ? t('detail.overview.information.empty')
            : platforms.map((platform) => (
                <React.Fragment key={platform}>
                  <FilterAdder field="metadata.platforms" value={platform} />
                </React.Fragment>
              ))}
        </div>

        {/* genres */}
        <div
          className={cn('select-none cursor-pointer max-w-[100px]')}
          onClick={() => copyWithToast(genres.join(', '))}
        >
          {t('detail.overview.information.fields.genres')}
        </div>
        <div
          className={cn('flex flex-wrap gap-x-1 gap-y-1', genres.join(',') !== '' && 'mt-[2px]')}
        >
          {genres.join(',') === ''
            ? t('detail.overview.information.empty')
            : genres.map((genre) => (
                <React.Fragment key={genre}>
                  <FilterAdder field="metadata.genres" value={genre} />
                </React.Fragment>
              ))}
        </div>
      </div>

      <InformationDialog
        gameId={gameId}
        isOpen={isEditDialogOpen}
        setIsOpen={setIsEditDialogOpen}
      />
    </div>
  )
}

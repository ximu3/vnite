import React from 'react'
import { useTranslation } from 'react-i18next'
import { useGameState } from '~/hooks'
import { cn, copyWithToast } from '~/utils'
import { FilterAdder } from '../../FilterAdder'
import { InformationDialog } from './InformationDialog'

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
        <InformationDialog gameId={gameId} />
      </div>

      <div className={cn('flex items-center justify-center flex-grow')}>
        <div className="w-full h-px my-3 border-t border-dashed border-primary" />
      </div>

      <div className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm')}>
        {/* original name */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(originalName)}
        >
          {t('detail.overview.information.fields.originalName')}
        </div>
        <div>{originalName === '' ? t('detail.overview.information.empty') : originalName}</div>

        {/* name */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(name)}
        >
          {t('detail.overview.information.fields.localizedName')}
        </div>
        <div>
          {name === originalName || name === '' ? t('detail.overview.information.empty') : name}
        </div>

        {/* developers */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
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
                  <FilterAdder filed="metadata.developers" value={developer} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* publishers */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
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
                  <FilterAdder filed="metadata.publishers" value={publisher} className={cn('')} />
                </React.Fragment>
              ))}
        </div>

        {/* releaseDate */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
          onClick={() => copyWithToast(releaseDate)}
        >
          {t('detail.overview.information.fields.releaseDate')}
        </div>
        <div className={cn('flex flex-wrap gap-x-1 gap-y-1', releaseDate !== '' && 'mt-[2px]')}>
          {releaseDate === '' ? (
            t('detail.overview.information.empty')
          ) : (
            <FilterAdder
              filed="metadata.releaseDate"
              className={cn('hover:no-underline')}
              value={releaseDate}
            />
          )}
        </div>

        {/* platforms */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
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
                  <FilterAdder filed="metadata.platforms" value={platform} />
                </React.Fragment>
              ))}
        </div>

        {/* genres */}
        <div
          className={cn('whitespace-nowrap select-none cursor-pointer')}
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
                  <FilterAdder filed="metadata.genres" value={genre} />
                </React.Fragment>
              ))}
        </div>
      </div>
    </div>
  )
}

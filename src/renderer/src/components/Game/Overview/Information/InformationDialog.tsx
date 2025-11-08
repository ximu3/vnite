import { ArrayInput } from '@ui/array-input'
import { DateTimeInput } from '@ui/date-input'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'

export function InformationDialog({
  gameId,
  isOpen,
  setIsOpen
}: {
  gameId: string
  isOpen: boolean
  setIsOpen: (isOpen: boolean) => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [originalName, setOriginalName, saveOriginalName] = useGameState(
    gameId,
    'metadata.originalName',
    true
  )
  const [sortName, setSortName, saveSortName] = useGameState(gameId, 'metadata.sortName', true)
  const [name, setName, saveName] = useGameState(gameId, 'metadata.name', true)
  const [developers, setDevelopers, saveDevelopers] = useGameState(
    gameId,
    'metadata.developers',
    true
  )
  const [publishers, setPublishers, savePublishers] = useGameState(
    gameId,
    'metadata.publishers',
    true
  )
  const [releaseDate, setReleaseDate, saveReleaseDate] = useGameState(
    gameId,
    'metadata.releaseDate',
    true
  )
  const [genres, setGenres, saveGenres] = useGameState(gameId, 'metadata.genres', true)
  const [platforms, setPlatforms, savePlatforms] = useGameState(gameId, 'metadata.platforms', true)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="w-[500px] p-3">
        <div
          className={cn(
            'grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 py-1 pr-2 items-center text-sm overflow-auto scrollbar-base-thin max-h-[70vh]'
          )}
        >
          {/* Original Name */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.originalName')}
          </div>
          <Input
            value={originalName}
            onChange={(e) => setOriginalName(e.target.value)}
            onBlur={saveOriginalName}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          {/* Localized Name */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.localizedName')}
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          {/* Sort Name */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.sortName')}
          </div>
          <Input
            value={sortName}
            onChange={(e) => setSortName(e.target.value)}
            onBlur={saveSortName}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          {/* Developers */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.developers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={developers}
                onChange={setDevelopers}
                onBlur={saveDevelopers}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.developers')}
              </div>
            </TooltipContent>
          </Tooltip>
          {/* Publishers */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.publishers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={publishers}
                onChange={setPublishers}
                onBlur={savePublishers}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.publishers')}
              </div>
            </TooltipContent>
          </Tooltip>
          {/* Release Date */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.releaseDate')}
          </div>
          <DateTimeInput
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            onBlur={saveReleaseDate}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          {/* Platforms */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.platforms')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={platforms}
                onChange={setPlatforms}
                onBlur={savePlatforms}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.platforms')}
              </div>
            </TooltipContent>
          </Tooltip>
          {/* Genres */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.genres')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={genres}
                onChange={setGenres}
                onBlur={saveGenres}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('detail.overview.information.hints.genres')}</div>
            </TooltipContent>
          </Tooltip>
        </div>
      </DialogContent>
    </Dialog>
  )
}

import { useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { ArrayInput } from '@ui/array-input'
import { DateTimeInput } from '@ui/date-input'
import { Dialog, DialogContent } from '@ui/dialog'
import { Input } from '@ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
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
  const activeFieldRef = useRef<
    | 'originalName'
    | 'name'
    | 'sortName'
    | 'developers'
    | 'publishers'
    | 'releaseDate'
    | 'platforms'
    | 'genres'
    | null
  >(null)

  async function handleOpenChange(open: boolean): Promise<void> {
    if (!open && activeFieldRef.current) {
      // Save the active field before closing, as clicking outside the dialog may
      // close it before the input's onBlur handler can persist the latest change.
      switch (activeFieldRef.current) {
        case 'originalName':
          await saveOriginalName()
          break
        case 'name':
          await saveName()
          break
        case 'sortName':
          await saveSortName()
          break
        case 'developers':
          await saveDevelopers()
          break
        case 'publishers':
          await savePublishers()
          break
        case 'releaseDate':
          await saveReleaseDate()
          break
        case 'platforms':
          await savePlatforms()
          break
        case 'genres':
          await saveGenres()
          break
      }
    }
    setIsOpen(open)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
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
            onChange={(e) => {
              activeFieldRef.current = 'originalName'
              setOriginalName(e.target.value)
            }}
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
            onChange={(e) => {
              activeFieldRef.current = 'name'
              setName(e.target.value)
            }}
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
            onChange={(e) => {
              activeFieldRef.current = 'sortName'
              setSortName(e.target.value)
            }}
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
                onChange={(value) => {
                  activeFieldRef.current = 'developers'
                  setDevelopers(value)
                }}
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
                onChange={(value) => {
                  activeFieldRef.current = 'publishers'
                  setPublishers(value)
                }}
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
            onChange={(e) => {
              activeFieldRef.current = 'releaseDate'
              setReleaseDate(e.target.value)
            }}
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
                onChange={(value) => {
                  activeFieldRef.current = 'platforms'
                  setPlatforms(value)
                }}
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
                onChange={(value) => {
                  activeFieldRef.current = 'genres'
                  setGenres(value)
                }}
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

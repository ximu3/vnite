import { useTranslation } from 'react-i18next'
import { ArrayInput } from '@ui/array-input'
import { DateInput } from '@ui/date-input'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useGameState } from '~/hooks'
import { cn } from '~/utils'

export function InformationDialog({ gameId }: { gameId: string }): JSX.Element {
  const { t } = useTranslation('game')
  const [originalName, setOriginalName] = useGameState(gameId, 'metadata.originalName')
  const [name, setName] = useGameState(gameId, 'metadata.name')
  const [developers, setDevelopers] = useGameState(gameId, 'metadata.developers')
  const [publishers, setPublishers] = useGameState(gameId, 'metadata.publishers')
  const [releaseDate, setReleaseDate] = useGameState(gameId, 'metadata.releaseDate')
  const [genres, setGenres] = useGameState(gameId, 'metadata.genres')
  const [platforms, setPlatforms] = useGameState(gameId, 'metadata.platforms')

  return (
    <Dialog>
      <DialogTrigger>
        <span
          className={cn('invisible group-hover:visible w-5 h-5 icon-[mdi--square-edit-outline]')}
        ></span>
      </DialogTrigger>
      <DialogContent>
        <div
          className={cn('grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 py-5 items-center text-sm')}
        >
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.originalName')}
          </div>
          <Input
            value={originalName}
            onChange={(e) => setOriginalName(e.target.value)}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.localizedName')}
          </div>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.developers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={developers}
                onChange={setDevelopers}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.developers')}
              </div>
            </TooltipContent>
          </Tooltip>
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.publishers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={publishers}
                onChange={setPublishers}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.publishers')}
              </div>
            </TooltipContent>
          </Tooltip>
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.releaseDate')}
          </div>
          <DateInput
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            placeholder={t('detail.overview.information.empty')}
            className={cn('text-sm')}
          />
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.platforms')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={platforms}
                onChange={setPlatforms}
                placeholder={t('detail.overview.information.empty')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>
                {t('detail.overview.information.hints.platforms')}
              </div>
            </TooltipContent>
          </Tooltip>
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('detail.overview.information.fields.genres')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={genres}
                onChange={setGenres}
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

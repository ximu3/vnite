import { Dialog, DialogContent, DialogTrigger } from '~/components/ui/dialog'
import { TooltipContent, TooltipTrigger, Tooltip } from '~/components/ui/tooltip'
import { ArrayInput } from '@ui/array-input'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils'
import { useGameState } from '~/hooks'
import { useState } from 'react'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'

export function InformationDialog({
  gameIds,
  isOpen,
  setIsOpen,
  children
}: {
  gameIds: string[]
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  children?: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [isIncremental, setIsIncremental] = useState(true)
  const [developers, setDevelopers] = useState<string[]>([])
  const [publishers, setPublishers] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])

  const gameStates = gameIds.map((gameId) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    developers: useGameState(gameId, 'metadata.developers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    publishers: useGameState(gameId, 'metadata.publishers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    genres: useGameState(gameId, 'metadata.genres'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    platforms: useGameState(gameId, 'metadata.platforms')
  }))

  const handleConfirm = async (): Promise<void> => {
    try {
      gameStates.forEach(
        ({
          developers: [currentDevelopers, setGameDevelopers],
          publishers: [currentPublishers, setGamePublishers],
          genres: [currentGenres, setGameGenres],
          platforms: [currentPlatforms, setGamePlatforms]
        }) => {
          if (developers.length > 0) {
            setGameDevelopers(
              isIncremental ? [...new Set([...currentDevelopers, ...developers])] : developers
            )
          }
          if (publishers.length > 0) {
            setGamePublishers(
              isIncremental ? [...new Set([...currentPublishers, ...publishers])] : publishers
            )
          }
          if (genres.length > 0) {
            setGameGenres(isIncremental ? [...new Set([...currentGenres, ...genres])] : genres)
          }
          if (platforms.length > 0) {
            setGamePlatforms(
              isIncremental ? [...new Set([...currentPlatforms, ...platforms])] : platforms
            )
          }
        }
      )

      setIsOpen(false)
      setDevelopers([])
      setPublishers([])
      setGenres([])
      setPlatforms([])

      toast.success(t('batchEditor.information.success'))
    } catch (error) {
      console.error('Failed to update games:', error)
      if (error instanceof Error) {
        toast.error(t('batchEditor.information.error', { message: error.message }))
      } else {
        toast.error(t('batchEditor.information.error', { message: 'An unknown error occurred' }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>}
      <DialogContent className="w-[500px]">
        <div
          className={cn('grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 pt-5 items-center text-sm')}
        >
          {/* Incremental Mode */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.incrementalMode')}
          </div>
          <div>
            <Switch checked={isIncremental} onCheckedChange={setIsIncremental} />
          </div>
          {/* Developers */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.developers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={developers}
                onChange={setDevelopers}
                placeholder={t('batchEditor.information.placeholder.developers')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('batchEditor.information.tooltip.developers')}</div>
            </TooltipContent>
          </Tooltip>
          {/* Publishers */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.publishers')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={publishers}
                onChange={setPublishers}
                placeholder={t('batchEditor.information.placeholder.publishers')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('batchEditor.information.tooltip.publishers')}</div>
            </TooltipContent>
          </Tooltip>
          {/* Platforms */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.platforms')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={platforms}
                onChange={setPlatforms}
                placeholder={t('batchEditor.information.placeholder.platforms')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('batchEditor.information.tooltip.platforms')}</div>
            </TooltipContent>
          </Tooltip>
          {/* Genres */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.genres')}
          </div>
          <Tooltip>
            <TooltipTrigger className={cn('p-0 max-w-none m-0 w-full')}>
              <ArrayInput
                value={genres}
                onChange={setGenres}
                placeholder={t('batchEditor.information.placeholder.genres')}
              />
            </TooltipTrigger>
            <TooltipContent side="right">
              <div className={cn('text-xs')}>{t('batchEditor.information.tooltip.genres')}</div>
            </TooltipContent>
          </Tooltip>
          {/* Confirm Button */}
          <div className={cn('col-span-2 flex justify-end mt-2')}>
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

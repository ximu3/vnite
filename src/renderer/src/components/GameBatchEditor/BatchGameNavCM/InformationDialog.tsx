import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/models'
import { ArrayInput } from '@ui/array-input'
import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { Input } from '@ui/input'
import { Switch } from '@ui/switch'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { getAllExtraKeys } from '~/stores/game'
import { cn } from '~/utils'

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
  const [extraKey, setExtraKey] = useState('')
  const [extraValue, setExtraValue] = useState<string[]>([])

  const gameStates = gameIds.map((gameId) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    developers: useGameState(gameId, 'metadata.developers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    publishers: useGameState(gameId, 'metadata.publishers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    genres: useGameState(gameId, 'metadata.genres'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    platforms: useGameState(gameId, 'metadata.platforms'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    extra: useGameState(gameId, 'metadata.extra')
  }))

  const extraKeyForSelect = Array.from(
    new Set([
      ...METADATA_EXTRA_PREDEFINED_KEYS.map((key) =>
        t(`detail.overview.extraInformation.fields.${key}`, key)
      ),
      ...getAllExtraKeys().sort((a, b) => a.localeCompare(b))
    ])
  )

  function sanitizeArray(list: string[]): string[] {
    // The list may contain empty strings, either from legacy/incorrect data
    // or from user input in ArrayInput (e.g., trailing commas).
    // We sanitize the value here to remove empty strings and maintain consistent metadata.
    return list.map((s) => s.trim()).filter((s) => s.length > 0)
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      gameStates.forEach(
        ({
          developers: [currentDevelopers, setGameDevelopers],
          publishers: [currentPublishers, setGamePublishers],
          genres: [currentGenres, setGameGenres],
          platforms: [currentPlatforms, setGamePlatforms],
          extra: [currentExtra, setGameExtra]
        }) => {
          if (developers.length > 0) {
            setGameDevelopers(
              sanitizeArray(
                isIncremental ? [...new Set([...currentDevelopers, ...developers])] : developers
              )
            )
          }
          if (publishers.length > 0) {
            setGamePublishers(
              sanitizeArray(
                isIncremental ? [...new Set([...currentPublishers, ...publishers])] : publishers
              )
            )
          }
          if (genres.length > 0) {
            setGameGenres(
              sanitizeArray(isIncremental ? [...new Set([...currentGenres, ...genres])] : genres)
            )
          }
          if (platforms.length > 0) {
            setGamePlatforms(
              sanitizeArray(
                isIncremental ? [...new Set([...currentPlatforms, ...platforms])] : platforms
              )
            )
          }
          if (extraKey.trim() !== '' && extraValue.length > 0) {
            const newGameExtra = currentExtra.map((item) => ({
              key: item.key,
              value: [...item.value]
            }))

            const existingItem = newGameExtra.find((item) => item.key === extraKey)
            if (existingItem) {
              existingItem.value = sanitizeArray(
                isIncremental ? [...new Set([...existingItem.value, ...extraValue])] : extraValue
              )
            } else {
              newGameExtra.push({ key: extraKey, value: sanitizeArray(extraValue) })
            }

            setGameExtra(newGameExtra)
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
          <ArrayInput
            value={developers}
            onChange={setDevelopers}
            placeholder={t('batchEditor.information.placeholder.developers')}
            tooltipText={t('batchEditor.information.tooltip.developers')}
          />
          {/* Publishers */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.publishers')}
          </div>
          <ArrayInput
            value={publishers}
            onChange={setPublishers}
            placeholder={t('batchEditor.information.placeholder.publishers')}
            tooltipText={t('batchEditor.information.tooltip.publishers')}
          />
          {/* Platforms */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.platforms')}
          </div>
          <ArrayInput
            value={platforms}
            onChange={setPlatforms}
            placeholder={t('batchEditor.information.placeholder.platforms')}
            tooltipText={t('batchEditor.information.tooltip.platforms')}
          />
          {/* Genres */}
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.genres')}
          </div>
          <ArrayInput
            value={genres}
            onChange={setGenres}
            placeholder={t('batchEditor.information.placeholder.genres')}
            tooltipText={t('batchEditor.information.tooltip.genres')}
          />
          {/* Extra information */}
          <div className="col-span-2 flex gap-1 items-center mt-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className={cn('flex-shrink-0')}>
                  <span className={cn('icon-[mdi--lightning-bolt] w-4 h-4')}></span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="bottom" align="start">
                <div className={cn('max-h-[288px] overflow-auto scrollbar-base-thin')}>
                  {extraKeyForSelect.map((key) => (
                    <DropdownMenuItem key={key} onClick={() => setExtraKey(key)}>
                      {key}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger>
                <Input
                  value={extraKey}
                  onChange={(e) => setExtraKey(e.target.value)}
                  placeholder={t('detail.overview.extraInformation.enterKey')}
                  className={cn('w-30')}
                />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <div className="text-xs">{t('batchEditor.information.tooltip.extraKey')}</div>
              </TooltipContent>
            </Tooltip>
            <ArrayInput
              value={extraValue}
              onChange={(value) => setExtraValue(value)}
              placeholder={t('detail.overview.extraInformation.enterValue')}
              tooltipText={t('detail.overview.extraInformation.valueTip')}
            />
          </div>
          {/* Confirm Button */}
          <div className={cn('col-span-2 flex justify-end mt-2')}>
            <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

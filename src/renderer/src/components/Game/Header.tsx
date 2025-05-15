import { Button } from '@ui/button'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import { Input } from '@ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger
} from '@ui/select'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { cn, copyWithToast } from '~/utils'
import { Config } from './Config'
import { Record } from './Overview/Record'
import { StartGame } from './StartGame'
import { StopGame } from './StopGame'

export function Header({ gameId, className }: { gameId: string; className?: string }): JSX.Element {
  const { t } = useTranslation('game')
  const runningGames = useRunningGames((state) => state.runningGames)
  const [name] = useGameState(gameId, 'metadata.name')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [showOriginalNameInGameHeader] = useConfigState('game.gameHeader.showOriginalName')
  const [playStatus, setPlayStatus] = useGameState(gameId, 'record.playStatus')
  const [score, setScore] = useGameState(gameId, 'record.score')
  const [preScore, setPreScore] = useState(score === -1 ? '' : score.toString())
  const resetPreScore = (): void => setPreScore(score === -1 ? '' : score.toString())
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false)
  const [selectedGroup, _setSelectedGroup] = useConfigState('game.gameList.selectedGroup')
  const { refreshGameList } = useLibrarybarStore.getState()

  const changePlayStatus = (value: typeof playStatus): void => {
    setPlayStatus(value)
    if (selectedGroup === 'record.playStatus') {
      refreshGameList()
    }
  }

  // Score submission handler function
  function confirmScore(): void {
    if (preScore === '') {
      setScore(-1)
      setIsScoreDialogOpen(false)
      toast.success(t('detail.header.rating.cleared'))
      return
    }

    const scoreNum = parseFloat(preScore)

    if (isNaN(scoreNum)) {
      toast.error(t('detail.header.rating.errors.invalidNumber'))
      resetPreScore()
      return
    }

    if (scoreNum < 0) {
      toast.error(t('detail.header.rating.errors.negative'))
      resetPreScore()
      return
    }

    if (scoreNum > 10) {
      toast.error(t('detail.header.rating.errors.tooHigh'))
      resetPreScore()
      return
    }

    const formattedScore = scoreNum.toFixed(1)

    if (preScore !== formattedScore && !Number.isInteger(scoreNum)) {
      toast.warning(t('detail.header.rating.warning'))
    }

    setScore(Number(formattedScore))
    setPreScore(Number(formattedScore).toString())
    setIsScoreDialogOpen(false)
    toast.success(t('detail.header.rating.success'))
  }

  return (
    <div className={cn('flex-col flex gap-5 px-7 py-5 relative', className)}>
      {/* Game name section */}
      <div className={cn('flex flex-col gap-3 grow overflow-hidden items-start justify-center')}>
        <div
          className={cn('font-bold text-2xl text-accent-foreground cursor-pointer')}
          onClick={() => copyWithToast(name)}
        >
          {name}
        </div>
        {showOriginalNameInGameHeader && originalName && originalName !== name && (
          <div
            className={cn('font-bold text-accent-foreground cursor-pointer')}
            onClick={() => copyWithToast(originalName)}
          >
            {originalName}
          </div>
        )}
      </div>

      <div
        className={cn(
          'flex flex-row justify-between items-end duration-300 select-none mb-3',
          '3xl:gap-5'
        )}
      >
        {/* Game records and action buttons */}
        <Record gameId={gameId} />

        <div className={cn('flex flex-row gap-3 items-end z-20', '3xl:gap-5')}>
          {/* Start/Stop game button */}
          {runningGames.includes(gameId) ? (
            <StopGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
          ) : (
            <StartGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
          )}

          {/* Game status selection */}
          <Select value={playStatus} onValueChange={changePlayStatus}>
            <SelectTrigger noIcon className={cn('p-0 h-auto w-auto border-0 shadow-none')}>
              <Tooltip>
                <TooltipTrigger>
                  <Button variant="outline" size={'icon'} className={cn('h-[40px] w-[40px]')}>
                    <span className={cn('icon-[mdi--bookmark-outline] w-4 h-4')}></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {t('detail.header.playStatus.tooltip')}
                </TooltipContent>
              </Tooltip>
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>{t('detail.header.playStatus.label')}</SelectLabel>
                <SelectItem value="unplayed">{t('utils:game.playStatus.unplayed')}</SelectItem>
                <SelectItem value="playing">{t('utils:game.playStatus.playing')}</SelectItem>
                <SelectItem value="finished">{t('utils:game.playStatus.finished')}</SelectItem>
                <SelectItem value="multiple">{t('utils:game.playStatus.multiple')}</SelectItem>
                <SelectItem value="shelved">{t('utils:game.playStatus.shelved')}</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          {/* Rating dialog */}
          <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
            <DialogTrigger asChild>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    variant="outline"
                    size={'icon'}
                    className="non-draggable w-[40px] h-[40px]"
                    onClick={() => {
                      resetPreScore()
                      setIsScoreDialogOpen(true)
                    }}
                  >
                    <span className={cn('icon-[mdi--starburst-edit-outline] w-4 h-4')}></span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{t('detail.header.rating.tooltip')}</TooltipContent>
              </Tooltip>
            </DialogTrigger>
            <DialogContent showCloseButton={false} className="w-[500px]">
              <div className={cn('flex flex-row gap-3 items-center justify-center')}>
                <div className={cn('whitespace-nowrap')}>{t('detail.header.rating.title')}</div>
                <Input
                  value={preScore}
                  onChange={(e) => setPreScore(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') confirmScore()
                  }}
                />
                <Button onClick={confirmScore}>{t('utils:common.confirm')}</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Configuration button */}
          <Config gameId={gameId} />
        </div>
      </div>
    </div>
  )
}

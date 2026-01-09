import { NSFWBlurLevel } from '@appTypes/models'
import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger
} from '~/components/ui/context-menu'
import { useConfigState, useGameState } from '~/hooks'
import { useRunningGames } from '~/pages/Library/store'
import { cn, copyWithToast } from '~/utils'
import { GameImage } from '../ui/game-image'
import { Config } from './Config'
import { StartGame } from './StartGame'
import { StopGame } from './StopGame'
import { useGameDetailStore } from './store'

export function HeaderCompact({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const runningGames = useRunningGames((state) => state.runningGames)
  const { t } = useTranslation('game')
  const [lastRunDate] = useGameState(gameId, 'record.lastRunDate')
  const [score] = useGameState(gameId, 'record.score')
  const [playingTime] = useGameState(gameId, 'record.playTime')
  const [playStatus] = useGameState(gameId, 'record.playStatus')
  const [name] = useGameState(gameId, 'metadata.name')
  const [showCover] = useConfigState('appearances.gameDetail.showCover')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')

  const openPropertiesDialog = useGameDetailStore((state) => state.openPropertiesDialog)

  const stringToBase64 = (str: string): string =>
    btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  const obfuscatedName = stringToBase64(name).slice(0, name.length)

  return (
    <div className={cn('flex-col flex gap-5 px-7 py-5 pl-6 pt-6 relative mb-5', className)}>
      <div className="flex flex-row gap-1 h-[200px] justify-between items-start">
        {/* Game cover image */}
        {showCover && (
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="relative mr-3 pb-1 h-[200px] shrink-0">
                <GameImage
                  gameId={gameId}
                  key={`${gameId}-poster`}
                  type="cover"
                  blur={nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage}
                  className={cn('w-auto h-full object-cover rounded-lg shadow-md')}
                  fallback={<div className="h-[170px]" />}
                />
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className={cn('w-40')}>
              <ContextMenuItem onSelect={() => openPropertiesDialog('media')}>
                {t('detail.contextMenu.editMediaProperties')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        )}

        {/* Main Content */}
        <div className="flex flex-col gap-3 grow overflow-hidden items-start justify-between h-full">
          {/* Top Area: Game Name */}
          <div className="flex flex-col gap-3">
            <div
              className={cn(
                'font-bold text-2xl text-accent-foreground cursor-pointer select-none text-shadow-lg break-all group'
              )}
              onClick={() => copyWithToast(name)}
            >
              {nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImageAndTitle ? (
                <>
                  <span className="block group-hover:hidden">{obfuscatedName}</span>
                  <span className="hidden group-hover:block">{name}</span>
                </>
              ) : (
                name
              )}
            </div>
          </div>

          {/* Middle Area: Game Information */}
          <div className={cn('grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-xs')}>
            {/* Play Time */}
            <div className={cn('select-none cursor-pointer flex items-center gap-1')}>
              <span className="icon-[mdi--timer-outline]"></span>
              {t('detail.overview.record.playTime')}
            </div>
            <div>
              {playingTime !== 0
                ? t('{{date, gameTime}}', { date: playingTime })
                : t('detail.overview.information.empty')}
            </div>

            {/* Play Status */}
            <div className={cn('select-none cursor-pointer flex items-center gap-1')}>
              <span className="icon-[mdi--bookmark-outline]"></span>
              {t('detail.overview.record.playStatus')}
            </div>
            <div>{t(`utils:game.playStatus.${playStatus}`)}</div>

            {/* Score */}
            <div className={cn('select-none cursor-pointer flex items-center gap-1')}>
              <span className="icon-[mdi--starburst-outline]"></span>
              {t('detail.overview.record.rating')}
            </div>
            <div>{score === -1 ? t('detail.overview.information.empty') : score.toFixed(1)}</div>

            {/* Last Run Date */}
            <div className={cn('select-none cursor-pointer flex items-center gap-1')}>
              <span className="icon-[mdi--calendar-blank-multiple]"></span>
              {t('detail.overview.record.lastRunDate')}
            </div>
            <div>
              {lastRunDate
                ? t('{{date, niceDate}}', { date: lastRunDate })
                : t('detail.overview.record.neverRun')}
            </div>
          </div>

          {/* Bottom Area: Button Section */}
          <div
            className={cn(
              'flex flex-row justify-between items-end duration-300 select-none pb-1 w-full'
            )}
          >
            <div className={cn('flex flex-row gap-3 items-end z-20')}>
              {/* Start/Stop game button */}
              {runningGames.includes(gameId) ? (
                <StopGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
              ) : (
                <StartGame gameId={gameId} className={cn('w-[170px] h-[40px]')} />
              )}

              {/* Configuration button */}
              <Config gameId={gameId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

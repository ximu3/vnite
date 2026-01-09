import { NSFWBlurLevel } from '@appTypes/models'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
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
import { ImageViewerDialog } from './Config/Properties/Media/ImageViewerDialog'
import { Record } from './Overview/Record'
import { StartGame } from './StartGame'
import { StopGame } from './StopGame'
import { useGameDetailStore } from './store'

export function Header({
  gameId,
  className
}: {
  gameId: string
  className?: string
}): React.JSX.Element {
  const runningGames = useRunningGames((state) => state.runningGames)
  const [name] = useGameState(gameId, 'metadata.name')
  const [originalName] = useGameState(gameId, 'metadata.originalName')
  const [showOriginalNameInGameHeader] = useConfigState('game.gameHeader.showOriginalName')
  const [showCover] = useConfigState('appearances.gameDetail.showCover')
  const [nsfw] = useGameState(gameId, 'apperance.nsfw')
  const [nsfwBlurLevel] = useConfigState('appearances.nsfwBlurLevel')

  const openPropertiesDialog = useGameDetailStore((state) => state.openPropertiesDialog)

  const stringToBase64 = (str: string): string =>
    btoa(String.fromCharCode(...new TextEncoder().encode(str)))
  const obfuscatedName = stringToBase64(name).slice(0, name.length)

  const { t } = useTranslation('game')

  const [isImageViewerOpen, setIsImageViewerOpen] = React.useState(false)
  const [imageViewerPath, setImageViewerPath] = React.useState<string | null>(null)

  async function openLargeCover(): Promise<void> {
    try {
      const currentPath = await ipcManager.invoke('game:get-media-path', gameId, 'cover')
      if (!currentPath) {
        toast.error(t('detail.properties.media.notifications.imageNotFound'))
        return
      }
      setImageViewerPath(currentPath)
      setIsImageViewerOpen(true)
    } catch (error) {
      toast.error(t('detail.properties.media.notifications.getImageError', { error }))
    }
  }

  return (
    <>
      <div className={cn('flex-col flex gap-5 px-7 py-5 pl-6 pt-6 relative', className)}>
        {/* Game name section */}
        <div className="flex flex-row justify-between items-end">
          <div
            className={cn(
              'flex flex-col gap-3 grow overflow-hidden items-start justify-start pl-1'
            )}
          >
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
            {showOriginalNameInGameHeader && originalName && (
              <div
                className={cn(
                  'font-bold text-accent-foreground cursor-pointer select-none break-all group'
                )}
                onClick={() => copyWithToast(originalName)}
              >
                {nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImageAndTitle ? (
                  <>
                    <span className="block group-hover:hidden">{obfuscatedName}</span>
                    <span className="hidden group-hover:block">{originalName}</span>
                  </>
                ) : (
                  originalName
                )}
              </div>
            )}
            <div
              className={cn(
                'flex flex-row justify-between items-end duration-300 select-none mt-2 pb-1',
                '3xl:gap-5'
              )}
            >
              <div className={cn('flex flex-row gap-3 items-end z-20', '3xl:gap-5')}>
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
          {/* Game cover image with context menu */}
          <ContextMenu>
            <ContextMenuTrigger asChild>
              <div className="relative lg:mr-3 pb-1 shrink-0">
                {showCover && (
                  <GameImage
                    gameId={gameId}
                    key={`${gameId}-poster`}
                    type="cover"
                    blur={nsfw && nsfwBlurLevel >= NSFWBlurLevel.BlurImage}
                    className={cn('w-auto h-[170px] object-cover rounded-lg shadow-md')}
                    fallback={<div className="h-[170px]" />}
                  />
                )}
              </div>
            </ContextMenuTrigger>
            <ContextMenuContent className={cn('w-40')}>
              <ContextMenuItem onSelect={() => openPropertiesDialog('media')}>
                {t('detail.contextMenu.editMediaProperties')}
              </ContextMenuItem>
              <ContextMenuItem
                onSelect={() => {
                  void openLargeCover()
                }}
              >
                {t('detail.properties.media.actions.viewLargeImage')}
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        {/* Game record section */}
        <div className="pt-6">
          <Record gameId={gameId} />
        </div>
      </div>

      {isImageViewerOpen && (
        <ImageViewerDialog
          isOpen={isImageViewerOpen}
          imagePath={imageViewerPath}
          onClose={() => setIsImageViewerOpen(false)}
        />
      )}
    </>
  )
}

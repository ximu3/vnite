import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '~/components/ui/context-menu'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DeleteGameAlert } from '~/components/Game/Config/ManageMenu/DeleteGameAlert'
import { useGameLocalState, useGameState, useConfigState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import { ipcManager } from '~/app/ipc'
import { useState } from 'react'
import { Dialog, DialogContent } from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils'

export function ManageMenu({
  gameId,
  openNameEditorDialog,
  openPlayingTimeEditorDialog
}: {
  gameId: string
  openNameEditorDialog: () => void
  openPlayingTimeEditorDialog: () => void
}): React.JSX.Element {
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw, setNsfw] = useGameState(gameId, 'apperance.nsfw')
  const [playStatus, setPlayStatus] = useGameState(gameId, 'record.playStatus')
  const [score, setScore] = useGameState(gameId, 'record.score')
  const [preScore, setPreScore] = useState(score === -1 ? '' : score.toString())
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false)
  const { refreshGameList } = useLibrarybarStore.getState()
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)
  const { t } = useTranslation('game')

  const resetPreScore = (): void => setPreScore(score === -1 ? '' : score.toString())

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
    <>
      <ContextMenuGroup>
        <ContextMenuSub>
          <ContextMenuSubTrigger>{t('detail.manage.title')}</ContextMenuSubTrigger>
          <ContextMenuPortal>
            <ContextMenuSubContent>
              <ContextMenuItem onSelect={openNameEditorDialog}>
                {t('detail.manage.rename')}
              </ContextMenuItem>
              <ContextMenuItem onClick={openPlayingTimeEditorDialog}>
                {t('detail.manage.editPlayTime')}
              </ContextMenuItem>
              <ContextMenuSeparator />

              {/* Game status selection submenu */}
              <ContextMenuSub>
                <ContextMenuSubTrigger>{t('detail.header.playStatus.label')}</ContextMenuSubTrigger>
                <ContextMenuPortal>
                  <ContextMenuSubContent>
                    <ContextMenuItem
                      onClick={() => changePlayStatus('unplayed')}
                      className={playStatus === 'unplayed' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.unplayed')}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => changePlayStatus('playing')}
                      className={playStatus === 'playing' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.playing')}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => changePlayStatus('finished')}
                      className={playStatus === 'finished' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.finished')}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => changePlayStatus('multiple')}
                      className={playStatus === 'multiple' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.multiple')}
                    </ContextMenuItem>
                    <ContextMenuItem
                      onClick={() => changePlayStatus('shelved')}
                      className={playStatus === 'shelved' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.shelved')}
                    </ContextMenuItem>
                  </ContextMenuSubContent>
                </ContextMenuPortal>
              </ContextMenuSub>

              {/* Rating menu item */}
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  resetPreScore()
                  setIsScoreDialogOpen(true)
                }}
              >
                {t('detail.header.rating.tooltip')}
              </ContextMenuItem>

              <ContextMenuSeparator />
              <ContextMenuItem onClick={() => setNsfw(!nsfw)}>
                {nsfw ? t('detail.manage.unmarkNSFW') : t('detail.manage.markNSFW')}
              </ContextMenuItem>
              <ContextMenuItem
                onClick={() => {
                  setDbId(gameId)
                  setName(gameName)
                  setIsOpen(true)
                }}
              >
                {t('detail.manage.downloadMetadata')}
              </ContextMenuItem>
              {gamePath !== '' && (
                <ContextMenuItem
                  onClick={async () => {
                    try {
                      const targetPath = await ipcManager.invoke('system:select-path-dialog', [
                        'openDirectory'
                      ])
                      if (!targetPath) {
                        return
                      }
                      await ipcManager.invoke('utils:create-game-shortcut', gameId, targetPath)
                      toast.success(t('detail.manage.notifications.shortcutCreated'))
                    } catch (_error) {
                      toast.error(t('detail.manage.notifications.shortcutError'))
                    }
                  }}
                >
                  {t('detail.manage.createShortcut')}
                </ContextMenuItem>
              )}
              {/* <ContextMenuSeparator /> */}
              <ContextMenuItem
                onClick={() => {
                  if (gamePath) {
                    ipcManager.invoke('system:open-path-in-explorer', gamePath)
                  } else {
                    toast.warning(t('detail.manage.notifications.gamePathNotSet'))
                  }
                }}
              >
                {t('detail.manage.browseLocalFiles')}
              </ContextMenuItem>
              <ContextMenuSeparator />
              <DeleteGameAlert gameId={gameId}>
                <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                  {t('detail.manage.delete')}
                </ContextMenuItem>
              </DeleteGameAlert>
            </ContextMenuSubContent>
          </ContextMenuPortal>
        </ContextMenuSub>
      </ContextMenuGroup>

      {/* Rating dialog */}
      <Dialog open={isScoreDialogOpen} onOpenChange={setIsScoreDialogOpen}>
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
    </>
  )
}

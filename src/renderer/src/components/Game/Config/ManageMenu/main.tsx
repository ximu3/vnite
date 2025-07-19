import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '~/components/ui/dropdown-menu'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameLocalState, useGameState, useConfigState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useGameDetailStore } from '../../store'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import { DeleteGameAlert } from './DeleteGameAlert'
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
  const { t } = useTranslation('game')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [markPath] = useGameLocalState(gameId, 'utils.markPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw, setNsfw] = useGameState(gameId, 'apperance.nsfw')
  const [playStatus, setPlayStatus] = useGameState(gameId, 'record.playStatus')
  const [score, setScore] = useGameState(gameId, 'record.score')
  const [preScore, setPreScore] = useState(score === -1 ? '' : score.toString())
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [isScoreDialogOpen, setIsScoreDialogOpen] = useState(false)
  const { refreshGameList } = useLibrarybarStore.getState()
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)

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
      <DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('detail.manage.title')}</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="">
              <DropdownMenuItem onSelect={openNameEditorDialog}>
                {t('detail.manage.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setIsEditingLogo(true)
                }}
              >
                {t('detail.manage.editLogo')}
              </DropdownMenuItem>

              <DropdownMenuItem onClick={openPlayingTimeEditorDialog}>
                {t('detail.manage.editPlayTime')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Game status selection submenu */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  {t('detail.header.playStatus.label')}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={() => changePlayStatus('unplayed')}
                      className={playStatus === 'unplayed' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.unplayed')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => changePlayStatus('playing')}
                      className={playStatus === 'playing' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.playing')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => changePlayStatus('finished')}
                      className={playStatus === 'finished' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.finished')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => changePlayStatus('multiple')}
                      className={playStatus === 'multiple' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.multiple')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => changePlayStatus('shelved')}
                      className={playStatus === 'shelved' ? 'bg-accent' : ''}
                    >
                      {t('utils:game.playStatus.shelved')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              {/* Rating menu item */}
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  resetPreScore()
                  setIsScoreDialogOpen(true)
                }}
              >
                {t('detail.header.rating.tooltip')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={() => setNsfw(!nsfw)}>
                {nsfw ? t('detail.manage.unmarkNSFW') : t('detail.manage.markNSFW')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  setDbId(gameId)
                  setName(gameName)
                  setIsOpen(true)
                }}
              >
                {t('detail.manage.downloadMetadata')}
              </DropdownMenuItem>
              {gamePath !== '' && (
                <DropdownMenuItem
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
                </DropdownMenuItem>
              )}
              {/* <DropdownMenuSeparator /> */}
              <DropdownMenuItem
                onClick={() => {
                  if (!gamePath && !markPath) {
                    toast.warning(t('detail.manage.notifications.gamePathNotSet'))
                  } else {
                    ipcManager.invoke('system:open-path-in-explorer', gamePath || markPath)
                  }
                }}
              >
                {t('detail.manage.browseLocalFiles')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DeleteGameAlert gameId={gameId}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  {t('detail.manage.delete')}
                </DropdownMenuItem>
              </DeleteGameAlert>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuGroup>

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

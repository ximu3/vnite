import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useLibrarybarStore } from '~/components/Librarybar/store'
import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '~/components/ui/dropdown-menu'
import { useConfigState, useGameLocalState, useGameState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useGameDetailStore } from '../../store'
import { DeleteGameAlert } from './DeleteGameAlert'
import { eventBus } from '~/app/events'

export function ManageMenu({
  gameId,
  openNameEditorDialog
}: {
  gameId: string
  openNameEditorDialog: () => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [markPath] = useGameLocalState(gameId, 'utils.markPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw, setNsfw] = useGameState(gameId, 'apperance.nsfw')
  const [playStatus, setPlayStatus] = useGameState(gameId, 'record.playStatus')
  const [selectedGroup] = useConfigState('game.gameList.selectedGroup')
  const [showLogo] = useConfigState('appearances.gameDetail.showLogo')
  const { refreshGameList } = useLibrarybarStore.getState()
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)
  const setIsPlayTimeEditorDialogOpen = useGameDetailStore(
    (state) => state.setIsPlayTimeEditorDialogOpen
  )
  const setIsScoreEditorDialogOpen = useGameDetailStore((state) => state.setIsScoreEditorDialogOpen)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)

  const changePlayStatus = (value: typeof playStatus): void => {
    setPlayStatus(value)
    eventBus.emit('game:play-status-changed', { gameId, status: value }, { source: 'manage-menu' })
    if (selectedGroup === 'record.playStatus') {
      refreshGameList()
    }
  }

  return (
    <>
      <DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{t('detail.manage.title')}</DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent className="">
              {/* Rename Game */}
              <DropdownMenuItem onSelect={openNameEditorDialog}>
                {t('detail.manage.rename')}
              </DropdownMenuItem>
              {/* Edit Game Logo */}
              {showLogo && (
                <DropdownMenuItem
                  onClick={() => {
                    setIsEditingLogo(true)
                  }}
                >
                  {t('detail.manage.editLogo')}
                </DropdownMenuItem>
              )}
              {/* Edit Play Time */}
              <DropdownMenuItem onClick={() => setIsPlayTimeEditorDialogOpen(true)}>
                {t('detail.manage.editPlayTime')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Play Status Menu */}
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

              {/* Change Score */}
              <DropdownMenuItem onSelect={() => setIsScoreEditorDialogOpen(true)}>
                {t('detail.header.rating.tooltip')}
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              {/* Mark as NSFW */}
              <DropdownMenuItem onClick={() => setNsfw(!nsfw)}>
                {nsfw ? t('detail.manage.unmarkNSFW') : t('detail.manage.markNSFW')}
              </DropdownMenuItem>
              {/* Update Metadata */}
              <DropdownMenuItem
                onClick={() => {
                  setDbId(gameId)
                  setName(gameName)
                  setIsOpen(true)
                }}
              >
                {t('detail.manage.downloadMetadata')}
              </DropdownMenuItem>
              {/* Create Shortcut */}
              {/* Only show if gamePath is set */}
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
              {/* Browse Local Files */}
              {/* Only work if gamePath or markPath is set */}
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
              {/* Delete Game */}
              <DeleteGameAlert gameId={gameId}>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  {t('detail.manage.delete')}
                </DropdownMenuItem>
              </DeleteGameAlert>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
      </DropdownMenuGroup>
    </>
  )
}

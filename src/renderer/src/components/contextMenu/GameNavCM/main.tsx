import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '~/components/ui/context-menu'
import { useRunningGames } from '~/pages/Library/store'
import { cn, startGame, stopGame } from '~/utils'

import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { ipcManager } from '~/app/ipc'
import { useLibrarybarStore } from '~/components/Librarybar/store'

export function GameNavCM({
  gameId,
  openAddCollectionDialog,
  openInformationEditorDialog,
  openPlayTimeEditorDialog,
  openPropertiesDialog,
  showRemoveFromRecent = false
}: {
  gameId: string
  openAddCollectionDialog: () => void
  openInformationEditorDialog: () => void
  openPlayTimeEditorDialog: () => void
  openPropertiesDialog: () => void
  showRemoveFromRecent?: boolean
}): React.JSX.Element {
  const { runningGames } = useRunningGames()
  const { t } = useTranslation('game')
  const refreshGameList = useLibrarybarStore((state) => state.refreshGameList)

  const removeFromRecentGames = (): void => {
    toast.promise(
      ipcManager.invoke('game:hide-from-recent-games', gameId).then(() => {
        refreshGameList()
      }),
      {
        loading: t('list.recent.notifications.removing'),
        success: t('list.recent.notifications.removed'),
        error: t('list.recent.notifications.removeError')
      }
    )
  }

  return (
    <ContextMenuContent className={cn('w-40')}>
      {/* Start/Stop Game */}
      <ContextMenuItem
        onSelect={() => {
          if (runningGames.includes(gameId)) {
            stopGame(gameId)
          } else {
            startGame(gameId)
          }
        }}
      >
        {runningGames.includes(gameId) ? t('detail.actions.stop') : t('detail.actions.start')}
      </ContextMenuItem>
      {showRemoveFromRecent && (
        <ContextMenuItem onSelect={removeFromRecentGames}>
          {t('list.recent.remove')}
        </ContextMenuItem>
      )}
      {/* Collection Menu */}
      <CollectionMenu gameId={gameId} openAddCollectionDialog={openAddCollectionDialog} />
      {/* Manage Menu */}
      {/* This menu includes renaming, editing playtime, and other management options */}
      <ManageMenu
        gameId={gameId}
        openInformationEditorDialog={openInformationEditorDialog}
        openPlayingTimeEditorDialog={openPlayTimeEditorDialog}
      />
      <ContextMenuSeparator />
      {/* Open Game Properties Dialog */}
      <ContextMenuItem
        onSelect={() => {
          openPropertiesDialog()
        }}
      >
        <div>{t('detail.config.properties')}</div>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

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

export function GameNavCM({
  gameId,
  openAddCollectionDialog,
  openNameEditorDialog,
  openPlayTimeEditorDialog,
  openPropertiesDialog
}: {
  gameId: string
  openAddCollectionDialog: () => void
  openNameEditorDialog: () => void
  openPlayTimeEditorDialog: () => void
  openPropertiesDialog: () => void
}): React.JSX.Element {
  const { runningGames } = useRunningGames()
  const { t } = useTranslation('game')

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
      {/* Collection Menu */}
      <CollectionMenu gameId={gameId} openAddCollectionDialog={openAddCollectionDialog} />
      {/* Manage Menu */}
      {/* This menu includes renaming, editing playtime, and other management options */}
      <ManageMenu
        gameId={gameId}
        openNameEditorDialog={openNameEditorDialog}
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

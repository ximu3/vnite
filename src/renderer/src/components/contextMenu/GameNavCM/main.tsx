import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@ui/context-menu'
import { useRunningGames } from '~/pages/Library/store'
import { cn, startGame, stopGame } from '~/utils'

import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { useTranslation } from 'react-i18next'

export function GameNavCM({
  gameId,
  openAttributesDialog,
  openAddCollectionDialog,
  openNameEditorDialog,
  openPlayTimeEditorDialog
}: {
  gameId: string
  openAttributesDialog: () => void
  openAddCollectionDialog: () => void
  openNameEditorDialog: () => void
  openPlayTimeEditorDialog: () => void
}): JSX.Element {
  const { runningGames } = useRunningGames()
  const { t } = useTranslation('game')
  return (
    <ContextMenuContent className={cn('w-40')}>
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
      <ContextMenuSeparator />
      <CollectionMenu gameId={gameId} openAddCollectionDialog={openAddCollectionDialog} />
      <ContextMenuSeparator />
      <ManageMenu
        gameId={gameId}
        openNameEditorDialog={openNameEditorDialog}
        openPlayingTimeEditorDialog={openPlayTimeEditorDialog}
      />
      <ContextMenuSeparator />
      <ContextMenuItem onSelect={openAttributesDialog}>
        <div>{t('detail.config.properties')}</div>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

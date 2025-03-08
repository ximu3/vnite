import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@ui/context-menu'
import { useRunningGames } from '~/pages/Library/store'
import { cn } from '~/utils'
import { StartGame } from '../../Game/StartGame'
import { StopGame } from '../../Game/StopGame'
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
      <div className={cn('flex flex-row w-full')}>
        {runningGames.includes(gameId) ? (
          <StopGame className={cn('w-full max-w-none flex')} gameId={gameId} />
        ) : (
          <StartGame className={cn('w-full max-w-none flex')} gameId={gameId} />
        )}
      </div>
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

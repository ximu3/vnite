import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@ui/context-menu'
import { useRunningGames } from '~/pages/Library/store'
import { cn, startGame, stopGame, scrollToElement } from '~/utils'
import { generateUUID } from '@appUtils'

import { CollectionMenu } from './CollectionMenu'
import { ManageMenu } from './ManageMenu'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePositionButtonStore } from '~/components/Librarybar/PositionButton'

export function GameNavCM({
  gameId,
  groupId,
  openAddCollectionDialog,
  openNameEditorDialog,
  openPlayTimeEditorDialog
}: {
  gameId: string
  groupId: string
  openAddCollectionDialog: () => void
  openNameEditorDialog: () => void
  openPlayTimeEditorDialog: () => void
}): JSX.Element {
  const setLazyloadMark = usePositionButtonStore((state) => state.setLazyloadMark)
  const { runningGames } = useRunningGames()
  const { t } = useTranslation('game')
  const navigate = useNavigate()
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
      {/* <ContextMenuSeparator /> */}
      <CollectionMenu gameId={gameId} openAddCollectionDialog={openAddCollectionDialog} />
      {/* <ContextMenuSeparator /> */}
      <ManageMenu
        gameId={gameId}
        openNameEditorDialog={openNameEditorDialog}
        openPlayingTimeEditorDialog={openPlayTimeEditorDialog}
      />
      <ContextMenuSeparator />
      <ContextMenuItem
        onSelect={() => {
          navigate(`/library/games/${gameId}/${groupId}/properties`)
          scrollToElement({
            selector: `[data-game-id="${gameId}"][data-group-id="${groupId || 'all'}"]`
          })
          setTimeout(() => {
            setLazyloadMark(generateUUID())
          }, 100)
        }}
      >
        <div>{t('detail.config.properties')}</div>
      </ContextMenuItem>
    </ContextMenuContent>
  )
}

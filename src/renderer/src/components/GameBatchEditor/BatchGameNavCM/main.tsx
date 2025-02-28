import { ContextMenuContent, ContextMenuItem, ContextMenuSeparator } from '@ui/context-menu'
import { cn } from '~/utils'
import { CollectionMenu } from './CollectionMenu'
import { InformationDialog } from './InformationDialog'
import { DeleteGameAlert } from './DeleteGameAlert'
import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useGameBatchEditorStore } from '../store'

export function BatchGameNavCM({
  openAddCollectionDialog
}: {
  openAttributesDialog: () => void
  openAddCollectionDialog: () => void
}): JSX.Element {
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const { clearGameIds, selectedGamesMap } = useGameBatchEditorStore()
  const gameIds = Object.keys(selectedGamesMap)
  const location = useLocation()
  useEffect(() => {
    // clear batchEditor gameList when switching to a non-game-detail page and not in batchMode
    if (!location.pathname.includes(`/library/games/`) && gameIds.length < 2) {
      clearGameIds()
    }
  }, [location.pathname])
  return (
    <ContextMenuContent className={cn('w-40')}>
      <CollectionMenu gameIds={gameIds} openAddCollectionDialog={openAddCollectionDialog} />
      <ContextMenuSeparator />
      <InformationDialog
        gameIds={gameIds}
        isOpen={isInformationDialogOpen}
        setIsOpen={setIsInformationDialogOpen}
      >
        <ContextMenuItem
          onClick={(e) => {
            e.preventDefault()
            setIsInformationDialogOpen(true)
          }}
        >
          <div>批量修改游戏信息</div>
        </ContextMenuItem>
      </InformationDialog>
      <ContextMenuSeparator />
      <DeleteGameAlert gameIds={gameIds}>
        <ContextMenuItem onSelect={(e) => e.preventDefault()}>
          <div>批量删除</div>
        </ContextMenuItem>
      </DeleteGameAlert>
    </ContextMenuContent>
  )
}

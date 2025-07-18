import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '~/components/ui/context-menu'
import { cn } from '~/utils'
import { CollectionMenu } from './CollectionMenu'
import { InformationDialog } from './InformationDialog'
import { DeleteGameAlert } from './DeleteGameAlert'
import { useState, useEffect } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useGameBatchEditorStore } from '../store'
import { useTranslation } from 'react-i18next'
import { useGameMetadataUpdaterStore } from '~/pages/GameMetadataUpdater'

export function BatchGameNavCM({
  openAddCollectionDialog
}: {
  openAddCollectionDialog: () => void
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const { clearGameIds, selectedGamesMap } = useGameBatchEditorStore()
  const {
    setGameIds: setGameMetadataUpdaterGameIds,
    setIsOpen: setIsGameMetadataUpdaterDialogOpen
  } = useGameMetadataUpdaterStore()
  const gameIds = Object.keys(selectedGamesMap)
  const location = useLocation()

  useEffect(() => {
    // clear batchEditor gameList when switching to a non-game-detail page and not in batchMode
    if (!location.pathname.includes(`/library/games/`) && gameIds.length < 2) {
      clearGameIds()
    }
  }, [location.pathname])

  return (
    <ContextMenuContent className={cn('w-[180px]')}>
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
          <div>{t('batchEditor.contextMenu.editInfo')}</div>
        </ContextMenuItem>
      </InformationDialog>
      <ContextMenuItem
        onClick={() => {
          setIsGameMetadataUpdaterDialogOpen(true)
          setGameMetadataUpdaterGameIds(gameIds)
        }}
      >
        <div>{t('batchEditor.contextMenu.updateMetadata')}</div>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <DeleteGameAlert gameIds={gameIds}>
        <ContextMenuItem onSelect={(e) => e.preventDefault()}>
          <div>{t('batchEditor.contextMenu.delete')}</div>
        </ContextMenuItem>
      </DeleteGameAlert>
    </ContextMenuContent>
  )
}

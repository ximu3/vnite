import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator
} from '~/components/ui/context-menu'
import { cn } from '~/utils'
import { CollectionMenu } from './CollectionMenu'
import { InformationDialog } from './InformationDialog'
import { DeleteGameAlert } from './DeleteGameAlert'
import { useState } from 'react'
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
  // This menu only mounts in batch mode; fewer than two selected games unmount it.
  const { selectedGamesMap } = useGameBatchEditorStore()
  const {
    setGameIds: setGameMetadataUpdaterGameIds,
    setIsOpen: setIsGameMetadataUpdaterDialogOpen
  } = useGameMetadataUpdaterStore()
  const gameIds = Object.keys(selectedGamesMap)

  return (
    <ContextMenuContent className={cn('w-[180px]')}>
      {/* Collection Menu */}
      <CollectionMenu gameIds={gameIds} openAddCollectionDialog={openAddCollectionDialog} />
      <ContextMenuSeparator />
      {/* Information Dialog */}
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
      {/* Game Metadata Updater */}
      <ContextMenuItem
        onClick={() => {
          setIsGameMetadataUpdaterDialogOpen(true)
          setGameMetadataUpdaterGameIds(gameIds)
        }}
      >
        <div>{t('batchEditor.contextMenu.updateMetadata')}</div>
      </ContextMenuItem>
      <ContextMenuSeparator />
      {/* Delete Game Alert */}
      <DeleteGameAlert gameIds={gameIds}>
        <ContextMenuItem onSelect={(e) => e.preventDefault()}>
          <div>{t('batchEditor.contextMenu.delete')}</div>
        </ContextMenuItem>
      </DeleteGameAlert>
    </ContextMenuContent>
  )
}

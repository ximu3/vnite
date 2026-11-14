import { useLocation } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { Button } from '~/components/ui/button'
import { useGameMetadataUpdaterStore } from '~/pages/GameMetadataUpdater'
import { useBatchStorageSizeStore } from '~/stores/batchStorageSizeStore'
import { useGameCollectionStore, useGameRegistry } from '~/stores/game'
import { cn } from '~/utils'
import { CalculateStorageSizeDialog } from './BatchGameNavCM/CalculateStorageSizeDialog'
import { DeleteGameAlert } from './BatchGameNavCM/DeleteGameAlert'
import { InformationDialog } from './BatchGameNavCM/InformationDialog'
import { useGameBatchEditorStore } from './store'

export function FloatingButtons(): React.JSX.Element {
  const { t } = useTranslation('game')
  const { selectedGamesMap, clearSelection, updateSelection } = useGameBatchEditorStore()
  const selectedGameIds = Object.keys(selectedGamesMap)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showCalculateSizeDialog, setShowCalculateSizeDialog] = useState(false)
  const {
    setGameIds: setGameMetadataUpdaterGameIds,
    setIsOpen: setIsGameMetadataUpdaterDialogOpen
  } = useGameMetadataUpdaterStore()
  const allGameIds = useGameRegistry((state) => state.gameIds)
  const collections = useGameCollectionStore((state) => state.documents)
  const location = useLocation()
  const { isRunning: isCalculationRunning, startCalculation } = useBatchStorageSizeStore()

  function selectAllGames(): void {
    let currentAllGameIds: string[] = []
    if (location.pathname.includes('/library/collections')) {
      const collectionId = location.pathname.split('/').pop()
      if (collectionId && collections[collectionId]) {
        // If in a collection page, get all games in that collection
        currentAllGameIds = collections[collectionId].games
      } else {
        // If in main collection page, get all games from all collections
        currentAllGameIds = Object.values(collections).flatMap((collection) => collection.games)
      }
    } else {
      // If not in a collection page, get all games from the registry
      currentAllGameIds = allGameIds
    }
    updateSelection({ gameIds: currentAllGameIds, mode: 'add' })
  }

  const handleBatchCalculateStorageSize = async (gameIds: string[]): Promise<void> => {
    await startCalculation(gameIds, t)
  }

  return (
    <>
      <div className={cn('absolute bottom-4 w-full z-50 flex flex-row justify-center')}>
        <div className="rounded-lg p-2 bg-background/(--glass-opacity) justify-center items-center backdrop-blur-(--glass-blur) shadow-md flex flex-row">
          {/* Add to Collection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddCollectionDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--folder-plus-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.addToCollection')}
          </Button>
          {/* Information Dialog */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsInformationDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--pencil-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.editInfo')}
          </Button>
          {/* Game Metadata Updater */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setIsGameMetadataUpdaterDialogOpen(true)
              setGameMetadataUpdaterGameIds(selectedGameIds)
            }}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--database-edit-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.updateMetadata')}
          </Button>
          {/* Calculate Storage Size */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCalculateSizeDialog(true)}
            disabled={selectedGameIds.length === 0 || isCalculationRunning}
            className="flex items-center gap-1"
          >
            {isCalculationRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('batchEditor.floatingButtons.calculatingSize')}
              </>
            ) : (
              <>
                <span className="icon-[mdi--harddisk] w-4 h-4" />
                {t('batchEditor.floatingButtons.calculateSize')}
              </>
            )}
          </Button>
          {/* Delete Game Alert */}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 text-destructive"
          >
            <span className="icon-[mdi--delete-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.delete')}
          </Button>

          <div className="h-5 w-px bg-border mx-2" />
          {/* Clear Selection */}
          <Button
            size="sm"
            variant="ghost"
            onClick={clearSelection}
            className="flex items-center gap-1 justify-center"
          >
            <span className="icon-[mdi--close] w-4 h-4" />
            {t('batchEditor.floatingButtons.cancel')}
          </Button>
          {/* Select All Games */}
          <Button
            size="sm"
            variant="ghost"
            onClick={selectAllGames}
            className="flex items-center gap-1 justify-center"
          >
            <span className="icon-[mdi--select-all] w-4 h-4" />
            {t('batchEditor.floatingButtons.selectAll')}
          </Button>
          {/* Selected Games Count */}
          <div className={cn('flex items-center px-2 text-sm text-muted-foreground')}>
            {t('batchEditor.floatingButtons.selected', { count: selectedGameIds.length })}
          </div>
        </div>
      </div>

      {/* Dialog Components */}
      {isAddCollectionDialogOpen && (
        <AddCollectionDialog gameIds={selectedGameIds} setIsOpen={setIsAddCollectionDialogOpen} />
      )}

      {isInformationDialogOpen && (
        <InformationDialog
          gameIds={selectedGameIds}
          isOpen={isInformationDialogOpen}
          setIsOpen={setIsInformationDialogOpen}
        />
      )}

      {showDeleteConfirm && (
        <DeleteGameAlert
          gameIds={selectedGameIds}
          isOpen={showDeleteConfirm}
          setIsOpen={setShowDeleteConfirm}
        />
      )}

      {showCalculateSizeDialog && (
        <CalculateStorageSizeDialog
          gameIds={selectedGameIds}
          isOpen={showCalculateSizeDialog}
          setIsOpen={setShowCalculateSizeDialog}
          onConfirm={handleBatchCalculateStorageSize}
        />
      )}
    </>
  )
}

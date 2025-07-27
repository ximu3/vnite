import { Button } from '~/components/ui/button'
import { cn } from '~/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameBatchEditorStore } from './store'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { InformationDialog } from './BatchGameNavCM/InformationDialog'
import { DeleteGameAlert } from './BatchGameNavCM/DeleteGameAlert'
import { useGameMetadataUpdaterStore } from '~/pages/GameMetadataUpdater'
import { useEffect } from 'react'
import { useGameRegistry } from '~/stores/game'
import { useLocation } from '@tanstack/react-router'
import { useGameCollectionStore } from '~/stores/game'

export function FloatingButtons(): React.JSX.Element {
  const { t } = useTranslation('game')
  const { selectedGamesMap, clearSelection, isBatchMode, selectGames } = useGameBatchEditorStore()
  const selectedGameIds = Object.keys(selectedGamesMap)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const {
    setGameIds: setGameMetadataUpdaterGameIds,
    setIsOpen: setIsGameMetadataUpdaterDialogOpen
  } = useGameMetadataUpdaterStore()
  const allGameIds = useGameRegistry((state) => state.gameIds)
  const collections = useGameCollectionStore((state) => state.documents)
  const location = useLocation()

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
    selectGames(currentAllGameIds)
  }

  // Set up a keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape' && isBatchMode) {
        // If in batch mode, clear selection on Escape key
        clearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isBatchMode, clearSelection])

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
    </>
  )
}

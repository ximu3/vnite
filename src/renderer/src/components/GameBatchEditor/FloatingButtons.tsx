import { Button } from '~/components/ui/button'
import { cn } from '~/utils'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useGameBatchEditorStore } from './store'
import { AddCollectionDialog } from '~/components/dialog/AddCollectionDialog'
import { InformationDialog } from './BatchGameNavCM/InformationDialog'
import { DeleteGameAlert } from './BatchGameNavCM/DeleteGameAlert'
import { useGameMetadataUpdaterStore } from '~/pages/GameMetadataUpdater'

export function FloatingButtons(): React.JSX.Element {
  const { t } = useTranslation('game')
  const { selectedGamesMap, clearSelection } = useGameBatchEditorStore()
  const selectedGameIds = Object.keys(selectedGamesMap)
  const [isAddCollectionDialogOpen, setIsAddCollectionDialogOpen] = useState(false)
  const [isInformationDialogOpen, setIsInformationDialogOpen] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const {
    setGameIds: setGameMetadataUpdaterGameIds,
    setIsOpen: setIsGameMetadataUpdaterDialogOpen
  } = useGameMetadataUpdaterStore()

  return (
    <>
      <div className={cn('absolute bottom-4 w-full z-50 flex flex-row justify-center')}>
        <div className="rounded-lg p-2 bg-background/(--glass-opacity) backdrop-blur-(--glass-blur) shadow-md flex flex-row">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsAddCollectionDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--folder-plus-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.addToCollection')}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsInformationDialogOpen(true)}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--pencil-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.editInfo')}
          </Button>

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

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 text-destructive"
          >
            <span className="icon-[mdi--delete-outline] w-4 h-4" />
            {t('batchEditor.floatingButtons.delete')}
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          <Button
            size="sm"
            variant="outline"
            onClick={clearSelection}
            className="flex items-center gap-1"
          >
            <span className="icon-[mdi--close] w-4 h-4" />
            {t('batchEditor.floatingButtons.cancel')}
          </Button>

          <div className={cn('flex items-center px-2 text-sm text-muted-foreground')}>
            {t('batchEditor.floatingButtons.selected', { count: selectedGameIds.length })}
          </div>
        </div>
      </div>

      {/* 对话框组件 */}
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

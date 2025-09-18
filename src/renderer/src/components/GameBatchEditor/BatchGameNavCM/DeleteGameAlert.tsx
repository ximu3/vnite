import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '~/components/ui/alert-dialog'
import { toast } from 'sonner'
import { useGameCollectionStore, useGameRegistry } from '~/stores/game'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { useGameBatchEditorStore } from '../store'
import { ipcManager } from '~/app/ipc'
import { Checkbox } from '~/components/ui/checkbox'
import { useState } from 'react'
import { useConfigLocalState } from '~/hooks'
import { useConfigLocalStore } from '~/stores'
import { getGameLocalStore } from '~/stores/game'

export function DeleteGameAlert({
  gameIds,
  isOpen,
  setIsOpen,
  children
}: {
  gameIds: string[]
  isOpen?: boolean
  setIsOpen?: (value: boolean) => void
  children?: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const { removeGamesFromAllCollections } = useGameCollectionStore()
  const gameMetaIndex = useGameRegistry((state) => state.gameMetaIndex)
  const clearSelection = useGameBatchEditorStore((state) => state.clearSelection)
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')
  const [addToIgnore, setAddToIgnore] = useState<boolean>(true)

  async function deleteGames(): Promise<void> {
    const gamesCount = gameIds.length
    const gameIdsToDelete = gameIds

    toast.promise(
      async () => {
        clearSelection()

        console.log(`Deleting games: ${gameIdsToDelete.join(', ')}...`)

        // Optionally add game folders to ignore list before deletion
        try {
          if (addToIgnore) {
            // Resolve each game's path via renderer local store API
            const paths: string[] = []
            for (const id of gameIds) {
              const store = getGameLocalStore(id)
              const gp = store.getState().getValue('path.gamePath') as unknown as string
              const mp = store.getState().getValue('utils.markPath') as unknown as string
              const chosen = typeof gp === 'string' && gp.trim().length > 0 ? gp : mp
              if (typeof chosen === 'string' && chosen.trim().length > 0) paths.push(chosen)
            }
            if (paths.length > 0) {
              const normalize = (p: string): string => p.trim().replace(/\\/g, '/').replace(/\/+$/, '')
              const current = ((scannerConfig?.ignoreList as string[]) || [])
                .map(normalize)
                .filter((v) => v.length > 0)
              const candidates = paths.map((p) => normalize(p))
              const next = Array.from(new Set([...current, ...candidates])).sort()
              // Persist via nested path to avoid overwriting other fields
              await useConfigLocalStore
                .getState()
                .setConfigLocalValue('game.scanner.ignoreList' as any, next as any)
              // Also update local state for immediate UI feedback
              await setScannerConfig({
                ...(scannerConfig || { interval: 0, list: {} }),
                ignoreList: next
              })
              // Notify
              const added = candidates.length
              toast.success(`${added} path(s) added to scanner ignore list.`)
            }
          }
        } catch (e) {
          console.warn('Failed to update ignore list while batch deleting games:', e)
        }

        removeGamesFromAllCollections(gameIdsToDelete)

        // Deleting games from the database
        for (const gameId of gameIdsToDelete) {
          await ipcManager.invoke('game:delete', gameId)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }

        console.log(`Games deleted: ${gameIdsToDelete.join(', ')}`)
        navigate({ to: '/library' })
      },
      {
        loading: t('batchEditor.delete.notifications.deleting', { count: gamesCount }),
        success: t('batchEditor.delete.notifications.success', { count: gamesCount }),
        error: (err) =>
          t('batchEditor.delete.notifications.error', { count: gamesCount, message: err.message })
      }
    )
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('batchEditor.delete.title', { count: gameIds.length })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('batchEditor.delete.description')}
            {/* Show the list of games to be deleted */}
            {gameIds.length > 1 && (
              <div className="mt-2">
                <div className="mb-2 font-semibold">{t('batchEditor.delete.gamesList')}</div>
                <div className="overflow-y-auto text-sm max-h-32 scrollbar-base">
                  {gameIds.map((gameId) => (
                    <div key={`batchEditor-delete-${gameId}`} className="mb-1">
                      {gameMetaIndex[gameId]?.name || t('batchEditor.delete.unnamedGame')}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {/* Optional: add paths to ignore list */}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`batch-delete-add-ignore`}
            checked={addToIgnore}
            onCheckedChange={(v) => setAddToIgnore(!!v)}
          />
          <label htmlFor={`batch-delete-add-ignore`} className="text-sm select-none">
            {t('batchEditor.delete.addToIgnore')}
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGames}>{t('utils:common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

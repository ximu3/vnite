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
import { useGameLocalState, useGameState } from '~/hooks'
import { toast } from 'sonner'
import { useGameCollectionStore } from '~/stores'
import { useNavigate } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { ipcManager } from '~/app/ipc'
import { Checkbox } from '~/components/ui/checkbox'
import { useState } from 'react'
import { useConfigLocalState } from '~/hooks'
import { useConfigLocalStore } from '~/stores'

export function DeleteGameAlert({
  gameId,
  children
}: {
  gameId: string
  children: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const navigate = useNavigate()
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [markPath] = useGameLocalState(gameId, 'utils.markPath')
  const { removeGameFromAllCollections } = useGameCollectionStore()
  const [scannerConfig, setScannerConfig] = useConfigLocalState('game.scanner')
  const [addToIgnore, setAddToIgnore] = useState<boolean>(true)

  async function deleteGame(): Promise<void> {
    toast.promise(
      async () => {
        // Optionally add path to ignore list before deletion
        try {
          const chosenPath = (typeof gamePath === 'string' && gamePath.trim().length > 0)
            ? gamePath
            : (typeof markPath === 'string' ? markPath : '')
          if (addToIgnore && typeof chosenPath === 'string' && chosenPath.trim().length > 0) {
            const normalize = (p: string): string => p.trim().replace(/\\/g, '/').replace(/\/+$/, '')
            const current = ((scannerConfig?.ignoreList as string[]) || [])
              .map(normalize)
              .filter((p) => p.length > 0)
            const next = Array.from(new Set([...current, normalize(chosenPath)])).sort()
            // Update nested path directly to avoid overwriting other fields and reduce race risks
            await useConfigLocalStore.getState().setConfigLocalValue(
              'game.scanner.ignoreList' as any,
              next as any
            )
            // Also update local state for immediate UI feedback
            await setScannerConfig({
              ...(scannerConfig || { interval: 0, list: {} }),
              ignoreList: next
            })
          }
        } catch (e) {
          // Do not block deletion on ignoreList update failure
          console.warn('Failed to update ignore list while deleting game:', e)
        }

        removeGameFromAllCollections(gameId)
        await ipcManager.invoke('game:delete', gameId)
        console.log(`Game ${gameId} deleted`)
        navigate({ to: '/library' })
      },
      {
        loading: t('detail.deleteAlert.notifications.deleting', { gameName }),
        success: t('detail.deleteAlert.notifications.deleted', { gameName }),
        error: (err) =>
          t('detail.deleteAlert.notifications.error', { gameName, message: err.message })
      }
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{children}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('detail.deleteAlert.title', { gameName })}</AlertDialogTitle>
          <AlertDialogDescription>{t('detail.deleteAlert.description')}</AlertDialogDescription>
        </AlertDialogHeader>
        {/* Optional: add path to ignore list */}
        <div className="flex items-center gap-2 mt-2">
          <Checkbox
            id={`delete-add-ignore-${gameId}`}
            checked={addToIgnore}
            onCheckedChange={(v) => setAddToIgnore(!!v)}
          />
          <label htmlFor={`delete-add-ignore-${gameId}`} className="text-sm select-none">
            {t('detail.deleteAlert.addToIgnore')}
          </label>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('utils:common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={deleteGame}>{t('utils:common.confirm')}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

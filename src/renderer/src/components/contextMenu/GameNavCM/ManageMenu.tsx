import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuPortal
} from '@ui/context-menu'
import { toast } from 'sonner'
import { DeleteGameAlert } from '~/components/Game/Config/ManageMenu/DeleteGameAlert'
import { useGameLocalState, useGameState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { ipcInvoke } from '~/utils'
import { useTranslation } from 'react-i18next'

export function ManageMenu({
  gameId,
  openNameEditorDialog,
  openPlayingTimeEditorDialog
}: {
  gameId: string
  openNameEditorDialog: () => void
  openPlayingTimeEditorDialog: () => void
}): JSX.Element {
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)
  const { t } = useTranslation('game')
  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>{t('detail.manage.title')}</ContextMenuSubTrigger>
        <ContextMenuPortal>
          <ContextMenuSubContent>
            <ContextMenuItem onSelect={openNameEditorDialog}>
              {t('detail.manage.rename')}
            </ContextMenuItem>
            <ContextMenuItem onClick={openPlayingTimeEditorDialog}>
              {t('detail.manage.editPlayTime')}
            </ContextMenuItem>
            <ContextMenuItem
              onClick={() => {
                setDbId(gameId)
                setName(gameName)
                setIsOpen(true)
              }}
            >
              {t('detail.manage.downloadMetadata')}
            </ContextMenuItem>
            {gamePath !== '' && (
              <ContextMenuItem
                onClick={async () => {
                  try {
                    const targetPath = await ipcInvoke('select-path-dialog', ['openDirectory'])
                    if (!targetPath) {
                      return
                    }
                    await ipcInvoke('create-game-shortcut', gameId, targetPath)
                    toast.success(t('detail.manage.notifications.shortcutCreated'))
                  } catch (_error) {
                    toast.error(t('detail.manage.notifications.shortcutError'))
                  }
                }}
              >
                {t('detail.manage.createShortcut')}
              </ContextMenuItem>
            )}
            <ContextMenuSeparator />
            <ContextMenuItem
              onClick={() => {
                if (gamePath) {
                  ipcInvoke('open-path-in-explorer', gamePath)
                } else {
                  toast.warning(t('detail.manage.notifications.gamePathNotSet'))
                }
              }}
            >
              {t('detail.manage.browseLocalFiles')}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <DeleteGameAlert gameId={gameId}>
              <ContextMenuItem onSelect={(e) => e.preventDefault()}>
                {t('detail.manage.delete')}
              </ContextMenuItem>
            </DeleteGameAlert>
          </ContextMenuSubContent>
        </ContextMenuPortal>
      </ContextMenuSub>
    </ContextMenuGroup>
  )
}

import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { DeleteGameAlert } from '~/components/Game/Config/ManageMenu/DeleteGameAlert'
import { useGameLocalState, useGameState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'

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
  const [nsfw, setNsfw] = useGameState(gameId, 'apperance.nsfw')
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
            <ContextMenuItem onClick={() => setNsfw(!nsfw)}>
              {nsfw ? t('detail.manage.unmarkNSFW') : t('detail.manage.markNSFW')}
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
                    const targetPath = await window.api.utils.selectPathDialog(['openDirectory'])
                    if (!targetPath) {
                      return
                    }
                    await window.api.utils.createGameShortcut(gameId, targetPath)
                    toast.success(t('detail.manage.notifications.shortcutCreated'))
                  } catch (_error) {
                    toast.error(t('detail.manage.notifications.shortcutError'))
                  }
                }}
              >
                {t('detail.manage.createShortcut')}
              </ContextMenuItem>
            )}
            {/* <ContextMenuSeparator /> */}
            <ContextMenuItem
              onClick={() => {
                if (gamePath) {
                  window.api.utils.openPathInExplorer(gamePath)
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

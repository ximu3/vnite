import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { toast } from 'sonner'
import { useGameState, useGameLocalState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { ipcInvoke } from '~/utils'
import { DeleteGameAlert } from './DeleteGameAlert'
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
  const { t } = useTranslation('game')
  const [gamePath] = useGameLocalState(gameId, 'path.gamePath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [logoVisible, setLogoVisible] = useGameState(gameId, 'apperance.logo.visible')
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{t('detail.manage.title')}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <DropdownMenuItem onSelect={openNameEditorDialog}>
              {t('detail.manage.rename')}
            </DropdownMenuItem>
            {!logoVisible && (
              <DropdownMenuItem
                onClick={() => {
                  setLogoVisible(true)
                }}
              >
                {t('detail.manage.showLogo')}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={openPlayingTimeEditorDialog}>
              {t('detail.manage.editPlayTime')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setDbId(gameId)
                setName(gameName)
                setIsOpen(true)
              }}
            >
              {t('detail.manage.downloadMetadata')}
            </DropdownMenuItem>
            {gamePath !== '' && (
              <DropdownMenuItem
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
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (gamePath) {
                  ipcInvoke('open-path-in-explorer', gamePath)
                } else {
                  toast.warning(t('detail.manage.notifications.gamePathNotSet'))
                }
              }}
            >
              {t('detail.manage.browseLocalFiles')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                ipcInvoke('open-game-db-path-in-explorer', gameId)
              }}
            >
              {t('detail.manage.browseDatabase')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteGameAlert gameId={gameId}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                {t('detail.manage.delete')}
              </DropdownMenuItem>
            </DeleteGameAlert>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
}

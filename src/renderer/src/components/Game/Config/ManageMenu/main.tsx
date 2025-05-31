import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameLocalState, useGameState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { useGameDetailStore } from '../../store'
import { DeleteGameAlert } from './DeleteGameAlert'

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
  const [markPath] = useGameLocalState(gameId, 'utils.markPath')
  const [gameName] = useGameState(gameId, 'metadata.name')
  const [nsfw, setNsfw] = useGameState(gameId, 'apperance.nsfw')
  const setIsEditingLogo = useGameDetailStore((state) => state.setIsEditingLogo)
  const setIsOpen = useGameAdderStore((state) => state.setIsOpen)
  const setName = useGameAdderStore((state) => state.setName)
  const setDbId = useGameAdderStore((state) => state.setDbId)

  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>{t('detail.manage.title')}</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="">
            <DropdownMenuItem onSelect={openNameEditorDialog}>
              {t('detail.manage.rename')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsEditingLogo(true)
              }}
            >
              {t('detail.manage.editLogo')}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={openPlayingTimeEditorDialog}>
              {t('detail.manage.editPlayTime')}
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => setNsfw(!nsfw)}>
              {nsfw ? t('detail.manage.unmarkNSFW') : t('detail.manage.markNSFW')}
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
              </DropdownMenuItem>
            )}
            {/* <DropdownMenuSeparator /> */}
            <DropdownMenuItem
              onClick={() => {
                if (!gamePath && !markPath) {
                  toast.warning(t('detail.manage.notifications.gamePathNotSet'))
                } else {
                  window.api.utils.openPathInExplorer(gamePath || markPath)
                }
              }}
            >
              {t('detail.manage.browseLocalFiles')}
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

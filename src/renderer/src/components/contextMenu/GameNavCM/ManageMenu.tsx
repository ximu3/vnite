import {
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger
} from '@ui/context-menu'
import { toast } from 'sonner'
import { DeleteGameAlert } from '~/components/Game/Config/ManageMenu/DeleteGameAlert'
import { useDBSyncedState } from '~/hooks'
import { useGameAdderStore } from '~/pages/GameAdder/store'
import { ipcInvoke } from '~/utils'

export function ManageMenu({
  gameId,
  openNameEditorDialog,
  openPlayingTimeEditorDialog
}: {
  gameId: string
  openNameEditorDialog: () => void
  openPlayingTimeEditorDialog: () => void
}): JSX.Element {
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const { setIsOpen, setDbId, setName } = useGameAdderStore()
  return (
    <ContextMenuGroup>
      <ContextMenuSub>
        <ContextMenuSubTrigger>管理</ContextMenuSubTrigger>
        <ContextMenuSubContent>
          <ContextMenuItem onSelect={openNameEditorDialog}>重命名</ContextMenuItem>
          <ContextMenuItem onClick={openPlayingTimeEditorDialog}>修改游玩时间</ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              setDbId(gameId)
              setName(gameName)
              setIsOpen(true)
            }}
          >
            下载资料数据
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
                  toast.success('已创建快捷方式')
                } catch (error) {
                  toast.error('创建快捷方式时出错')
                }
              }}
            >
              创建快捷方式
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => {
              if (gamePath) {
                ipcInvoke('open-path-in-explorer', gamePath)
              } else {
                toast.warning('游戏路径未设置')
              }
            }}
          >
            浏览本地文件
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() => {
              ipcInvoke('open-game-db-path-in-explorer', gameId)
            }}
          >
            浏览数据库
          </ContextMenuItem>
          <ContextMenuSeparator />
          <DeleteGameAlert gameId={gameId}>
            <ContextMenuItem onSelect={(e) => e.preventDefault()}>删除</ContextMenuItem>
          </DeleteGameAlert>
        </ContextMenuSubContent>
      </ContextMenuSub>
    </ContextMenuGroup>
  )
}

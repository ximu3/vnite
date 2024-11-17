import {
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { useDBSyncedState } from '~/hooks'
import { ipcInvoke } from '~/utils'
import { NameEditorDialog } from './NameEditorDialog'
import { DeleteGameAlert } from './DeleteGameAlert'
import { useState } from 'react'
import { toast } from 'sonner'
import { useGameAdderStore } from '~/pages/GameAdder/store'

export function ManageMenu({ gameId }: { gameId: string }): JSX.Element {
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [gameName] = useDBSyncedState('', `games/${gameId}/metadata.json`, ['name'])
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = useState(false)
  const { setIsOpen, setDbId, setName } = useGameAdderStore()
  return (
    <DropdownMenuGroup>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>管理</DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent>
            <NameEditorDialog
              gameId={gameId}
              isOpen={isNameEditorDialogOpen}
              setIsOpen={setIsNameEditorDialogOpen}
            >
              <DropdownMenuItem
                onSelect={(e) => {
                  e.preventDefault()
                  setIsNameEditorDialogOpen(true)
                }}
              >
                重命名
              </DropdownMenuItem>
            </NameEditorDialog>
            <DropdownMenuItem
              onClick={() => {
                setDbId(gameId)
                setName(gameName)
                setIsOpen(true)
              }}
            >
              下载资料数据
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
                    toast.success('已创建快捷方式')
                  } catch (error) {
                    toast.error('创建快捷方式时出错')
                  }
                }}
              >
                创建快捷方式
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                if (gamePath) {
                  ipcInvoke('open-path-in-explorer', gamePath)
                } else {
                  toast.warning('游戏路径未设置')
                }
              }}
            >
              浏览本地文件
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                ipcInvoke('open-game-db-path-in-explorer', gameId)
              }}
            >
              浏览数据库
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DeleteGameAlert gameId={gameId}>
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>删除</DropdownMenuItem>
            </DeleteGameAlert>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </DropdownMenuGroup>
  )
}

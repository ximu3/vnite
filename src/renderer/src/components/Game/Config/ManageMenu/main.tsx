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

export function ManageMenu({ gameId }: { gameId: string }): JSX.Element {
  const [gamePath] = useDBSyncedState('', `games/${gameId}/path.json`, ['gamePath'])
  const [isNameEditorDialogOpen, setIsNameEditorDialogOpen] = useState(false)
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

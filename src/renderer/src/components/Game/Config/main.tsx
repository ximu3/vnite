import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { cn } from '~/utils'
import { CollectionMenu } from './CollectionMenu'
import { AttributesDialog } from './AttributesDialog'

export function Config({ gameId }: { gameId: string }): JSX.Element {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={'icon'} className="non-draggable">
          <span className={cn('icon-[mdi--settings-outline] w-4 h-4')}></span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-44 mr-5">
        <CollectionMenu gameId={gameId} />
        <DropdownMenuSeparator />
        <AttributesDialog gameId={gameId}>
          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
            <div>属性</div>
          </DropdownMenuItem>
        </AttributesDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

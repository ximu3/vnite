import { Nav } from '@ui/nav'
import { cn } from '~/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Button } from '@ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger
} from '@ui/dropdown-menu'
import { useGameAdderStore } from '~/pages/GameAdder/store'

export function Sidebar(): JSX.Element {
  const { setIsOpen } = useGameAdderStore()
  return (
    <div className={cn('flex flex-col p-[10px] pt-3 pb-3 h-full bg-background justify-between')}>
      <div className={cn('flex flex-col gap-2')}>
        <div
          className={cn(
            'pb-3 font-mono text-xs font-bold flex justify-center items-center text-blue-600'
          )}
        >
          vnite
        </div>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./library">
              <span className={cn('icon-[mdi--bookshelf] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">游戏库</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Nav variant="sidebar" to="./record">
              <span className={cn('icon-[mdi--report-box-multiple] w-5 h-5')}></span>
            </Nav>
          </TooltipTrigger>
          <TooltipContent side="right">记录</TooltipContent>
        </Tooltip>
      </div>
      <div className={cn('flex flex-col gap-2')}>
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size={'icon'}
                  className={cn('min-h-0 min-w-0 p-2 non-draggable')}
                >
                  <span className={cn('icon-[mdi--plus-circle-outline] w-5 h-5')}></span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">添加游戏</TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" className="w-44">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>使用刮削器</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setIsOpen(true)}>
                    <div>单个添加</div>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <div>批量添加</div>
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuItem>
              <div>不使用刮削器</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              size={'icon'}
              className={cn('min-h-0 min-w-0 p-2 non-draggable')}
            >
              <span className={cn('icon-[mdi--settings-outline] w-5 h-5')}></span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">设置</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

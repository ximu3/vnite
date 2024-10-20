import { Nav } from '@ui/nav'
import { cn } from '~/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'

export function Sidebar(): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-2 p-[10px] pt-3 h-full bg-background')}>
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
  )
}

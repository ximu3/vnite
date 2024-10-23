import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Button } from '@ui/button'
import { cn } from '~/utils'

export function Link({ name, url }: { name: string; url: string }): JSX.Element {
  return (
    <Tooltip>
      <TooltipTrigger>
        <Button variant="link" className={cn('p-0 h-7')}>
          {name}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <div>{url}</div>
      </TooltipContent>
    </Tooltip>
  )
}

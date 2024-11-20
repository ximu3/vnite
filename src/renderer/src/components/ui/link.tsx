import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { Button } from '@ui/button'
import { cn } from '~/utils'

export function Link({
  name,
  url,
  noToolTip
}: {
  name: string
  url: string
  noToolTip?: boolean
}): JSX.Element {
  return (
    <>
      {!noToolTip ? (
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              variant="link"
              className={cn('p-0 h-7')}
            >
              {name}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div>{url}</div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          variant="link"
          className={cn('p-0 h-7')}
        >
          {name}
        </Button>
      )}
    </>
  )
}

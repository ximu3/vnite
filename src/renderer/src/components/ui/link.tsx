import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { Button } from '~/components/ui/button'
import { cn } from '~/utils'

export function Link({
  name,
  url,
  className,
  noToolTip,
  tooltipSide = 'bottom'
}: {
  name: string
  url: string
  className?: string
  noToolTip?: boolean
  tooltipSide?: 'top' | 'bottom' | 'left' | 'right'
}): React.JSX.Element {
  return (
    <>
      {!noToolTip ? (
        <Tooltip>
          <TooltipTrigger>
            <Button
              onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
              variant="link"
              className={cn('p-0 h-0', className)}
            >
              {name}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={tooltipSide}>
            <div>{url}</div>
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
          variant="link"
          className={cn('p-0 h-7', className)}
        >
          {name}
        </Button>
      )}
    </>
  )
}

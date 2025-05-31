import { getErrorMessage } from '@appUtils'
import { Badge } from '@ui/badge'
import { Button } from '@ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { PlayCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { cn } from '~/utils'
import { TransformerRule } from './types'

interface TransformerItemProps {
  transformer: TransformerRule
  index: number
  totalCount: number
  isTransforming: boolean
  handleTransform: (transformer: TransformerRule) => void
  onRuleClick: (transformer: TransformerRule) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  onEditClick: (transformer: TransformerRule) => void
  onDeleteClick: (transformer: TransformerRule) => void
}

export function TransformerItem({
  transformer,
  index,
  totalCount,
  isTransforming,
  handleTransform,
  onRuleClick,
  onMoveUp,
  onMoveDown,
  onEditClick,
  onDeleteClick
}: TransformerItemProps): JSX.Element {
  const { t } = useTranslation('transformer')

  // Calculate total rule count
  const ruleCount = Object.keys(transformer.processors).reduce((count, key) => {
    const rules = transformer.processors[key as keyof typeof transformer.processors]
    return count + (rules?.length || 0)
  }, 0)

  const handleExport = async (): Promise<void> => {
    try {
      const targetPath = await window.api.utils.selectPathDialog(['openDirectory'])
      if (!targetPath) return
      await window.api.transformer.exportTransformer(transformer, targetPath)
      toast.success(t('notifications.exportSuccess'))
    } catch (error) {
      console.error('Error exporting transformer:', error)
      toast.error(`${t('notifications.exportError')}: ${getErrorMessage(error)}`)
    }
  }

  return (
    <div
      className="p-4 cursor-pointer bg-card/45 hover:bg-muted/20"
      onClick={() => onRuleClick(transformer)}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="font-medium">{transformer.name}</div>
          {transformer.note && (
            <div className="text-sm text-muted-foreground">{transformer.note}</div>
          )}
          <div className="flex items-center mt-1 space-x-2">
            <Badge variant="outline" className="text-xs">
              {t('transformerItem.rulesCount', { count: ruleCount })}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            className={cn(index === 0 && 'opacity-50 cursor-not-allowed')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => onMoveUp(index)}
            disabled={index === 0}
          >
            <span className="w-5 h-5 icon-[mdi--chevron-up]"></span>
          </Button>

          <Button
            className={cn(index === totalCount - 1 && 'opacity-50 cursor-not-allowed')}
            variant={'ghost'}
            size={'icon'}
            onClick={() => onMoveDown(index)}
            disabled={index === totalCount - 1}
          >
            <span className="w-5 h-5 icon-[mdi--chevron-down]"></span>
          </Button>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant="ghost"
                onClick={() => handleTransform(transformer)}
                size={'icon'}
                disabled={isTransforming}
              >
                <PlayCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('transformerItem.tooltips.apply')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" onClick={() => onEditClick(transformer)} size={'icon'}>
                <span className="w-4 h-4 icon-[mdi--pencil]"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('transformerItem.tooltips.edit')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button variant="ghost" onClick={handleExport} size={'icon'}>
                <span className="w-4 h-4 icon-[mdi--export]"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('transformerItem.tooltips.export')}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger>
              <Button
                variant={'ghost'}
                size={'icon'}
                className="hover:text-destructive"
                onClick={() => onDeleteClick(transformer)}
              >
                <span className="w-4 h-4 icon-[mdi--delete-outline]"></span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t('transformerItem.tooltips.delete')}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

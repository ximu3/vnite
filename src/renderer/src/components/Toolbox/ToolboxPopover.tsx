import { useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { ipcManager } from '~/app/ipc'
import { ToolMonogram } from '~/components/Toolbox/ToolMonogram'
import { useConfigLocalState } from '~/hooks/useConfigLocalState'
import { useConfigTabStore } from '~/pages/Config/store'
import { cn } from '~/utils'

export function ToolboxPopover(): React.JSX.Element {
  const { t } = useTranslation('sidebar')
  const router = useRouter()
  const [tools] = useConfigLocalState('toolbox.tools')
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
  const setLastConfigTab = useConfigTabStore((state) => state.setLastConfigTab)

  const toolEntries = Object.entries(tools)

  async function handleLaunch(tool: {
    path: string
    args: string
    workingDirectory: string
  }): Promise<void> {
    await ipcManager.invoke('toolbox:launch-tool', tool)
    setIsPopoverOpen(false)
  }

  function openManagePage(): void {
    setLastConfigTab('advanced')
    router.navigate({ to: '/config' })
    setIsPopoverOpen(false)
  }

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <Tooltip>
        <PopoverTrigger asChild>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="min-h-0 min-w-0 p-2 non-draggable">
              <span className="icon-[mdi--toolbox-outline] w-5 h-5"></span>
            </Button>
          </TooltipTrigger>
        </PopoverTrigger>
        <TooltipContent side="right">{t('toolbox.title')}</TooltipContent>
      </Tooltip>

      <PopoverContent
        side="right"
        className="w-auto min-w-[200px] p-3 bg-popover/[calc(var(--glass-opacity)*2.5)]"
        onOpenAutoFocus={(event) => {
          // Prevent the first tool button's tooltip from showing when the popover opens
          event.preventDefault()
        }}
        onCloseAutoFocus={(event) => {
          // Prevent focusing the trigger again after `setIsPopoverOpen(false)` is called, otherwise the outer tooltip will open
          event.preventDefault()
        }}
      >
        <div className="flex flex-col gap-3">
          {toolEntries.length === 0 ? (
            <div className="text-xs text-muted-foreground text-center py-4">
              {t('toolbox.empty')}
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              {toolEntries.map(([id, tool]) => (
                <Tooltip key={id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="flex flex-col items-center justify-center w-12 h-12 p-1 non-draggable"
                      onClick={() => {
                        handleLaunch({
                          path: tool.path,
                          args: tool.args,
                          workingDirectory: tool.workingDirectory
                        })
                      }}
                    >
                      <ToolMonogram name={tool.name} className={cn('h-7 w-7 text-xs')} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{tool.name}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground"
            onClick={openManagePage}
          >
            <span className="icon-[mdi--cog] w-4 h-4 mr-1"></span>
            {t('toolbox.manage')}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

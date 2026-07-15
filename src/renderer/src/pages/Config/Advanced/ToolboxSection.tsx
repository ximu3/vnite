import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Input } from '@ui/input'
import { ScrollArea } from '@ui/scroll-area'
import { ipcManager } from '~/app/ipc'
import { ToolIcon } from '~/components/Toolbox/ToolIcon'
import { useConfigLocalState } from '~/hooks/useConfigLocalState'
import { cn } from '~/utils'

type ToolboxTool = {
  name: string
  path: string
  args: string
  workingDirectory: string
}

function ToolboxField({
  label,
  children
}: {
  label: string
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">{label}</label>
      {children}
    </div>
  )
}

export function ToolboxSection(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [tools, setTools, saveTools, setToolsAndSave] = useConfigLocalState('toolbox.tools', true)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const toolEntries = Object.entries(tools)
  const selectedTool = selectedId ? tools[selectedId] : null

  function selectTool(id: string): void {
    if (!tools[id]) return
    setSelectedId(id)
  }

  function updateSelectedTool(
    updater: (tool: ToolboxTool) => ToolboxTool,
    saveImmediately = false
  ): void {
    if (!selectedId) return

    const tool = tools[selectedId]
    if (!tool) return

    const nextTools = {
      ...tools,
      [selectedId]: updater(tool)
    }

    if (saveImmediately) {
      void setToolsAndSave(nextTools)
    } else {
      setTools(nextTools)
    }
  }

  async function handleAdd(): Promise<void> {
    const id = await ipcManager.invoke('utils:generate-uuid')
    const newTool: ToolboxTool = {
      name: t('advanced.toolbox.newTool'),
      path: '',
      args: '',
      workingDirectory: ''
    }
    await setToolsAndSave({ ...tools, [id]: newTool })
    setSelectedId(id)
  }

  async function handleRemove(id: string): Promise<void> {
    try {
      await ipcManager.invoke('toolbox:remove-tool', id)
      if (selectedId === id) {
        setSelectedId(null)
      }
    } catch (error) {
      toast.error(
        t('advanced.toolbox.notifications.removeToolFailed', {
          message: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  async function handleBrowsePath(): Promise<void> {
    const result = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
    if (!result) return

    updateSelectedTool((tool) => ({ ...tool, path: result }), true)
  }

  async function handleBrowseWorkingDirectory(): Promise<void> {
    const result = await ipcManager.invoke('system:select-path-dialog', ['openDirectory'])
    if (!result) return

    updateSelectedTool((tool) => ({ ...tool, workingDirectory: result }), true)
  }

  async function handleExtractToolIcon(): Promise<void> {
    if (!selectedId || !selectedTool) return

    if (!selectedTool.path.trim()) {
      toast.error(t('advanced.toolbox.notifications.iconPathRequired'))
      return
    }

    try {
      await ipcManager.invoke('toolbox:refresh-tool-icon', selectedId, selectedTool.path)
    } catch (error) {
      toast.error(
        t('advanced.toolbox.notifications.extractIconFailed', {
          message: error instanceof Error ? error.message : String(error)
        })
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('advanced.toolbox.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'grid h-[22rem] grid-cols-[220px_minmax(0,1fr)] overflow-hidden rounded-xl border'
          )}
        >
          <div className="flex min-h-0 flex-col border-r">
            <div className="border-b p-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={handleAdd}
              >
                <span className="icon-[mdi--plus] w-4 h-4"></span>
                {t('advanced.toolbox.newTool')}
              </Button>
            </div>
            <div className="min-h-0 flex-1">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-1 select-none">
                  {toolEntries.map(([id, tool]) => (
                    <div
                      key={id}
                      role="button"
                      tabIndex={0}
                      className={cn(
                        'group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent/50',
                        selectedId === id && 'bg-accent text-accent-foreground'
                      )}
                      onClick={() => selectTool(id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          selectTool(id)
                        }
                      }}
                    >
                      <ToolIcon
                        toolId={id}
                        name={tool.name || t('advanced.toolbox.newTool')}
                        className="h-5 w-5 shrink-0 text-[10px]"
                      />
                      <span className="truncate flex-1">
                        {tool.name || t('advanced.toolbox.newTool')}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <div className="h-full p-4">
            {selectedTool ? (
              <div className="flex h-full flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="group relative shrink-0">
                    <ToolIcon
                      toolId={selectedId!}
                      name={selectedTool.name || t('advanced.toolbox.newTool')}
                      className="h-12 w-12 text-sm"
                    />
                    <div
                      className={cn(
                        'absolute inset-0 flex items-center justify-center rounded-md bg-black/55 text-white cursor-pointer',
                        'opacity-0 transition-opacity group-hover:opacity-100'
                      )}
                      onClick={handleExtractToolIcon}
                    >
                      <span className="icon-[mdi--refresh] h-4 w-4"></span>
                    </div>
                  </div>
                  <Input
                    value={selectedTool.name}
                    onChange={(e) => {
                      const value = e.target.value
                      updateSelectedTool((tool) => ({ ...tool, name: value }))
                    }}
                    onBlur={saveTools}
                    placeholder={t('advanced.toolbox.namePlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 hover:text-destructive"
                    onClick={() => {
                      if (selectedId) {
                        handleRemove(selectedId)
                      }
                    }}
                  >
                    <span className="icon-[mdi--delete-outline] h-5 w-5"></span>
                  </Button>
                </div>

                <ToolboxField label={t('advanced.toolbox.path')}>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      value={selectedTool.path}
                      onChange={(e) => {
                        const value = e.target.value
                        updateSelectedTool((tool) => ({ ...tool, path: value }))
                      }}
                      onBlur={saveTools}
                      placeholder={t('advanced.toolbox.pathPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleBrowsePath}
                      title={t('advanced.toolbox.browse')}
                    >
                      <span className="icon-[mdi--file-outline] w-5 h-5"></span>
                    </Button>
                  </div>
                </ToolboxField>

                <ToolboxField label={t('advanced.toolbox.args')}>
                  <Input
                    value={selectedTool.args}
                    onChange={(e) => {
                      const value = e.target.value
                      updateSelectedTool((tool) => ({ ...tool, args: value }))
                    }}
                    onBlur={saveTools}
                    placeholder={t('advanced.toolbox.argsPlaceholder')}
                  />
                </ToolboxField>

                <ToolboxField label={t('advanced.toolbox.workingDirectory')}>
                  <div className="flex min-w-0 items-center gap-2">
                    <Input
                      value={selectedTool.workingDirectory}
                      onChange={(e) => {
                        const value = e.target.value
                        updateSelectedTool((tool) => ({ ...tool, workingDirectory: value }))
                      }}
                      onBlur={saveTools}
                      placeholder={t('advanced.toolbox.workingDirectoryPlaceholder')}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={handleBrowseWorkingDirectory}
                      title={t('advanced.toolbox.browse')}
                    >
                      <span className="icon-[mdi--folder-outline] w-5 h-5"></span>
                    </Button>
                  </div>
                </ToolboxField>
              </div>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                {t('advanced.toolbox.selectTool')}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

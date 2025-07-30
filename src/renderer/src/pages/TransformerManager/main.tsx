import { generateUUID, getErrorMessage } from '@appUtils'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Card } from '~/components/ui/card'
import { ScrollArea } from '~/components/ui/scroll-area'
import { ListFilter, Plus, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigState } from '~/hooks'
import { DeleteDialog } from './DeleteDialog'
import { EditDialog } from './EditDialog'
import { TransformerPresetSelector } from './PresetSelector'
import { RuleDialog } from './RuleDialog'
import { TransformerItem } from './TransformerItem'
import { TransformerRule } from './types'
import { ipcManager } from '~/app/ipc'

export function TransformerManager(): React.JSX.Element {
  const { t } = useTranslation('transformer')
  const [transformers, setTransformers] = useConfigState('metadata.transformer.list')
  const [isLoading, setIsLoading] = useState(false)

  // Dialog states
  const [isRuleDialogOpen, setIsRuleDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTransformer, setSelectedTransformer] = useState<TransformerRule | null>(null)

  const handleRuleClick = (transformer: TransformerRule): void => {
    setSelectedTransformer(transformer)
    setIsRuleDialogOpen(true)
  }

  const handleEditClick = (transformer: TransformerRule): void => {
    setSelectedTransformer(transformer)
    setIsEditDialogOpen(true)
  }

  const handleDeleteClick = (transformer: TransformerRule): void => {
    setSelectedTransformer(transformer)
    setIsDeleteDialogOpen(true)
  }

  // Move rule up
  const handleMoveUp = (index: number): void => {
    if (index <= 0) return

    const newTransformers = [...transformers]
    const temp = newTransformers[index]
    newTransformers[index] = newTransformers[index - 1]
    newTransformers[index - 1] = temp
    setTransformers(newTransformers)
  }

  // Move rule down
  const handleMoveDown = (index: number): void => {
    if (index >= transformers.length - 1) return

    const newTransformers = [...transformers]
    const temp = newTransformers[index]
    newTransformers[index] = newTransformers[index + 1]
    newTransformers[index + 1] = temp
    setTransformers(newTransformers)
  }

  const handleRuleSave = (updatedTransformer: TransformerRule): void => {
    const updatedTransformers = transformers.map((transformer) =>
      transformer.id === updatedTransformer.id ? updatedTransformer : transformer
    )
    setTransformers(updatedTransformers)
  }

  // Save basic information edits
  const handleEditSave = (name: string, note: string): void => {
    if (!selectedTransformer) return

    const updatedTransformers = transformers.map((transformer) =>
      transformer.id === selectedTransformer.id ? { ...transformer, name, note } : transformer
    )
    setTransformers(updatedTransformers)
  }

  // Delete transformer
  const handleDelete = (): void => {
    if (!selectedTransformer) return

    const updatedTransformers = transformers.filter(
      (transformer) => transformer.id !== selectedTransformer.id
    )
    setTransformers(updatedTransformers)
  }

  // Add new transformer
  const handleAddTransformer = (): void => {
    const newTransformer: TransformerRule = {
      id: generateUUID(),
      name: t('list.newTransformerName'),
      note: '',
      processors: {
        name: [],
        originalName: [],
        description: [],
        developers: [],
        publishers: [],
        platforms: [],
        genres: [],
        tags: [],
        director: [],
        scenario: [],
        illustration: [],
        music: [],
        engine: []
      }
    }

    setTransformers([...transformers, newTransformer])
  }

  const handleAddPreset = (preset: TransformerRule): void => {
    setTransformers([...transformers, preset])
  }

  const handleImportTransformer = async (): Promise<void> => {
    try {
      const filePath = await ipcManager.invoke('system:select-path-dialog', ['openFile'])
      if (!filePath) return
      await ipcManager.invoke('transformer:import-transformer', filePath)
      toast.success(t('notifications.importSuccess'))
    } catch (error) {
      console.error('Error importing transformer:', error)
      toast.error(`${t('notifications.importError')}: ${getErrorMessage(error)}`)
    }
  }

  const handleTransformAll = async (): Promise<void> => {
    setIsLoading(true)
    toast.loading(t('notifications.applyLoading'), {
      id: 'transform-all'
    })
    try {
      await ipcManager.invoke(
        'transformer:transform-all-games',
        transformers.map((t) => t.id)
      )
      toast.success(t('notifications.applySuccess'), { id: 'transform-all' })
    } catch (error) {
      console.error('Error transforming all:', error)
      toast.error(t('notifications.applyError'), { id: 'transform-all' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTransformOne = async (transformer: TransformerRule): Promise<void> => {
    setIsLoading(true)
    toast.loading(t('notifications.applyOneLoading', { name: transformer.name }), {
      id: 'transform-one'
    })
    try {
      await ipcManager.invoke('transformer:transform-all-games', [transformer.id])
      toast.success(t('notifications.applyOneSuccess', { name: transformer.name }), {
        id: 'transform-one'
      })
    } catch (error) {
      console.error(`Error transforming ${transformer.name}:`, error)
      toast.error(t('notifications.applyOneError', { name: transformer.name }), {
        id: 'transform-one'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalRuleCount = (): number => {
    return transformers.reduce((total, transformer) => {
      return (
        total +
        Object.keys(transformer.processors).reduce((count, key) => {
          const rules = transformer.processors[key as keyof typeof transformer.processors]
          return count + (rules.length || 0)
        }, 0)
      )
    }, 0)
  }

  return (
    <div className="flex flex-col w-full h-full bg-transparent">
      <ScrollArea className="w-full h-full">
        <div className="px-6 py-[34px] pb-6">
          {/* Title */}
          <div className="flex items-center justify-between mb-4 ">
            <h2 className="text-2xl font-bold">{t('title')}</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {/* Status card */}
            <Card className="p-4 rounded-lg">
              <div className="flex flex-wrap items-center justify-between gap-4">
                {/* Left side: Status and quantity information */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Transformer count metrics */}
                  <div className="flex flex-wrap items-center gap-3 pr-4">
                    <Badge variant="outline" className="flex items-center gap-1">
                      <span className="w-3.5 h-3.5 icon-[mdi--arrow-decision]"></span>
                      <span>
                        {t('status.transformers')}: {transformers.length}
                      </span>
                    </Badge>

                    <Badge variant="outline" className="flex items-center gap-1">
                      <ListFilter className="w-3.5 h-3.5" />
                      <span>
                        {t('status.rules')}: {getTotalRuleCount()}
                      </span>
                    </Badge>
                  </div>
                </div>

                {/* Right side: Action buttons */}
                <div className="flex gap-2">
                  <TransformerPresetSelector onSelectPreset={handleAddPreset} />
                  <Button
                    size="sm"
                    variant="default"
                    disabled={isLoading}
                    onClick={handleTransformAll}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    {t('status.apply')}
                  </Button>
                </div>
              </div>
            </Card>

            {/* Transformer list and operation card */}
            <Card className="flex flex-col flex-grow rounded-lg p-0 gap-0">
              {/* Transformer list header bar */}
              <div className="flex items-center justify-between p-4 border-b rounded-t-lg bg-muted/[calc(var(--glass-opacity)/2)]">
                <div className="text-sm font-medium">{t('list.title')}</div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={handleAddTransformer} disabled={isLoading}>
                    <Plus className="w-4 h-4 mr-2" />
                    {t('list.add')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleImportTransformer}
                    disabled={isLoading}
                  >
                    <span className="w-4 h-4 mr-2 icon-[mdi--import]"></span>
                    {t('list.import')}
                  </Button>
                </div>
              </div>

              {/* Transformer list */}
              <div className="overflow-auto">
                {transformers.length > 0 ? (
                  <div className="divide-y">
                    {transformers.map((transformer, index) => (
                      <TransformerItem
                        key={transformer.id}
                        transformer={transformer}
                        index={index}
                        totalCount={transformers.length}
                        isTransforming={isLoading}
                        handleTransform={handleTransformOne}
                        onRuleClick={handleRuleClick}
                        onEditClick={handleEditClick}
                        onDeleteClick={handleDeleteClick}
                        onMoveUp={handleMoveUp}
                        onMoveDown={handleMoveDown}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                    <div className="mb-4 w-16 h-16 opacity-20 icon-[mdi--arrow-decision]"></div>
                    <p className="mb-2 text-lg">{t('list.empty.title')}</p>
                    <p className="text-sm text-center text-muted-foreground">
                      {t('list.empty.description')}
                    </p>
                    <Button className="mt-4" onClick={handleAddTransformer}>
                      <Plus className="w-4 h-4 mr-2" />
                      {t('list.add')}
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Dialog components */}
          <RuleDialog
            isOpen={isRuleDialogOpen}
            onOpenChange={setIsRuleDialogOpen}
            transformer={selectedTransformer}
            onSave={handleRuleSave}
          />

          <EditDialog
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            transformer={selectedTransformer}
            onSave={handleEditSave}
          />

          <DeleteDialog
            isOpen={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            transformer={selectedTransformer}
            onConfirm={handleDelete}
          />
        </div>
      </ScrollArea>
    </div>
  )
}

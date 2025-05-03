import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@ui/accordion'
import { Button } from '@ui/button'
import { Input } from '@ui/input'
import { ArrayEditor } from '@ui/array-editor'
import { TransformerRule, RuleSet } from './types'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RuleDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  transformer: TransformerRule | null
  onSave: (transformer: TransformerRule) => void
}

export function RuleDialog({
  isOpen,
  onOpenChange,
  transformer,
  onSave
}: RuleDialogProps): JSX.Element {
  const { t } = useTranslation('transformer')
  const [localTransformer, setLocalTransformer] = useState<TransformerRule | null>(transformer)

  // Update local state every time the dialog opens
  React.useEffect(() => {
    if (isOpen && transformer) {
      setLocalTransformer(JSON.parse(JSON.stringify(transformer)))
    }
  }, [isOpen, transformer])

  // If there's no transformer data, return an empty dialog
  if (!localTransformer) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent>{t('ruleDialog.loading')}</DialogContent>
      </Dialog>
    )
  }

  // Update rule set
  const updateRuleSet = (
    category: keyof TransformerRule['processors'],
    index: number,
    field: keyof RuleSet,
    value: any
  ): void => {
    if (!localTransformer) return

    const rules = localTransformer.processors[category] || []
    const newRules = [...rules]

    if (!newRules[index]) {
      newRules[index] = { match: [], replace: '' }
    }

    newRules[index] = { ...newRules[index], [field]: value }

    setLocalTransformer({
      ...localTransformer,
      processors: {
        ...localTransformer.processors,
        [category]: newRules
      }
    })
  }

  // Add new rule
  const addRule = (category: keyof TransformerRule['processors']): void => {
    if (!localTransformer) return

    const rules = localTransformer.processors[category] || []
    const newRules = [...rules, { match: [], replace: '' }]

    setLocalTransformer({
      ...localTransformer,
      processors: {
        ...localTransformer.processors,
        [category]: newRules
      }
    })
  }

  // Delete rule
  const deleteRule = (category: keyof TransformerRule['processors'], index: number): void => {
    if (!localTransformer) return

    const rules = localTransformer.processors[category] || []
    const newRules = [...rules]
    newRules.splice(index, 1)

    setLocalTransformer({
      ...localTransformer,
      processors: {
        ...localTransformer.processors,
        [category]: newRules
      }
    })
  }

  // Save and close
  const handleSave = (): void => {
    if (!localTransformer) return
    onSave(localTransformer)
    onOpenChange(false)
  }

  // Render rule category content
  const renderRuleCategory = (
    category: keyof TransformerRule['processors'],
    title: string
  ): JSX.Element => {
    const rules = localTransformer.processors[category] || []

    return (
      <AccordionItem value={category}>
        <AccordionTrigger className="font-medium">{title}</AccordionTrigger>
        <AccordionContent>
          {rules.map((rule, index) => (
            <div key={index} className="flex items-center gap-4 pt-1 mb-2">
              <div className="w-[70%]">
                <ArrayEditor
                  value={rule.match}
                  onChange={(value) => updateRuleSet(category, index, 'match', value)}
                  placeholder={t('ruleDialog.match')}
                  isHaveTooltip={true}
                  dialogTitle={t('ruleDialog.addDialogTitle')}
                  dialogPlaceholder={t('ruleDialog.addDialogPlaceholder')}
                />
              </div>
              <div className="w-[calc(30%-68px)]">
                <Input
                  value={rule.replace}
                  onChange={(e) => updateRuleSet(category, index, 'replace', e.target.value)}
                  placeholder={t('ruleDialog.replace')}
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => deleteRule(category, index)}>
                <span className="w-5 h-5 icon-[mdi--delete-outline]"></span>
              </Button>
            </div>
          ))}

          <Button variant="outline" size="sm" className="mt-2" onClick={() => addRule(category)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('ruleDialog.addRule')}
          </Button>
        </AccordionContent>
      </AccordionItem>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-3/4 max-w-none h-[70vh]">
        <DialogHeader>
          <DialogTitle>
            {localTransformer.name} - {t('ruleDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[calc(70vh-170px)] pr-2 overflow-y-auto scrollbar-base-thin">
          <Accordion type="multiple" className="w-full">
            {renderRuleCategory('name', t('ruleDialog.categories.name'))}
            {renderRuleCategory('originalName', t('ruleDialog.categories.originalName'))}
            {renderRuleCategory('description', t('ruleDialog.categories.description'))}
            {renderRuleCategory('developers', t('ruleDialog.categories.developers'))}
            {renderRuleCategory('publishers', t('ruleDialog.categories.publishers'))}
            {renderRuleCategory('genres', t('ruleDialog.categories.genres'))}
            {renderRuleCategory('platforms', t('ruleDialog.categories.platforms'))}
            {renderRuleCategory('tags', t('ruleDialog.categories.tags'))}
            {renderRuleCategory('director', t('ruleDialog.categories.director'))}
            {renderRuleCategory('scenario', t('ruleDialog.categories.scenario'))}
            {renderRuleCategory('illustration', t('ruleDialog.categories.illustration'))}
            {renderRuleCategory('music', t('ruleDialog.categories.music'))}
            {renderRuleCategory('engine', t('ruleDialog.categories.engine'))}
          </Accordion>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('ruleDialog.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('ruleDialog.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

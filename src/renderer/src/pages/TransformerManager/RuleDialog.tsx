import { ArrayEditor } from '@ui/array-editor'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '~/components/ui/dialog'
import { Input } from '~/components/ui/input'
import { ChevronDown, Plus } from 'lucide-react'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import AutoSizer from 'react-virtualized-auto-sizer'
import { FixedSizeList } from 'react-window'
import { cn } from '~/utils'
import { RuleSet, TransformerRule } from './types'

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
}: RuleDialogProps): React.JSX.Element {
  const { t } = useTranslation('transformer')
  const [localTransformer, setLocalTransformer] = useState<TransformerRule | null>(transformer)
  const [currentRuleCategory, setCurrentRuleCategory] = useState<
    keyof TransformerRule['processors'] | 'all'
  >('all')

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
        <DialogContent className="w-[60vw]">{t('ruleDialog.loading')}</DialogContent>
      </Dialog>
    )
  }

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

  const toggleCurrentRule = (to: keyof TransformerRule['processors']): void => {
    if (currentRuleCategory === 'all') {
      setCurrentRuleCategory(to)
    } else {
      setCurrentRuleCategory('all')
    }
  }

  const ruleCategoryItem = (
    category: keyof TransformerRule['processors'],
    title: string
  ): React.JSX.Element => {
    const rules = localTransformer.processors[category] || []

    const Row = ({
      index,
      style
    }: {
      index: number
      style: React.CSSProperties
    }): React.JSX.Element => {
      const rule = rules[index]
      const [inputValue, setInputValue] = React.useState(rule.replace)

      React.useEffect(() => {
        setInputValue(rule.replace)
      }, [rule.replace])
      return (
        <div style={style} className={cn('flex items-center gap-4 pt-1 px-2')}>
          <div className="flex-[7]">
            <ArrayEditor
              value={rule.match}
              onChange={(value) => updateRuleSet(category, index, 'match', value)}
              placeholder={t('ruleDialog.match')}
              isHaveTooltip={true}
              dialogTitle={t('ruleDialog.addDialogTitle')}
              dialogPlaceholder={t('ruleDialog.addDialogPlaceholder')}
            />
          </div>
          <div className="flex-[3]">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => updateRuleSet(category, index, 'replace', inputValue)}
              placeholder={t('ruleDialog.replace')}
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="hover:text-destructive flex-shrink-0"
            onClick={() => deleteRule(category, index)}
          >
            <span className="w-5 h-5 icon-[mdi--delete-outline]"></span>
          </Button>
        </div>
      )
    }

    return (
      <div className={cn('flex flex-col w-full', currentRuleCategory === category && 'h-full')}>
        <div
          className="flex items-center px-4 py-3 cursor-pointer hover:bg-accent rounded-md transition"
          onClick={() => toggleCurrentRule(category)}
        >
          <span className="text-sm font-medium text-foreground">{`${title}`}</span>
          <span className="text-sm text-foreground/80 ml-1">{`(${rules.length})`}</span>
          <div className="flex-grow" />
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
              currentRuleCategory === category ? 'rotate-180' : ''
            }`}
          />
        </div>

        {currentRuleCategory === category && (
          <div className="flex-grow">
            {rules.length !== 0 ? (
              <AutoSizer>
                {({ height, width }) => {
                  return (
                    <FixedSizeList
                      className="scrollbar-base-thin"
                      height={height}
                      width={width}
                      itemCount={rules.length}
                      itemSize={50}
                      layout="vertical"
                      style={{ willChange: 'auto' }} // fix: the content becomes blurred when custom scrollbar appears
                    >
                      {Row}
                    </FixedSizeList>
                  )
                }}
              </AutoSizer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                {t('ruleDialog.noRules')}
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[60vw] max-w-none">
        <DialogHeader>
          <DialogTitle>
            {localTransformer.name} - {t('ruleDialog.title')}
          </DialogTitle>
        </DialogHeader>
        <div className="h-[60vh] pr-2 overflow-y-auto scrollbar-base-thin">
          <div className="w-full h-full">
            {currentRuleCategory === 'all' ? (
              <>
                {ruleCategoryItem('name', t('ruleDialog.categories.name'))}
                {ruleCategoryItem('originalName', t('ruleDialog.categories.originalName'))}
                {ruleCategoryItem('description', t('ruleDialog.categories.description'))}
                {ruleCategoryItem('developers', t('ruleDialog.categories.developers'))}
                {ruleCategoryItem('publishers', t('ruleDialog.categories.publishers'))}
                {ruleCategoryItem('genres', t('ruleDialog.categories.genres'))}
                {ruleCategoryItem('platforms', t('ruleDialog.categories.platforms'))}
                {ruleCategoryItem('tags', t('ruleDialog.categories.tags'))}
                {ruleCategoryItem('director', t('ruleDialog.categories.director'))}
                {ruleCategoryItem('scenario', t('ruleDialog.categories.scenario'))}
                {ruleCategoryItem('illustration', t('ruleDialog.categories.illustration'))}
                {ruleCategoryItem('music', t('ruleDialog.categories.music'))}
                {ruleCategoryItem('engine', t('ruleDialog.categories.engine'))}
              </>
            ) : (
              <>
                {ruleCategoryItem(
                  currentRuleCategory,
                  t('ruleDialog.categories.' + currentRuleCategory)
                )}
              </>
            )}
          </div>
        </div>

        <DialogFooter>
          {currentRuleCategory !== 'all' && (
            <Button variant="outline" onClick={() => addRule(currentRuleCategory)}>
              <Plus className="w-4 h-4 mr-2" />
              {t('ruleDialog.addRule')}
            </Button>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('ruleDialog.cancel')}
          </Button>
          <Button onClick={handleSave}>{t('ruleDialog.save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

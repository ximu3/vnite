import { ChevronsUpDown } from 'lucide-react'
import * as React from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import { Textarea } from '@ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'

type Operator = 'and' | 'or' | 'not' | 'inCollection' | 'gameNameNot' | 'playStatusIs'

const RANDOM_GAME_FILTER_GUIDE_URL = 'https://vnite.ximu.dev/guide/random-game-filter'

export interface ValidationError {
  path: string
  code: string
}

function validateRuleObject(obj: any, path: string = 'root'): void {
  if (typeof obj !== 'object' || obj === null) {
    throw { path, code: 'not_object' } as ValidationError
  }

  const keys = Object.keys(obj)
  if (keys.length !== 1) {
    throw { path, code: 'must_have_single_key' } as ValidationError
  }

  const key = keys[0] as Operator
  const value = obj[key]

  if (!['and', 'or', 'not', 'inCollection', 'gameNameNot', 'playStatusIs'].includes(key)) {
    throw { path, code: 'invalid_operator' } as ValidationError
  }

  switch (key) {
    case 'and':
    case 'or':
      if (!Array.isArray(value)) {
        throw { path: `${path}.${key}`, code: 'must_be_array' } as ValidationError
      }
      for (let i = 0; i < value.length; i++) {
        validateRuleObject(value[i], `${path}.${key}[${i}]`)
      }
      break

    case 'not':
      validateRuleObject(value, `${path}.not`)
      break

    case 'inCollection':
    case 'gameNameNot':
    case 'playStatusIs':
      if (!Array.isArray(value)) {
        throw { path: `${path}.${key}`, code: 'must_be_array' } as ValidationError
      }
      for (let i = 0; i < value.length; i++) {
        if (typeof value[i] !== 'string') {
          throw { path: `${path}.${key}[${i}]`, code: 'must_be_string' } as ValidationError
        }
      }
      break
  }
}

function PresetSelecter({
  className,
  onSelectPreset
}: {
  className?: string
  onSelectPreset: (preset: string) => void
}): React.JSX.Element {
  const { t } = useTranslation('config')
  const [open, setOpen] = React.useState(false)

  const presets = [
    {
      value: 'default',
      label: t('advanced.randomGameRule.presets.default'),
      rules: `{
  "gameNameNot": ["game name"]
}`
    },
    {
      value: 'filterPlayStatus',
      label: t('advanced.randomGameRule.presets.filterPlayStatus'),
      rules: `{
  "and": [
    {
      "playStatusIs": ["playing", "unplayed", "finished", "partial", "multiple", "shelved"]
    },
    {
      "gameNameNot": ["game name"]
    }
  ]
}`
    },
    {
      value: 'filterCollection',
      label: t('advanced.randomGameRule.presets.filterCollection'),
      rules: `{
  "and": [
    {
      "inCollection": ["collection name"]
    },
    {
      "gameNameNot": ["game name"]
    }
  ]
}`
    }
  ]

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className={cn(className)} asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className=" justify-between items-center flex flex-row"
        >
          {t('advanced.randomGameRule.preset')}
          <ChevronsUpDown className="w-4 h-4 ml-2 opacity-50 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[150px] p-0">
        <Command>
          <CommandInput placeholder={t('advanced.randomGameRule.search')} />
          <CommandList>
            <CommandEmpty>{t('advanced.randomGameRule.noPresetFound')}</CommandEmpty>
            <CommandGroup>
              {presets.map((preset) => (
                <CommandItem
                  key={preset.value}
                  value={preset.value}
                  onSelect={() => {
                    onSelectPreset(preset.rules)
                    setOpen(false)
                  }}
                  className={cn('pl-5')}
                >
                  {preset.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function RandomFilter(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [randomGameRule, setRandomGameRule, saveRandomGameRule, setAndSaveRandomGameRule] =
    useConfigState('game.randomGameRule', true)

  const openGuide = (): void => {
    window.open(RANDOM_GAME_FILTER_GUIDE_URL, '_blank', 'noopener,noreferrer')
  }

  const validateRandomFilterRule = async (jsonStr: string): Promise<void> => {
    try {
      const obj = JSON.parse(jsonStr)
      setRandomGameRule(JSON.stringify(obj, null, 2))

      validateRuleObject(obj)
    } catch (e: any) {
      if (e && e.code && e.path) {
        throw e
      }
      throw { path: 'root', code: 'invalid_json' } as ValidationError
    }
  }

  const validateAndSave = async (): Promise<void> => {
    const promise = validateRandomFilterRule(randomGameRule)

    toast.promise(promise, {
      loading: t('advanced.randomGameRule.notifications.loading'),
      success: t('advanced.randomGameRule.notifications.completed'),
      error: (err) => {
        if (err && err.code && err.path) {
          return `${err.path} - ${t(`advanced.randomGameRule.notifications.error.${err.code}`)}`
        }
        return t(`advanced.randomGameRule.notifications.error.unknown`)
      }
    })
    promise.then(() => saveRandomGameRule()).catch(() => {})
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className={cn('relative')}>
          <div className={cn('flex flex-row justify-between items-center')}>
            <div className={cn('flex items-center gap-1')}>
              <span>{t('advanced.randomGameRule.title')}</span>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="bare"
                    size="icon-sm"
                    className={cn('group')}
                    onClick={openGuide}
                    aria-label={t('advanced.randomGameRule.openGuide')}
                  >
                    <span
                      className={cn('icon-[mdi--help-circle] size-4 group-hover:text-primary')}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {t('advanced.randomGameRule.openGuide')}
                </TooltipContent>
              </Tooltip>
            </div>
            <div className={cn('flex items-center flex-row gap-6')}>
              <Button variant="secondary" onClick={() => validateAndSave()}>
                {t('advanced.randomGameRule.validate')}
              </Button>
              <PresetSelecter
                onSelectPreset={(preset) => {
                  setAndSaveRandomGameRule(preset)
                }}
              />
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Textarea
          spellCheck={false}
          value={randomGameRule}
          onChange={(e) => setRandomGameRule(e.target.value)}
          onBlur={() => validateAndSave()}
          className="w-full h-[calc(85vh-100px)] resize-none font-mono"
        />
      </CardContent>
    </Card>
  )
}

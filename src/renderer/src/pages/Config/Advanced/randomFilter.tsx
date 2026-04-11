import { Button } from '@ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@ui/card'
import { Textarea } from '@ui/textarea'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useConfigState } from '~/hooks'
import { cn } from '~/utils'
import { PresetSelecter } from './PresetSelecter'

type Operator = 'and' | 'or' | 'not' | 'inCollection' | 'gameNameNot' | 'playStatusIs'

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

export function RandomFilter(): React.JSX.Element {
  const { t } = useTranslation('config')
  const [randomGameRule, setRandomGameRule, saveRandomGameRule, setAndSaveRandomGameRule] =
    useConfigState('game.randomGameRule', true)

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
            <div className={cn('flex items-center')}>{t('advanced.randomGameRule.title')}</div>
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

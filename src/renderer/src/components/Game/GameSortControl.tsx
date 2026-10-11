import { useTranslation } from 'react-i18next'

import type { gameCollectionDoc, GameSortField } from '@appTypes/models'
import { Button } from '@ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@ui/popover'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@ui/select'
import { cn } from '~/utils'

const SORT_FIELD_TRANSLATION_KEYS: Record<GameSortField | 'custom', string> = {
  'metadata.name': 'name',
  'metadata.sortName': 'sortName',
  'metadata.developers': 'developers',
  'metadata.releaseDate': 'releaseDate',
  'record.lastRunDate': 'lastRunDate',
  'record.addDate': 'addDate',
  'record.playTime': 'playTime',
  'record.score': 'score',
  'record.storageSize': 'storageSize',
  'record.playStatus': 'playStatus',
  custom: 'custom'
}

export function GameSortFieldSelect<Field extends GameSortField | 'custom'>({
  value,
  fields,
  onValueChange,
  triggerClassName
}: {
  value: Field
  fields: readonly Field[]
  onValueChange: (value: Field) => void
  triggerClassName?: string
}): React.JSX.Element {
  const { t } = useTranslation('game')

  return (
    <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue as Field)}>
      <SelectTrigger className={triggerClassName}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {fields.map((field) => (
            <SelectItem key={field} value={field}>
              {t(`showcase.sorting.options.${SORT_FIELD_TRANSLATION_KEYS[field]}`)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export function SortDirectionButton({
  order,
  onOrderChange,
  className,
  disabled = false
}: {
  order: 'asc' | 'desc'
  onOrderChange: (order: 'asc' | 'desc') => void
  className?: string
  disabled?: boolean
}): React.JSX.Element {
  return (
    <Button
      variant="thirdary"
      size="icon"
      className={className}
      disabled={disabled}
      onClick={() => onOrderChange(order === 'asc' ? 'desc' : 'asc')}
    >
      <span
        className={cn(
          order === 'asc' ? 'icon-[mdi--arrow-up]' : 'icon-[mdi--arrow-down]',
          'w-4 h-4'
        )}
      />
    </Button>
  )
}

interface SecondarySortFieldsProps {
  primaryBy: GameSortField | 'custom'
  value: gameCollectionDoc['secondarySort']
  fields: readonly GameSortField[]
  onValueChange: (value: gameCollectionDoc['secondarySort']) => void
}

export function SecondarySortFields({
  primaryBy,
  value,
  fields,
  onValueChange,
  layout
}: SecondarySortFieldsProps & {
  layout: 'inline' | 'popover'
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const availableFields = fields.filter((field) => field !== primaryBy)

  return (
    <>
      <Select
        value={value?.by ?? '__none__'}
        onValueChange={(nextValue) => {
          if (nextValue === '__none__') {
            onValueChange(null)
            return
          }

          onValueChange({
            by: nextValue as GameSortField,
            order: value?.order ?? 'asc'
          })
        }}
      >
        <SelectTrigger
          className={cn(
            'h-[26px] text-xs min-h-0',
            layout === 'inline' ? 'w-full' : 'w-[130px] border-0'
          )}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">{t('sortingControls.none')}</SelectItem>
          {availableFields.map((field) => (
            <SelectItem key={field} value={field}>
              {t(`showcase.sorting.options.${SORT_FIELD_TRANSLATION_KEYS[field]}`)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <SortDirectionButton
        order={value?.order ?? 'asc'}
        disabled={!value}
        className="h-[26px] w-[26px]"
        onOrderChange={(order) => {
          if (value) onValueChange({ ...value, order })
        }}
      />
    </>
  )
}

export function SecondarySortControl({
  primaryBy,
  value,
  fields,
  onValueChange
}: SecondarySortFieldsProps): React.JSX.Element {
  const { t } = useTranslation('game')

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="thirdary"
          size="icon"
          className={cn('h-[26px] w-[26px] -ml-4', value && 'text-primary')}
        >
          <span className="icon-[mdi--sort-variant] w-4 h-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto p-2">
        <div className="flex flex-row items-center gap-2">
          <div className=" px-2 py-1.5 text-sm whitespace-nowrap">
            {t('sortingControls.secondary')}
          </div>
          <SecondarySortFields
            primaryBy={primaryBy}
            value={value}
            fields={fields}
            onValueChange={onValueChange}
            layout="popover"
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}

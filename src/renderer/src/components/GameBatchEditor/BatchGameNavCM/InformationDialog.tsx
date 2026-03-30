import { METADATA_EXTRA_PREDEFINED_KEYS } from '@appTypes/models'
import { ArrayInput } from '@ui/array-input'
import { Button } from '@ui/button'
import { Checkbox } from '@ui/checkbox'
import { Dialog, DialogContent, DialogTrigger } from '@ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@ui/dropdown-menu'
import { Input } from '@ui/input'
import { Label } from '@ui/label'
import { Separator } from '@ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@ui/tooltip'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useGameState } from '~/hooks'
import { getAllExtraKeys } from '~/stores/game'
import { cn } from '~/utils'

export function InformationDialog({
  gameIds,
  isOpen,
  setIsOpen,
  children
}: {
  gameIds: string[]
  isOpen: boolean
  setIsOpen: (value: boolean) => void
  children?: React.ReactNode
}): React.JSX.Element {
  const { t } = useTranslation('game')
  const [editMode, setEditMode] = useState<'incremental' | 'replace' | 'delete'>('incremental')
  const [developers, setDevelopers] = useState<string[]>([])
  const [publishers, setPublishers] = useState<string[]>([])
  const [genres, setGenres] = useState<string[]>([])
  const [platforms, setPlatforms] = useState<string[]>([])
  const [extraKey, setExtraKey] = useState('')
  const [extraValue, setExtraValue] = useState<string[]>([])
  const [fieldsToClear, setFieldsToClear] = useState<string[]>([])

  const gameStates = gameIds.map((gameId) => ({
    // eslint-disable-next-line react-hooks/rules-of-hooks
    developers: useGameState(gameId, 'metadata.developers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    publishers: useGameState(gameId, 'metadata.publishers'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    genres: useGameState(gameId, 'metadata.genres'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    platforms: useGameState(gameId, 'metadata.platforms'),
    // eslint-disable-next-line react-hooks/rules-of-hooks
    extra: useGameState(gameId, 'metadata.extra')
  }))

  const extraKeyForSelect = Array.from(
    new Set([
      ...METADATA_EXTRA_PREDEFINED_KEYS.map((key) =>
        t(`detail.overview.extraInformation.fields.${key}`, key)
      ),
      ...getAllExtraKeys().sort((a, b) => a.localeCompare(b))
    ])
  )

  const extraKeyForDelete = getAllExtraKeys(gameIds).sort((a, b) => a.localeCompare(b))

  function sanitizeArray(list: string[]): string[] {
    // The list may contain empty strings, either from legacy/incorrect data
    // or from user input in ArrayInput (e.g., trailing commas).
    // We sanitize the value here to remove empty strings and maintain consistent metadata.
    return list.map((s) => s.trim()).filter((s) => s.length > 0)
  }

  const handleConfirm = async (): Promise<void> => {
    try {
      gameStates.forEach(
        ({
          developers: [currentDevelopers, setGameDevelopers],
          publishers: [currentPublishers, setGamePublishers],
          genres: [currentGenres, setGameGenres],
          platforms: [currentPlatforms, setGamePlatforms],
          extra: [currentExtra, setGameExtra]
        }) => {
          const updateField = (
            fieldName: string,
            current: string[],
            toUpdate: string[],
            setter: (val: string[]) => void
          ): void => {
            if (editMode === 'delete') {
              // In delete mode, clear the field if selected
              if (fieldsToClear.includes(fieldName)) {
                setter([])
              }
              return
            }
            if (toUpdate.length === 0) return

            let next: string[]
            if (editMode === 'incremental') {
              next = [...new Set([...current, ...toUpdate])]
            } else if (editMode === 'replace') {
              next = toUpdate
            } else {
              return
            }
            setter(sanitizeArray(next))
          }

          updateField('developers', currentDevelopers, developers, setGameDevelopers)
          updateField('publishers', currentPublishers, publishers, setGamePublishers)
          updateField('genres', currentGenres, genres, setGameGenres)
          updateField('platforms', currentPlatforms, platforms, setGamePlatforms)

          // Handle extra fields in delete mode
          if (editMode === 'delete') {
            const extraFieldsToClear = fieldsToClear
              .filter((field) => field.startsWith('extra.'))
              .map((field) => field.replace('extra.', ''))

            if (extraFieldsToClear.length > 0) {
              const newGameExtra = currentExtra.filter(
                (item) => !extraFieldsToClear.includes(item.key)
              )
              setGameExtra(newGameExtra)
            }
          } else {
            if (extraKey.trim() !== '' && extraValue.length > 0) {
              const newGameExtra = currentExtra.map((item) => ({
                key: item.key,
                value: [...item.value]
              }))

              const existingItem = newGameExtra.find((item) => item.key === extraKey)
              if (existingItem) {
                existingItem.value = sanitizeArray(
                  editMode === 'incremental'
                    ? [...new Set([...existingItem.value, ...extraValue])]
                    : extraValue
                )
              } else {
                newGameExtra.push({ key: extraKey, value: sanitizeArray(extraValue) })
              }

              setGameExtra(newGameExtra)
            }
          }
        }
      )

      setIsOpen(false)
      setDevelopers([])
      setPublishers([])
      setGenres([])
      setPlatforms([])
      setExtraKey('')
      setExtraValue([])
      setFieldsToClear([])

      toast.success(t('batchEditor.information.success'))
    } catch (error) {
      console.error('Failed to update games:', error)
      if (error instanceof Error) {
        toast.error(t('batchEditor.information.error', { message: error.message }))
      } else {
        toast.error(t('batchEditor.information.error', { message: 'An unknown error occurred' }))
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {children && <DialogTrigger className={cn('w-full')}>{children}</DialogTrigger>}
      <DialogContent className="w-[500px] flex flex-col">
        {/* Mode Selection */}
        <div className="grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 pt-5 items-center text-sm">
          <div className={cn('whitespace-nowrap select-none justify-self-start')}>
            {t('batchEditor.information.mode.title')}
          </div>
          <Tabs
            value={editMode}
            onValueChange={(v) => setEditMode(v as 'incremental' | 'replace' | 'delete')}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="incremental">
                {t('batchEditor.information.mode.incremental')}
              </TabsTrigger>
              <TabsTrigger value="replace">{t('batchEditor.information.mode.replace')}</TabsTrigger>
              <TabsTrigger value="delete">{t('batchEditor.information.mode.delete')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <Separator className="my-4 col-span-2" />
        </div>

        {editMode !== 'delete' ? (
          <div
            className={cn('grid grid-cols-[auto_1fr] gap-y-3 gap-x-4 px-3 items-center text-sm')}
          >
            {[
              {
                id: 'developers',
                value: developers,
                setter: setDevelopers
              },
              {
                id: 'publishers',
                value: publishers,
                setter: setPublishers
              },
              {
                id: 'platforms',
                value: platforms,
                setter: setPlatforms
              },
              {
                id: 'genres',
                value: genres,
                setter: setGenres
              }
            ].map((field) => (
              <div key={field.id} className="contents">
                <div className={cn('whitespace-nowrap select-none justify-self-start')}>
                  {t(`batchEditor.information.${field.id}`)}
                </div>
                <ArrayInput
                  value={field.value}
                  onChange={field.setter}
                  placeholder={t(`batchEditor.information.placeholder.${field.id}`)}
                  tooltipText={t(`batchEditor.information.tooltip.${field.id}`)}
                />
              </div>
            ))}
            <div className="col-span-2 flex gap-1 items-center mt-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className={cn('flex-shrink-0')}>
                    <span className={cn('icon-[mdi--lightning-bolt] w-4 h-4')}></span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <div className={cn('max-h-[288px] overflow-auto scrollbar-base-thin')}>
                    {extraKeyForSelect.map((key) => (
                      <DropdownMenuItem key={key} onClick={() => setExtraKey(key)}>
                        {key}
                      </DropdownMenuItem>
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
              <Tooltip>
                <TooltipTrigger>
                  <Input
                    value={extraKey}
                    onChange={(e) => setExtraKey(e.target.value)}
                    placeholder={t('detail.overview.extraInformation.enterKey')}
                    className={cn('w-30')}
                  />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <div className="text-xs">{t('batchEditor.information.tooltip.extraKey')}</div>
                </TooltipContent>
              </Tooltip>

              <ArrayInput
                value={extraValue}
                onChange={(value) => setExtraValue(value)}
                placeholder={t('detail.overview.extraInformation.enterValue')}
                tooltipText={t('detail.overview.extraInformation.valueTip')}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium">{t('batchEditor.information.clearFields')}</div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'developers', label: t('batchEditor.information.developers') },
                { id: 'publishers', label: t('batchEditor.information.publishers') },
                { id: 'platforms', label: t('batchEditor.information.platforms') },
                { id: 'genres', label: t('batchEditor.information.genres') },
                ...extraKeyForDelete.map((key) => ({
                  id: `extra.${key}`,
                  label: key
                }))
              ].map((field) => {
                const safeId = `clear-${encodeURIComponent(field.id)}`

                return (
                  <div key={field.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={safeId}
                      checked={fieldsToClear.includes(field.id)}
                      onCheckedChange={(checked) => {
                        setFieldsToClear(
                          checked
                            ? [...fieldsToClear, field.id]
                            : fieldsToClear.filter((f) => f !== field.id)
                        )
                      }}
                    />
                    <Label htmlFor={safeId} className="text-sm">
                      {field.label}
                    </Label>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Confirm Button */}
        <div className={cn('flex justify-end mt-auto')}>
          <Button onClick={handleConfirm}>{t('utils:common.confirm')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

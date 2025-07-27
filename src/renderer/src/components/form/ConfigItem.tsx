import React, { useCallback } from 'react'
import { useStateHook } from './useStateHook'
import type { ConfigItemProps, HookType, DocType } from './types'
import type { Paths } from 'type-fest'
import { Card, CardContent } from '@ui/card'
import { Input } from '@ui/input'
import { Textarea } from '@ui/textarea'
import { Switch } from '@ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/select'
import { DateTimeInput } from '@ui/date-input'
import { ArrayEditor } from '@ui/array-editor'
import { Slider } from '@ui/slider'
import { Button } from '@ui/button'
import { HotkeySetting } from '@ui/hotkey-setting'
import { cn } from '~/utils'
import { ipcManager } from '~/app/ipc'

export function ConfigItem<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
>(props: ConfigItemProps<T, Path>): React.ReactElement {
  const {
    hookType,
    path,
    gameId,
    collectionId,
    pluginId,
    defaultValue,
    title,
    description,
    controlType,
    disabled = false,
    className = '',
    controlClassName = '',
    onChange
  } = props
  const [value, setValue, save, setValueAndSave] = useStateHook(
    hookType,
    path,
    gameId as T extends 'game' | 'gameLocal' ? string : undefined,
    collectionId as T extends 'gameCollection' ? string : undefined,
    pluginId as T extends 'plugin' ? string : undefined,
    defaultValue as T extends 'plugin' ? any : undefined,
    true
  )

  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputType = controlType === 'input' ? (props as any).inputType || 'text' : 'text'
      const newValue = inputType === 'number' ? Number(e.target.value) : e.target.value
      setValue(newValue as any)
    },
    [setValue, controlType, props, onChange]
  )

  const handleTextareaChange = useCallback(
    async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value
      setValue(newValue as any)
    },
    [setValue, onChange]
  )

  const handleSwitchChange = useCallback(
    async (checked: boolean) => {
      await setValueAndSave(checked as any)
      if (onChange) {
        await onChange(checked)
      }
    },
    [setValueAndSave, onChange]
  )

  const handleSelectChange = useCallback(
    async (value: string) => {
      // Convert string values to boolean if necessary
      if (value === 'true') {
        await setValueAndSave(true as any)
      } else if (value === 'false') {
        await setValueAndSave(false as any)
      } else {
        await setValueAndSave(value as any)
      }
      if (onChange) {
        await onChange(value)
      }
    },
    [setValueAndSave, onChange]
  )

  const handleDateInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value
      setValue(newValue as any)
    },
    [setValue, onChange]
  )

  const handleArrayChange = useCallback(
    async (newArray: string[]) => {
      await setValueAndSave(newArray as any)
      if (onChange) {
        await onChange(newArray)
      }
    },
    [setValueAndSave, onChange]
  )

  const handleSliderChange = useCallback(
    async (values: number[]) => {
      const newValue = values[0]
      setValue(newValue as any)
    },
    [setValue]
  )

  const handleSliderCommit = useCallback(
    async (values: number[]) => {
      const newValue = values[0]
      await save()
      if (onChange) {
        await onChange(newValue)
      }
    },
    [save, onChange]
  )

  const handleFileSelect = useCallback(
    async (
      dialogType: 'openFile' | 'openDirectory' = 'openFile',
      _filters?: Array<{ name: string; extensions: string[] }>
    ) => {
      try {
        const selectedPath = await ipcManager.invoke('system:select-path-dialog', [dialogType])
        if (selectedPath) {
          await setValueAndSave(selectedPath as any)
          if (onChange) {
            await onChange(selectedPath)
          }
        }
      } catch (error) {
        console.error('Failed to select file:', error)
      }
    },
    [setValueAndSave, onChange]
  )

  const handleHotkeyChange = useCallback(
    async (newHotkey: string) => {
      await setValueAndSave(newHotkey as any)
      if (onChange) {
        await onChange(newHotkey)
      }
    },
    [setValueAndSave, onChange]
  )

  const handleBlur = useCallback(
    async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      await save()
      if (onChange) {
        await onChange(e.target.value)
      }
    },
    [save]
  )

  const renderControl = (): React.ReactElement => {
    const displayValue = value === null || value === undefined ? '' : value

    switch (controlType) {
      case 'input': {
        const inputProps = props as ConfigItemProps<T, Path> & { controlType: 'input' }
        const inputType = inputProps.inputType || 'text'
        const placeholder = inputProps.placeholder

        return (
          <Input
            type={inputType}
            value={String(displayValue)}
            onChange={handleInputChange}
            onBlur={(e) => handleBlur(e)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn('max-w-xs', controlClassName)}
          />
        )
      }

      case 'textarea': {
        const textareaProps = props as ConfigItemProps<T, Path> & { controlType: 'textarea' }
        const placeholder = textareaProps.placeholder
        const rows = textareaProps.rows || 3

        return (
          <Textarea
            value={String(displayValue)}
            onChange={handleTextareaChange}
            onBlur={(e) => handleBlur(e)}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={cn('max-w-xs', controlClassName)}
          />
        )
      }

      case 'switch':
        return (
          <Switch
            checked={Boolean(displayValue)}
            onCheckedChange={handleSwitchChange}
            disabled={disabled}
            className={controlClassName}
          />
        )

      case 'select': {
        const selectProps = props as ConfigItemProps<T, Path> & { controlType: 'select' }

        return (
          <Select
            value={String(displayValue)}
            onValueChange={handleSelectChange}
            disabled={disabled}
          >
            <SelectTrigger className={cn('max-w-xs', controlClassName)}>
              <SelectValue placeholder={selectProps.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {selectProps.options.map((option) => (
                <SelectItem key={option.value} value={String(option.value)}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      }

      case 'dateinput': {
        const dateInputProps = props as ConfigItemProps<T, Path> & { controlType: 'dateinput' }

        return (
          <DateTimeInput
            value={String(displayValue)}
            onChange={handleDateInputChange}
            onBlur={(e) => handleBlur(e)}
            placeholder={dateInputProps.placeholder}
            disabled={disabled}
            className={cn('max-w-xs', controlClassName)}
          />
        )
      }

      case 'arrayeditor': {
        const arrayProps = props as ConfigItemProps<T, Path> & { controlType: 'arrayeditor' }

        return (
          <ArrayEditor
            value={Array.isArray(displayValue) ? displayValue : []}
            onChange={handleArrayChange}
            placeholder={arrayProps.arrayEditorPlaceholder}
            tooltipText={arrayProps.arrayEditorTooltipText}
            dialogTitle={arrayProps.arrayEditorDialogTitle}
            dialogPlaceholder={arrayProps.arrayEditorDialogPlaceholder}
            className={cn('max-w-xs', controlClassName)}
          />
        )
      }

      case 'slider': {
        const sliderProps = props as ConfigItemProps<T, Path> & { controlType: 'slider' }
        const min = sliderProps.min ?? 0
        const max = sliderProps.max ?? 100
        const step = sliderProps.step ?? 1
        const formatValue = sliderProps.formatValue ?? ((value: number) => String(value))

        return (
          <div className={cn('flex items-center gap-2 w-[250px]', controlClassName)}>
            <Slider
              value={[typeof displayValue === 'number' ? displayValue : 0]}
              min={min}
              max={max}
              step={step}
              onValueChange={handleSliderChange}
              onValueCommit={handleSliderCommit}
              disabled={disabled}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12 text-right">
              {formatValue(typeof displayValue === 'number' ? displayValue : 0)}
            </span>
          </div>
        )
      }

      case 'custom': {
        const customProps = props as ConfigItemProps<T, Path> & { controlType: 'custom' }
        return <div className={controlClassName}>{customProps.customControl}</div>
      }

      case 'fileinput': {
        const fileInputProps = props as ConfigItemProps<T, Path> & { controlType: 'fileinput' }
        const dialogType = fileInputProps.dialogType || 'openFile'
        const filters = fileInputProps.dialogFilters
        const buttonIcon = fileInputProps.buttonIcon || 'icon-[mdi--file-outline]'
        const buttonTooltip = fileInputProps.buttonTooltip

        return (
          <div className={cn('flex flex-row gap-3', controlClassName)}>
            <Input
              value={String(displayValue)}
              onChange={handleInputChange}
              onBlur={(e) => handleBlur(e)}
              placeholder={fileInputProps.placeholder}
              disabled={disabled}
              className="flex-1 min-w-[300px]"
            />
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleFileSelect(dialogType, filters)}
              disabled={disabled}
              title={buttonTooltip}
            >
              <span className={cn(buttonIcon, 'w-5 h-5')}></span>
            </Button>
          </div>
        )
      }

      case 'hotkey': {
        const hotkeyProps = props as ConfigItemProps<T, Path> & { controlType: 'hotkey' }

        return (
          <HotkeySetting
            defaultHotkey={String(displayValue)}
            onHotkeyChange={handleHotkeyChange}
            inputClassName={hotkeyProps.inputClassName}
            className={controlClassName}
          />
        )
      }

      default:
        return <div>Unknown control type</div>
    }
  }

  return (
    <Card className={cn('w-full pb-5 shadow-sm bg-card/20', className)}>
      <CardContent className="flex items-center justify-between">
        <div className="flex-col flex items-start justify-center gap-1">
          <div className="text-sm font-medium leading-none">{title}</div>
          {description && <div className="text-sm text-muted-foreground">{description}</div>}
        </div>
        <div className="flex-shrink-0 ml-6">{renderControl()}</div>
      </CardContent>
    </Card>
  )
}

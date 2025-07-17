import type {
  configDocs,
  configLocalDocs,
  gameDoc,
  gameLocalDoc,
  gameCollectionDoc
} from '@appTypes/models'
import type { Paths } from 'type-fest'
import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

// Hook类型定义
export type HookType = 'config' | 'configLocal' | 'game' | 'gameLocal' | 'gameCollection' | 'plugin'

// 根据hook类型获取对应的文档类型
export type DocType<T extends HookType> = T extends 'config'
  ? configDocs
  : T extends 'configLocal'
    ? configLocalDocs
    : T extends 'game'
      ? gameDoc
      : T extends 'gameLocal'
        ? gameLocalDoc
        : T extends 'gameCollection'
          ? gameCollectionDoc
          : T extends 'plugin'
            ? Record<string, any>
            : never

// 基础组件props
export interface BaseFormFieldProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> {
  hookType: T
  path: Path
  gameId?: T extends 'game' | 'gameLocal' ? string : never
  collectionId?: T extends 'gameCollection' ? string : never
  pluginId?: T extends 'plugin' ? string : never
  label?: string
  disabled?: boolean
  className?: string
}

// Input组件props
export interface FormInputProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> extends BaseFormFieldProps<T, Path>,
    Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  type?: 'text' | 'number' | 'email' | 'password' | 'url'
}

// Textarea组件props
export interface FormTextareaProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> extends BaseFormFieldProps<T, Path>,
    Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'value' | 'onChange'> {}

// ConfigItem控件类型
export type ControlType =
  | 'input'
  | 'textarea'
  | 'switch'
  | 'select'
  | 'dateinput'
  | 'arrayeditor'
  | 'slider'
  | 'custom'
  | 'fileinput'
  | 'hotkey'

// 基础ConfigItem props
interface BaseConfigItemProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> extends BaseFormFieldProps<T, Path> {
  title: string
  description?: string
  controlClassName?: string
  onChange?: (value: any) => void | Promise<void>
}

// Input控件特定props
interface InputConfigProps {
  controlType: 'input'
  inputType?: 'text' | 'number' | 'email' | 'password' | 'url'
  placeholder?: string
}

// Textarea控件特定props
interface TextareaConfigProps {
  controlType: 'textarea'
  placeholder?: string
  rows?: number
}

// Switch控件特定props
interface SwitchConfigProps {
  controlType: 'switch'
}

// Select控件特定props
interface SelectConfigProps {
  controlType: 'select'
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

// DateInput控件特定props
interface DateInputConfigProps {
  controlType: 'dateinput'
  placeholder?: string
}

// ArrayEditor控件特定props
interface ArrayEditorConfigProps {
  controlType: 'arrayeditor'
  arrayEditorPlaceholder?: string
  arrayEditorTooltipText?: string
  arrayEditorDialogTitle?: string
  arrayEditorDialogPlaceholder?: string
}

// Slider控件特定props
interface SliderConfigProps {
  controlType: 'slider'
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
  debounceMs?: number
}

// Custom控件特定props - 纯样式，由用户传入自定义控件
interface CustomConfigProps {
  controlType: 'custom'
  customControl: React.ReactNode
}

// FileInput控件特定props - 带文件选择对话框的输入框
interface FileInputConfigProps {
  controlType: 'fileinput'
  placeholder?: string
  dialogFilters?: Array<{ name: string; extensions: string[] }>
  dialogType?: 'openFile' | 'openDirectory'
  buttonIcon?: string
  buttonTooltip?: string
}

// Hotkey控件特定props - 快捷键设置控件
interface HotkeyConfigProps {
  controlType: 'hotkey'
  inputClassName?: string
}

// ConfigItem组件props - 根据controlType进行联合类型
export type ConfigItemProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> = BaseConfigItemProps<T, Path> &
  (
    | InputConfigProps
    | TextareaConfigProps
    | SwitchConfigProps
    | SelectConfigProps
    | DateInputConfigProps
    | ArrayEditorConfigProps
    | SliderConfigProps
    | CustomConfigProps
    | FileInputConfigProps
    | HotkeyConfigProps
  )

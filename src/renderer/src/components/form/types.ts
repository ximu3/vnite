import type {
  configDocs,
  configLocalDocs,
  gameDoc,
  gameLocalDoc,
  gameCollectionDoc
} from '@appTypes/models'
import type { Paths } from 'type-fest'

export type HookType = 'config' | 'configLocal' | 'game' | 'gameLocal' | 'gameCollection' | 'plugin'

// According to the hook type, return the corresponding document type
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

export interface BaseFormFieldProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> {
  hookType: T
  path: Path
  gameId?: T extends 'game' | 'gameLocal' ? string : never
  collectionId?: T extends 'gameCollection' ? string : never
  pluginId?: T extends 'plugin' ? string : never
  defaultValue?: T extends 'plugin' ? any : never
  label?: string
  disabled?: boolean
  className?: string
}

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

interface BaseConfigItemProps<
  T extends HookType,
  Path extends Paths<DocType<T>, { bracketNotation: true }>
> extends BaseFormFieldProps<T, Path> {
  title: string
  description?: string
  controlClassName?: string
  onChange?: (value: any) => void | Promise<void>
}

interface InputConfigProps {
  controlType: 'input'
  inputType?: 'text' | 'number' | 'email' | 'password' | 'url'
  placeholder?: string
}

interface TextareaConfigProps {
  controlType: 'textarea'
  placeholder?: string
  rows?: number
}

interface SwitchConfigProps {
  controlType: 'switch'
}

interface SelectConfigProps {
  controlType: 'select'
  options: Array<{ value: string | number; label: string }>
  placeholder?: string
}

interface DateInputConfigProps {
  controlType: 'dateinput'
  placeholder?: string
}

interface ArrayEditorConfigProps {
  controlType: 'arrayeditor'
  arrayEditorPlaceholder?: string
  arrayEditorTooltipText?: string
  arrayEditorDialogTitle?: string
  arrayEditorDialogPlaceholder?: string
}

interface SliderConfigProps {
  controlType: 'slider'
  min?: number
  max?: number
  step?: number
  formatValue?: (value: number) => string
  debounceMs?: number
}

interface CustomConfigProps {
  controlType: 'custom'
  customControl: React.ReactNode
}

interface FileInputConfigProps {
  controlType: 'fileinput'
  placeholder?: string
  dialogFilters?: Array<{ name: string; extensions: string[] }>
  dialogType?: 'openFile' | 'openDirectory'
  buttonIcon?: string
  buttonTooltip?: string
}

interface HotkeyConfigProps {
  controlType: 'hotkey'
  inputClassName?: string
}

interface CheckboxesProps {
  controlType: 'checkboxes'
  values: Array<{ value: string; label: string }>
}

// Combine all config item props into a single type
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
    | CheckboxesProps
  )

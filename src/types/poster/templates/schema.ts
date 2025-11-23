type FieldType = 'checkbox' | 'number' | 'text' | 'color'

interface BaseField<T, K extends keyof T = keyof T> {
  key: K
  type: Exclude<FieldType, 'number'>
  min?: number
  max?: number
  step?: number
}

interface NumberField<T, K extends keyof T = keyof T> {
  key: K
  type: 'number'
  min: number
  max: number
  step: number
}

export type FieldSchema<T, K extends keyof T = keyof T> = BaseField<T, K> | NumberField<T, K>

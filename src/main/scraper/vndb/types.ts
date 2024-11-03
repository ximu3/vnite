// 基础字段定义
export type VNDBBaseField =
  | 'id'
  | 'title'
  | 'released'
  | 'languages'
  | 'platforms'
  | 'aliases'
  | 'length'
  | 'description'
  | 'rating'
  | 'popularity'

// 定义可嵌套字段的子字段
export type VNDBNestedFields = {
  titles: {
    title: string
    main: boolean
    lang: string
    latin: string | null
    official: boolean
  }
  developers: {
    id: string
    name: string
    original: string | null
  }
  tags: {
    id: string
    name: string
    rating: number
  }
  screenshots: {
    url: string
    sexual: boolean
    violence: boolean
  }
  image: {
    url: string
  }
  extlinks: {
    url: string
    label: string
  }
}

// 基础字段类型
type VNDBBaseFieldTypes = {
  id: string
  title: string
  released: string | null
  languages: string[]
  platforms: string[]
  aliases: string[]
  length: number
  description: string
  rating: number
  popularity: number
}

// 提取指定的属性
type PickProperties<T, K extends string> = K extends keyof T ? Pick<T, K & keyof T> : never

// 获取字段名（去除花括号语法）
type GetFieldName<T extends string> = T extends `${infer Field}{${string}}` ? Field : T

// 解析花括号内的属性
type ParseBraceProps<
  Field extends keyof VNDBNestedFields,
  Props extends string
> = Props extends `${infer P},${infer Rest}`
  ? PickProperties<VNDBNestedFields[Field], P & keyof VNDBNestedFields[Field]> &
      ParseBraceProps<Field, Rest>
  : PickProperties<VNDBNestedFields[Field], Props & keyof VNDBNestedFields[Field]>

// 解析字段
type ParseField<T extends string> = T extends `${infer Field}{${infer Props}}`
  ? Field extends keyof VNDBNestedFields
    ? Array<ParseBraceProps<Field, Props>>
    : never
  : T extends keyof VNDBNestedFields
    ? VNDBNestedFields[T][]
    : T extends `${infer Field}.${infer Prop}`
      ? Field extends keyof VNDBNestedFields
        ? Prop extends keyof VNDBNestedFields[Field]
          ? VNDBNestedFields[Field][Prop]
          : never
        : never
      : T extends VNDBBaseField
        ? VNDBBaseFieldTypes[T]
        : never

// 组合所有可能的字段类型
export type VNDBField =
  | VNDBBaseField
  | keyof VNDBNestedFields
  | `${keyof VNDBNestedFields}.${string}`
  | `${keyof VNDBNestedFields}{${string}}`

// 定义响应类型
export type VNDBResponse<T extends readonly VNDBField[]> = {
  results: Array<{
    [K in T[number] as GetFieldName<K>]: ParseField<K>
  }>
}

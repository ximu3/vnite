import { get } from 'lodash'

export function getNestedValue(obj: any, path: string[]): any {
  return get(obj, path)
}

export function setNestedValue(obj: any, path: string[], value: any): any {
  if (path.length === 0) return value

  const result = { ...obj }
  let current = result

  for (let i = 0; i < path.length - 1; i++) {
    const key = path[i]
    current[key] = current[key] ?? {}
    current[key] = { ...current[key] }
    current = current[key]
  }

  const lastKey = path[path.length - 1]
  current[lastKey] = value

  return result
}

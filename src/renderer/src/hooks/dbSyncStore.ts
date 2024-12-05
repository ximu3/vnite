import { create } from 'zustand'
import { ipcInvoke, debouncedIpcInvoke, ipcOnUnique } from '~/utils'
import { toast } from 'sonner'

const NOT_SET = Symbol('NOT_SET')

type DBSyncStore = {
  values: Record<string, any>
  subscriptions: Record<
    string,
    {
      dbName: string
      path: string[]
      initialValue: any
      removeListener?: () => void
    }
  >
  ensureSubscription: (key: string, dbName: string, path: string[], initialValue: any) => void
  removeSubscription: (key: string) => void
  getValue: (key: string) => any
  setValue: (key: string, value: any, dbName: string, path: string[]) => Promise<void>
}

const useDBSyncStore = create<DBSyncStore>((set, get) => ({
  values: {},
  subscriptions: {},

  ensureSubscription: (key, dbName, path, initialValue): void => {
    const state = get()

    // 如果订阅已存在，直接返回
    if (state.subscriptions[key]) {
      return
    }

    const fetchAndSetValue = async (): Promise<void> => {
      try {
        const value = await ipcInvoke('get-db-value', dbName, path, initialValue)
        set((state) => ({
          values: { ...state.values, [key]: value }
        }))
        console.log(`Fetched DB ${key} value:`, value)
      } catch (error) {
        console.error('Failed to get DB value:', error)
        if (error instanceof Error) {
          toast.error(`Failed to get DB value: ${error.message}`)
        } else {
          toast.error('Failed to get DB value: An unknown error occurred')
        }
        set((state) => ({
          values: { ...state.values, [key]: initialValue }
        }))
      }
    }

    // 设置更新监听器
    const removeListener = ipcOnUnique('reload-db-values', async (_event, updatedDbName) => {
      if (updatedDbName === dbName) {
        await fetchAndSetValue()
        console.log(`Reloaded DB ${key} value`)
      }
    })

    // 保存订阅信息
    set((state) => ({
      subscriptions: {
        ...state.subscriptions,
        [key]: {
          dbName,
          path,
          initialValue,
          removeListener
        }
      }
    }))

    // 初始化值
    if (get().values[key] === undefined) {
      fetchAndSetValue()
    }
  },

  removeSubscription: (key): void => {
    const state = get()
    const subscription = state.subscriptions[key]

    if (subscription?.removeListener) {
      subscription.removeListener()
    }

    set((state) => {
      const { [key]: _, ...remainingSubscriptions } = state.subscriptions
      const { [key]: __, ...remainingValues } = state.values
      return {
        subscriptions: remainingSubscriptions,
        values: remainingValues
      }
    })
  },

  getValue: (key): void => {
    return get().values[key] ?? NOT_SET
  },

  setValue: async (key, value, dbName, path): Promise<void> => {
    const previousValue = get().values[key]

    // 立即更新本地状态
    set((state) => ({
      values: { ...state.values, [key]: value }
    }))

    // 尝试更新数据库
    try {
      await debouncedIpcInvoke('set-db-value', dbName, path, value)
    } catch (error) {
      console.error('Failed to set DB value:', error)
      // 恢复之前的值
      set((state) => ({
        values: { ...state.values, [key]: previousValue }
      }))
      if (error instanceof Error) {
        toast.error(`Failed to set DB value: ${error.message}`)
      } else {
        toast.error('Failed to set DB value: An unknown error occurred')
      }
      throw error
    }
  }
}))

export function useDBSyncedState<T>(
  initialValue: T,
  dbName: string,
  path: string[]
): [T, (value: T) => Promise<void>] {
  const key = `${dbName}:${path.join('.')}`

  // 确保订阅存在
  useDBSyncStore.getState().ensureSubscription(key, dbName, path, initialValue)

  // 获取值
  const value = useDBSyncStore((state) => state.getValue(key))

  // 创建更新函数
  const setValue = async (newValue: T): Promise<void> => {
    await useDBSyncStore.getState().setValue(key, newValue, dbName, path)
  }

  return [value === NOT_SET ? initialValue : (value as T), setValue]
}

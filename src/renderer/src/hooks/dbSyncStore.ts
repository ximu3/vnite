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

    // If the subscription already exists, return it directly
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

    // Setting up an update listener
    const removeListener = ipcOnUnique('reload-db-values', async (_event, updatedDbName) => {
      if (updatedDbName === dbName) {
        await fetchAndSetValue()
        console.log(`Reloaded DB ${key} value`)
      }
    })

    // Save subscription information
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

    // initialization value
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

    // Immediate local status update
    set((state) => ({
      values: { ...state.values, [key]: value }
    }))

    // Trying to update the database
    try {
      await debouncedIpcInvoke('set-db-value', dbName, path, value)
    } catch (error) {
      console.error('Failed to set DB value:', error)
      // Restore the previous value
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

  // Ensure subscription exists
  useDBSyncStore.getState().ensureSubscription(key, dbName, path, initialValue)

  // get a value
  const value = useDBSyncStore((state) => state.getValue(key))

  // Creating an Update Function
  const setValue = async (newValue: T): Promise<void> => {
    await useDBSyncStore.getState().setValue(key, newValue, dbName, path)
  }

  return [value === NOT_SET ? initialValue : (value as T), setValue]
}

import { create } from 'zustand'
import { ipcInvoke, debouncedIpcInvoke, ipcOnUnique } from '~/utils/ipc'
import { useEffect } from 'react'
import { toast } from 'sonner'

const NOT_SET = Symbol('NOT_SET')

type DBSyncStore = {
  [key: string]: any
}

// 将 setDBState 移到 store 外部
const setDBState = (key: string, value: any): void => useDBSyncStore.setState({ [key]: value })

const useDBSyncStore = create<DBSyncStore>(() => ({}))

export function useDBSyncedState<T>(
  initialValue: T,
  dbName: string,
  path: string[]
): [T, (value: T) => void] {
  const key = `${dbName}:${path.join('.')}`
  const storeValue = useDBSyncStore((state) => state[key] ?? NOT_SET)

  useEffect(() => {
    const fetchAndSetValue = async (): Promise<void> => {
      try {
        const value = await ipcInvoke<T>('get-db-value', dbName, path, initialValue)
        setDBState(key, value)
      } catch (error) {
        console.error('Failed to get DB value:', error)
        if (error instanceof Error) {
          toast.error(`Failed to get DB value: ${error.message}`)
        } else {
          toast.error('Failed to get DB value: An unknown error occurred')
        }
        setDBState(key, initialValue)
      }
    }

    if (storeValue === NOT_SET) {
      fetchAndSetValue()
    }

    const updateListener = async (
      _event: Electron.IpcRendererEvent,
      updatedDbName: string
    ): Promise<void> => {
      if (updatedDbName === dbName) {
        await fetchAndSetValue()
      }
    }

    const removeListener = ipcOnUnique('reload-db-values', updateListener)

    return removeListener
  }, [key, initialValue, dbName, path, storeValue])

  const setValue = (newValue: T): void => {
    setDBState(key, newValue)
    debouncedIpcInvoke('set-db-value', dbName, path, newValue)?.catch((error) => {
      console.error('Failed to set DB value:', error)
      if (error instanceof Error) {
        toast.error(`Failed to get DB value: ${error.message}`)
      } else {
        toast.error('Failed to get DB value: An unknown error occurred')
      }
    })
  }

  return [storeValue === NOT_SET ? initialValue : (storeValue as T), setValue]
}

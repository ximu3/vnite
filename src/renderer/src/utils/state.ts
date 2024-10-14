import { create } from 'zustand'
import { ipcInvoke, debouncedIpcInvoke } from '~/utils/ipc'
import { useEffect } from 'react'

type DBSyncStore = {
  [key: string]: any
  setDBState: (key: string, value: any) => void
}

// 重新设计 Zustand store
const useDBSyncStore = create<DBSyncStore>((set) => ({
  // 直接在顶层设置状态
  setDBState: (key: string, value: any): void => set({ [key]: value })
}))

export function useDBSyncedState(
  initialValue: any,
  dbName: string,
  path: string[]
): [any, (value: any) => void] {
  const key = `${dbName}:${path.join('.')}`
  const storeState = useDBSyncStore((state) => state)
  const setDBState = useDBSyncStore((state) => state.setDBState)

  useEffect(() => {
    if (!(key in storeState)) {
      ipcInvoke('getDBValue', dbName, path, initialValue).then((value) => {
        setDBState(key, value)
      })
    }
  }, [key, storeState, dbName, path.join('.'), initialValue, setDBState])

  const setValue = (newValue: any): void => {
    setDBState(key, newValue)
    debouncedIpcInvoke('setDBValue', dbName, path, newValue)
  }

  return [storeState[key] ?? initialValue, setValue]
}

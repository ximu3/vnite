import { useGameStore, GameState } from '~/stores/useGameStore'
import { ipcOnUnique, ipcInvoke } from '~/utils/ipc'
import { DocChange, AttachmentChange } from '@appTypes/database'
import { useCallback } from 'react'
import { isEqual } from 'lodash'

const DB_STORE_MAP = {
  game: useGameStore
} as const

type DBName = keyof typeof DB_STORE_MAP

// 监听数据库变化
ipcOnUnique('db-changed', (_, change: DocChange) => {
  const store = DB_STORE_MAP[change.dbName as DBName]
  if (!store) return

  const currentValue = store.getState().getValue(change.docId, [], null)

  if (isEqual(change.data, currentValue)) {
    return
  }

  store.getState().setDocument(change.docId, change.data)
})

// 初始化各个 store
Object.entries(DB_STORE_MAP).forEach(([dbName, store]) => {
  ipcInvoke<GameState['documents']>('db-get-all-docs', dbName).then((data) => {
    store.getState().initializeStore(data)
  })
})

ipcOnUnique('attachment-changed', (_event, change: AttachmentChange) => {
  // 强制重新加载相关附件
  const attachmentElements = document.querySelectorAll(
    `[src^="attachment://${change.dbName}/${change.docId}/"]`
  )
  attachmentElements.forEach((el) => {
    const url = new URL(el.getAttribute('src') || '')
    url.searchParams.set('t', Date.now().toString())

    if (el instanceof HTMLImageElement) {
      el.src = url.toString()
    } else if (el instanceof HTMLVideoElement) {
      el.src = url.toString()
    } else if (el instanceof HTMLAudioElement) {
      el.src = url.toString()
    } else {
      el.setAttribute('src', url.toString())
    }
  })
})

export function useDBSyncedState<T>(
  defaultValue: T,
  dbName: DBName,
  docId: string,
  path: string[]
): [T, (newValue: T) => Promise<void>] {
  const store = DB_STORE_MAP[dbName]

  const value = store(
    useCallback((state) => state.getValue(docId, path, defaultValue), [docId, path, defaultValue])
  )

  const setValue = useCallback(
    (newValue: T) => store.getState().setValue(docId, path, newValue),
    [store, docId, path]
  )

  return [value, setValue]
}

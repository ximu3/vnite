import { useGameStore, GameState } from '~/stores/useGameStore'
import { ipcOnUnique, ipcInvoke } from '~/utils/ipc'
import { DocChange, AttachmentChange } from '@appTypes/database'
import { isEqual } from 'lodash'

const DB_STORE_MAP = {
  game: useGameStore
} as const

type DBName = keyof typeof DB_STORE_MAP

export function setupDBSync(): void {
  // 初始化各个 store
  Object.entries(DB_STORE_MAP).forEach(([dbName, store]) => {
    ipcInvoke<GameState['documents']>('db-get-all-docs', dbName).then((data) => {
      store.getState().initializeStore(data)
    })
  })

  // 监听数据库变化
  ipcOnUnique('db-changed', (_, change: DocChange) => {
    const store = DB_STORE_MAP[change.dbName as DBName]
    if (!store) return

    const currentValue = store.getState().documents[change.docId]

    if (isEqual(change.data, currentValue)) {
      return
    }

    store.getState().setDocument(change.docId, change.data)
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
}

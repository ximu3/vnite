import { useGameStore } from './useGameStore'
import { useConfigStore } from './useConfigStore'
import { useGameLocalStore } from './useGameLocalStore'
import { useConfigLocalStore } from './useConfigLocalStore'
import { useAttachmentStore } from './useAttachmentStore'
import { ipcOnUnique, ipcInvoke } from '~/utils/ipc'
import { DocChange, AttachmentChange } from '@appTypes/database'
import { isEqual } from 'lodash'

const DB_STORE_MAP = {
  game: useGameStore,
  config: useConfigStore,
  ['game-local']: useGameLocalStore,
  ['config-local']: useConfigLocalStore
} as const

type DBName = keyof typeof DB_STORE_MAP

export function setupDBSync(): void {
  // 初始化各个 store
  Object.entries(DB_STORE_MAP).forEach(([dbName, store]) => {
    ipcInvoke('db-get-all-docs', dbName).then((data) => {
      store.getState().initializeStore(data as any)
      console.log(`[DB] ${dbName} store initialized`)
    })
  })

  // 监听数据库变化
  ipcOnUnique('db-changed', (_, change: DocChange) => {
    const store = DB_STORE_MAP[change.dbName as DBName]
    if (!store) return

    if (change.data._deleted) {
      const currentDocunments = store.getState().documents
      delete currentDocunments[change.docId]
      store.getState().setDocuments(currentDocunments as any)
      return
    }

    const currentValue = store.getState().documents[change.docId]

    if (isEqual(change.data, currentValue)) {
      return
    }

    store.getState().setDocument(change.docId as any, change.data)
  })

  ipcOnUnique('attachment-changed', (_event, change: AttachmentChange) => {
    useAttachmentStore.getState().updateTimestamp(change.dbName, change.docId, change.attachmentId)
    useAttachmentStore
      .getState()
      .setAttachmentError(change.dbName, change.docId, change.attachmentId, false)
    console.log(`[DB] Attachment changed: ${change.dbName}/${change.docId}/${change.attachmentId}`)
  })
}

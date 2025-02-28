import { useGameRegistry } from './game/gameRegistry'
import { getGameStore, initializeGameStores, deleteGameStore } from './game/gameStoreFactory'
import {
  getGameLocalStore,
  initializeGameLocalStores,
  deleteGameLocalStore
} from './game/gameLocalStoreFactory'
import { useConfigStore } from './config/useConfigStore'
import { useConfigLocalStore } from './config/useConfigLocalStore'
import { useAttachmentStore } from './useAttachmentStore'
import { ipcOnUnique, ipcInvoke } from '~/utils/ipc'
import { DocChange, AttachmentChange, gameDocs, gameLocalDocs } from '@appTypes/database'
import { isEqual } from 'lodash'

/**
 * 映射数据库名称到对应的数据初始化函数
 */
const DB_INITIALIZERS = {
  game: async (data: gameDocs): Promise<void> => {
    // 初始化游戏 stores
    initializeGameStores(data)
    console.log(`[DB] game: 初始化了 ${Object.keys(data).length} 个游戏 store`)
  },
  'game-local': async (data: gameLocalDocs): Promise<void> => {
    // 初始化游戏本地 stores
    initializeGameLocalStores(data)
    console.log(`[DB] game-local: 初始化了 ${Object.keys(data).length} 个游戏本地 store`)
  },
  config: async (data: any): Promise<void> => {
    // 保持原有的配置初始化
    useConfigStore.getState().initializeStore(data)
    console.log('[DB] config store 已初始化')
  },
  'config-local': async (data: any): Promise<void> => {
    // 保持原有的本地配置初始化
    useConfigLocalStore.getState().initializeStore(data)
    console.log('[DB] config-local store 已初始化')
  }
}

/**
 * 处理各种数据库变更的函数映射
 */
const DB_CHANGE_HANDLERS = {
  game: (docId: string, data: any, deleted: boolean): void => {
    if (deleted) {
      // 如果文档被删除，从注册表中移除
      useGameRegistry.getState().unregisterGame(docId)
      // 删除游戏 store
      deleteGameStore(docId)
      console.log(`[DB] 游戏 ${docId} 已删除`)
      return
    }

    // 获取游戏 store 并更新数据
    const gameStore = getGameStore(docId)
    const currentData = gameStore.getState().getData()

    // 如果数据没有变化，跳过更新
    if (isEqual(data, currentData)) return

    // 如果游戏 store 已初始化，则更新数据
    if (gameStore.getState().initialized) {
      gameStore.getState().initialize(data)
    } else {
      // 否则初始化游戏 store
      gameStore.getState().initialize(data)
      useGameRegistry.getState().registerGame(docId, {
        name: data.metadata?.name || '',
        genre: data.metadata?.genre,
        addDate: data.record?.addDate,
        lastRunDate: data.record?.lastRunDate
      })
    }

    console.log(`[DB] 游戏 ${docId} 数据已更新`)
  },

  'game-local': (docId: string, data: any, deleted: boolean): void => {
    if (deleted) {
      // 删除游戏本地 store
      deleteGameLocalStore(docId)
      console.log(`[DB] 游戏本地数据 ${docId} 已删除`)
      return
    }

    // 获取游戏本地 store 并更新数据
    const gameLocalStore = getGameLocalStore(docId)
    const currentData = gameLocalStore.getState().getData()

    // 如果数据没有变化，跳过更新
    if (isEqual(data, currentData)) return

    // 如果游戏本地 store 已初始化，则更新数据
    if (gameLocalStore.getState().initialized) {
      gameLocalStore.getState().initialize(data)
    } else {
      // 否则初始化游戏本地 store
      gameLocalStore.getState().initialize(data)
    }

    console.log(`[DB] 游戏本地数据 ${docId} 已更新`)
  },

  config: (docId: string, data: any, deleted: boolean): void => {
    const configStore = useConfigStore.getState()

    if (deleted) {
      // 处理配置删除
      const currentDocuments = { ...configStore.documents }
      delete currentDocuments[docId]
      configStore.setDocuments(currentDocuments)
      console.log(`[DB] 配置 ${docId} 已删除`)
      return
    }

    // 更新配置
    const currentValue = configStore.documents[docId]
    if (isEqual(data, currentValue)) return

    configStore.setDocument(docId, data)
    console.log(`[DB] 配置 ${docId} 已更新`)
  },

  'config-local': (docId: string, data: any, deleted: boolean): void => {
    const configLocalStore = useConfigLocalStore.getState()

    if (deleted) {
      // 处理本地配置删除
      const currentDocuments = { ...configLocalStore.documents }
      delete currentDocuments[docId]
      configLocalStore.setDocuments(currentDocuments)
      console.log(`[DB] 本地配置 ${docId} 已删除`)
      return
    }

    // 更新本地配置
    const currentValue = configLocalStore.documents[docId]
    if (isEqual(data, currentValue)) return

    configLocalStore.setDocument(docId, data)
    console.log(`[DB] 本地配置 ${docId} 已更新`)
  }
}

/**
 * 建立数据库同步
 */
export async function setupDBSync(): Promise<void> {
  console.log('[DB] 设置数据库同步...')

  // 初始化各个数据库
  const dbNames = Object.keys(DB_INITIALIZERS)

  for (const dbName of dbNames) {
    try {
      // 获取所有文档
      const data = await ipcInvoke('db-get-all-docs', dbName)
      // 调用对应的初始化函数
      await DB_INITIALIZERS[dbName](data)
    } catch (error) {
      console.error(`[DB] ${dbName} 初始化失败:`, error)
    }
  }

  // 监听数据库变化
  ipcOnUnique('db-changed', (_, change: DocChange) => {
    const { dbName, docId, data } = change
    const isDeleted = data._deleted === true

    // 检查我们是否有此数据库的处理程序
    if (DB_CHANGE_HANDLERS[dbName]) {
      DB_CHANGE_HANDLERS[dbName](docId, data, isDeleted)
    } else {
      console.warn(`[DB] 无法处理未知数据库的变更: ${dbName}`)
    }
  })

  // 监听附件变化
  ipcOnUnique('attachment-changed', (_event, change: AttachmentChange) => {
    useAttachmentStore.getState().updateTimestamp(change.dbName, change.docId, change.attachmentId)
    useAttachmentStore
      .getState()
      .setAttachmentError(change.dbName, change.docId, change.attachmentId, false)
    console.log(`[DB] 附件已更改: ${change.dbName}/${change.docId}/${change.attachmentId}`)
  })

  console.log('[DB] 数据库同步已设置完成')
}

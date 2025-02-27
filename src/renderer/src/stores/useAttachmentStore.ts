// src/store/attachmentStore.ts
import { create } from 'zustand'

// 定义附件状态接口
interface AttachmentInfo {
  timestamp: number
  error?: boolean // 标记是否有错误
  errorMessage?: string // 可选的错误信息
}

interface AttachmentState {
  // 三级嵌套结构：数据库名 -> 文档ID -> 附件ID -> 附件信息
  attachments: Record<string, Record<string, Record<string, AttachmentInfo>>>

  // 更新特定附件的时间戳
  updateTimestamp: (dbName: string, docId: string, attachmentId: string) => void

  // 设置附件错误状态
  setAttachmentError: (
    dbName: string,
    docId: string,
    attachmentId: string,
    error: boolean,
    errorMessage?: string
  ) => void

  // 获取特定附件的信息
  getAttachmentInfo: (dbName: string, docId: string, attachmentId: string) => AttachmentInfo

  // 清除附件错误状态
  clearError: (dbName: string, docId: string, attachmentId: string) => void

  // 批量更新时间戳
  batchUpdateTimestamps: (
    updates: Array<{ dbName: string; docId: string; attachmentId: string }>
  ) => void

  // 清除特定文档的所有附件信息
  clearDocAttachments: (dbName: string, docId: string) => void
}

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
  attachments: {},

  updateTimestamp: (dbName: string, docId: string, attachmentId: string): void => {
    set((state) => {
      const newAttachments = { ...state.attachments }

      // 确保嵌套结构存在
      newAttachments[dbName] = newAttachments[dbName] || {}
      newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

      // 获取现有附件信息或创建新信息
      const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: 0 }

      // 更新时间戳但保留错误状态
      newAttachments[dbName][docId][attachmentId] = {
        ...currentInfo,
        timestamp: Date.now()
      }

      return { attachments: newAttachments }
    })
  },

  setAttachmentError: (
    dbName: string,
    docId: string,
    attachmentId: string,
    error: boolean,
    errorMessage?: string
  ): void => {
    set((state) => {
      const newAttachments = { ...state.attachments }

      // 确保嵌套结构存在
      newAttachments[dbName] = newAttachments[dbName] || {}
      newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

      // 获取现有附件信息或创建新信息
      const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: Date.now() }

      // 更新错误状态
      newAttachments[dbName][docId][attachmentId] = {
        ...currentInfo,
        error,
        errorMessage: error ? errorMessage || '加载失败' : undefined
      }

      return { attachments: newAttachments }
    })
  },

  getAttachmentInfo: (dbName: string, docId: string, attachmentId: string): AttachmentInfo => {
    const state = get()

    // 检查附件信息是否存在
    if (!state.attachments?.[dbName]?.[docId]?.[attachmentId]) {
      // 创建默认附件信息
      const defaultInfo: AttachmentInfo = {
        timestamp: Date.now(),
        error: false
      }

      // 将默认信息保存到 store 中
      set((state) => {
        // 创建新的状态对象，避免直接修改现有状态
        const newAttachments = { ...state.attachments }

        // 确保嵌套结构存在
        newAttachments[dbName] = newAttachments[dbName] || {}
        newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

        // 设置默认附件信息
        newAttachments[dbName][docId][attachmentId] = defaultInfo

        return { attachments: newAttachments }
      })

      // 返回新创建的默认信息
      return defaultInfo
    }

    // 返回现有附件信息
    return state.attachments[dbName][docId][attachmentId]
  },

  clearError: (dbName: string, docId: string, attachmentId: string): void => {
    set((state) => {
      const currentInfo = state.attachments?.[dbName]?.[docId]?.[attachmentId]
      if (!currentInfo) return state // 没有找到附件信息

      const newAttachments = { ...state.attachments }

      // 移除错误状态但保留时间戳
      newAttachments[dbName][docId][attachmentId] = {
        timestamp: currentInfo.timestamp,
        error: false,
        errorMessage: undefined
      }

      return { attachments: newAttachments }
    })
  },

  batchUpdateTimestamps: (updates): void => {
    set((state) => {
      const newAttachments = { ...state.attachments }
      const now = Date.now()

      updates.forEach(({ dbName, docId, attachmentId }) => {
        // 确保嵌套结构存在
        newAttachments[dbName] = newAttachments[dbName] || {}
        newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

        // 获取现有附件信息或创建新信息
        const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: 0 }

        // 更新时间戳但保留错误状态
        newAttachments[dbName][docId][attachmentId] = {
          ...currentInfo,
          timestamp: now
        }
      })

      return { attachments: newAttachments }
    })
  },

  clearDocAttachments: (dbName: string, docId: string): void => {
    set((state) => {
      // 如果指定的路径不存在，则无需更改
      if (!state.attachments[dbName] || !state.attachments[dbName][docId]) {
        return state
      }

      const newAttachments = { ...state.attachments }
      // 删除该文档的所有附件信息
      delete newAttachments[dbName][docId]

      // 如果数据库下没有其他文档，也删除数据库条目
      if (Object.keys(newAttachments[dbName]).length === 0) {
        delete newAttachments[dbName]
      }

      return { attachments: newAttachments }
    })
  }
}))

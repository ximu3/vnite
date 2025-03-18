import { create } from 'zustand'

interface AttachmentInfo {
  timestamp: number
  error?: boolean
  errorMessage?: string
}

interface AttachmentState {
  // Three-level nested structure: database name -> document ID -> attachment ID -> attachment information
  attachments: Record<string, Record<string, Record<string, AttachmentInfo>>>

  // Update timestamps for specific attachments
  updateTimestamp: (dbName: string, docId: string, attachmentId: string) => void

  setAttachmentError: (
    dbName: string,
    docId: string,
    attachmentId: string,
    error: boolean,
    errorMessage?: string
  ) => void

  getAttachmentInfo: (dbName: string, docId: string, attachmentId: string) => AttachmentInfo

  clearError: (dbName: string, docId: string, attachmentId: string) => void

  batchUpdateTimestamps: (
    updates: Array<{ dbName: string; docId: string; attachmentId: string }>
  ) => void

  clearDocAttachments: (dbName: string, docId: string) => void
}

export const useAttachmentStore = create<AttachmentState>((set, get) => ({
  attachments: {},

  updateTimestamp: (dbName: string, docId: string, attachmentId: string): void => {
    set((state) => {
      const newAttachments = { ...state.attachments }

      // Ensure that nested structures exist
      newAttachments[dbName] = newAttachments[dbName] || {}
      newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

      // Get information about existing attachments or create new ones
      const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: 0 }

      // Update timestamps but retain error status
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

      // Ensure that nested structures exist
      newAttachments[dbName] = newAttachments[dbName] || {}
      newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

      // Get information about existing attachments or create new ones
      const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: Date.now() }

      // Update Error Status
      newAttachments[dbName][docId][attachmentId] = {
        ...currentInfo,
        error,
        errorMessage: error ? errorMessage || 'failed to load' : undefined
      }

      return { attachments: newAttachments }
    })
  },

  getAttachmentInfo: (dbName: string, docId: string, attachmentId: string): AttachmentInfo => {
    const state = get()

    // Checking the existence of attachment information
    if (!state.attachments?.[dbName]?.[docId]?.[attachmentId]) {
      // Creating a default attachment message
      const defaultInfo: AttachmentInfo = {
        timestamp: Date.now(),
        error: false
      }

      // Save the default information to the store
      set((state) => {
        // Create new state objects to avoid directly modifying existing state
        const newAttachments = { ...state.attachments }

        // Ensure that nested structures exist
        newAttachments[dbName] = newAttachments[dbName] || {}
        newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

        // Setting the default attachment information
        newAttachments[dbName][docId][attachmentId] = defaultInfo

        return { attachments: newAttachments }
      })

      // Returns the newly created default information
      return defaultInfo
    }

    // Return information on existing attachments
    return state.attachments[dbName][docId][attachmentId]
  },

  clearError: (dbName: string, docId: string, attachmentId: string): void => {
    set((state) => {
      const currentInfo = state.attachments?.[dbName]?.[docId]?.[attachmentId]
      if (!currentInfo) return state // No attachment information found

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
        // Ensure that nested structures exist
        newAttachments[dbName] = newAttachments[dbName] || {}
        newAttachments[dbName][docId] = newAttachments[dbName][docId] || {}

        // Get information about existing attachments or create new ones
        const currentInfo = newAttachments[dbName][docId][attachmentId] || { timestamp: 0 }

        // Update timestamps but retain error status
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
      // If the specified path does not exist, it does not need to be changed
      if (!state.attachments[dbName] || !state.attachments[dbName][docId]) {
        return state
      }

      const newAttachments = { ...state.attachments }
      // Delete all attachment information for the document
      delete newAttachments[dbName][docId]

      // If there are no other documents under the database, delete the database entry as well
      if (Object.keys(newAttachments[dbName]).length === 0) {
        delete newAttachments[dbName]
      }

      return { attachments: newAttachments }
    })
  }
}))

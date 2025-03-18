import { ipcInvoke } from '~/utils'
import { DocChange } from '@appTypes/database'

/**
 * Generic Database Synchronization Functions - Synchronize data to a specified database
 *
 * @param dbName Database name
 * @param docId Document ID
 * @param data Documentation data
 * @returns Promise<void>
 */
export async function syncTo<T extends Record<string, any>>(
  dbName: string,
  docId: string,
  data: T | '#delete'
): Promise<void> {
  // Creating Change Objects
  const change: DocChange = {
    dbName,
    docId,
    data,
    timestamp: Date.now()
  }

  try {
    await ipcInvoke('db-changed', change)
  } catch (error) {
    console.error(`[Sync] sync failure ${dbName}/${docId}:`, error)
    throw error
  }
}

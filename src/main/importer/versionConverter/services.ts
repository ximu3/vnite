import { convertV2toV3Database } from './common'
import log from 'electron-log/main.js'

/**
 * Import v2 data to v3
 * @param v2DataPath The path to the v2 data.
 * @returns A promise that resolves when the operation is complete.
 * @throws An error if the operation fails.
 */
export async function importV2DataToV3(v2DataPath: string): Promise<void> {
  try {
    await convertV2toV3Database(v2DataPath)
  } catch (error) {
    log.error('Failed to import v2 data to v3', error)
    throw error
  }
}

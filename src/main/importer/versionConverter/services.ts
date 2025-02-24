import { importV1Data } from './common'
import { getDataPath } from '~/utils'
import log from 'electron-log/main.js'

/**
 * Import v1 data to v2
 * @param v1DataPath The path to the v1 data.
 * @returns A promise that resolves when the operation is complete.
 * @throws An error if the operation fails.
 */
export async function importV1DataToV2(v1DataPath: string): Promise<void> {
  try {
    const dataPath = await getDataPath('')
    await importV1Data(v1DataPath, dataPath)
  } catch (error) {
    log.error('Failed to import v1 data to v2', error)
    throw error
  }
}

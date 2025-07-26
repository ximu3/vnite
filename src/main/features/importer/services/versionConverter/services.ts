import { convertV2toV3Database } from './common'
import log from 'electron-log/main'

export async function importV2DataToV3(v2DataPath: string): Promise<void> {
  try {
    await convertV2toV3Database(v2DataPath)
  } catch (error) {
    log.error('[Importer] Failed to import v2 data to v3', error)
    throw error
  }
}

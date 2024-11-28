import { importV1Data } from './common'
import { getDataPath } from '~/utils'
import log from 'electron-log/main.js'

export async function importV1DataToV2(v1DataPath: string): Promise<void> {
  try {
    const dataPath = await getDataPath('')
    await importV1Data(v1DataPath, dataPath)
  } catch (error) {
    log.error('Failed to import v1 data to v2', error)
    throw error
  }
}

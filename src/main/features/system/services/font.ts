import { getFonts } from 'font-list'
import log from 'electron-log/main'

export async function getSystemFonts(): Promise<string[]> {
  try {
    return await getFonts({ disableQuoting: true })
  } catch (error) {
    log.error('[System] Failed to get system fonts:', error)
    return []
  }
}

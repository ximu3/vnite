import { ConfigDBManager } from '~/core/database'
import { DEFAULT_CONFIG_VALUES } from '@appTypes/models'
import log from 'electron-log/main'

export async function resetAppearancesSettings(): Promise<void> {
  try {
    // Reset the appearance settings to default values
    await ConfigDBManager.setConfigValue('appearances', DEFAULT_CONFIG_VALUES.appearances)
    await ConfigDBManager.removeConfigBackgroundImage('#all')
    // Optionally, you can emit an event or log the reset action
    log.info('[DB] Appearances Settings have been reset to default values')
  } catch (error) {
    log.error('[DB] Error resetting Appearances settings:', error)
    throw error
  }
}

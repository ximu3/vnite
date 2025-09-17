import { setupAccountIPC } from '~/features/account'
import { setupAdderIPC } from '~/features/adder'
import { setupDatabaseIPC } from '~/features/database'
import { setupGameIPC } from '~/features/game/ipc'
import { setupImporterIPC } from '~/features/importer'
import { setupLauncherIPC } from '~/features/launcher'
import { setupMonitorIPC } from '~/features/monitor/ipc'
import { setupScraperIPC } from '~/features/scraper'
import { setupSystemIPC } from '~/features/system'
import { setupThemeIPC } from '~/features/theme'
import { setupTransformerIPC } from '~/features/transformer'
import { setupUpdaterIPC } from '~/features/updater'
import { setupPluginIPC } from '~/plugins'
import { setupEventBusIPC } from '../events'

export function setupIPC(): void {
  setupAccountIPC()
  setupAdderIPC()
  setupDatabaseIPC()
  setupGameIPC()
  setupImporterIPC()
  setupLauncherIPC()
  setupMonitorIPC()
  setupScraperIPC()
  setupSystemIPC()
  setupThemeIPC()
  setupTransformerIPC()
  setupUpdaterIPC()
  setupPluginIPC()
  setupEventBusIPC()
}

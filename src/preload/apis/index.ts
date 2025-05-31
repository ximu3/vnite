export { databaseAPI } from './database'
export { gameAPI } from './game'
export { utilsAPI } from './utils'
export { launcherAPI } from './launcher'
export { scraperAPI } from './scraper'
export { adderAPI } from './adder'
export { mediaAPI } from './media'
export { importerAPI } from './importer'
export { themeAPI } from './theme'
export { updaterAPI } from './updater'
export { accountAPI } from './account'
export { transformerAPI } from './transformer'
export { gameScannerAPI } from './gameScanner'
export { eventsAPI } from './events'

import { databaseAPI } from './database'
import { gameAPI } from './game'
import { utilsAPI } from './utils'
import { launcherAPI } from './launcher'
import { scraperAPI } from './scraper'
import { adderAPI } from './adder'
import { mediaAPI } from './media'
import { importerAPI } from './importer'
import { themeAPI } from './theme'
import { updaterAPI } from './updater'
import { accountAPI } from './account'
import { transformerAPI } from './transformer'
import { gameScannerAPI } from './gameScanner'
import { eventsAPI } from './events'

export const vniteAPI = {
  database: databaseAPI,
  game: gameAPI,
  utils: utilsAPI,
  launcher: launcherAPI,
  scraper: scraperAPI,
  adder: adderAPI,
  media: mediaAPI,
  importer: importerAPI,
  theme: themeAPI,
  updater: updaterAPI,
  account: accountAPI,
  transformer: transformerAPI,
  gameScanner: gameScannerAPI,
  events: eventsAPI
}

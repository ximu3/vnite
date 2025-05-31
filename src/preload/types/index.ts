import type { DatabaseAPI } from './database'
import type { GameAPI } from './game'
import type { UtilsAPI } from './utils'
import type { LauncherAPI } from './launcher'
import type { ScraperAPI } from './scraper'
import type { AdderAPI } from './adder'
import type { MediaAPI } from './media'
import type { ImporterAPI } from './importer'
import type { ThemeAPI } from './theme'
import type { UpdaterAPI } from './updater'
import type { AccountAPI } from './account'
import type { TransformerAPI } from './transformer'
import type { GameScannerAPI } from './gameScanner'
import type { EventsAPI } from './events'

export type { DatabaseAPI } from './database'
export type { GameAPI } from './game'
export type { UtilsAPI } from './utils'
export type { LauncherAPI } from './launcher'
export type { ScraperAPI } from './scraper'
export type { AdderAPI } from './adder'
export type { MediaAPI } from './media'
export type { ImporterAPI } from './importer'
export type { ThemeAPI } from './theme'
export type { UpdaterAPI } from './updater'
export type { AccountAPI } from './account'
export type { TransformerAPI } from './transformer'
export type { GameScannerAPI } from './gameScanner'
export type { EventsAPI } from './events'

export interface VniteAPI {
  database: DatabaseAPI
  game: GameAPI
  utils: UtilsAPI
  launcher: LauncherAPI
  scraper: ScraperAPI
  adder: AdderAPI
  media: MediaAPI
  importer: ImporterAPI
  theme: ThemeAPI
  updater: UpdaterAPI
  account: AccountAPI
  transformer: TransformerAPI
  gameScanner: GameScannerAPI
  events: EventsAPI
}

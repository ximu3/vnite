import { UpdateCheckResult } from 'electron-updater'

export interface UpdaterAPI {
  checkUpdate(): Promise<UpdateCheckResult | null>
  startUpdate(): Promise<void>
  installUpdate(): Promise<void>
  updateUpdaterConfig(): Promise<void>
}

export interface UpdaterAPI {
  checkUpdate(): Promise<any>
  startUpdate(): Promise<void>
  installUpdate(): Promise<void>
  updateUpdaterConfig(): Promise<void>
}

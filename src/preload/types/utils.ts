import type { OpenDialogOptions } from 'electron'

export interface UtilsAPI {
  generateUUID(): Promise<string>
  selectPathDialog(
    properties: NonNullable<OpenDialogOptions['properties']>,
    extensions?: string[],
    defaultPath?: string
  ): Promise<string>
  selectMultiplePathDialog(
    properties: NonNullable<OpenDialogOptions['properties']>,
    extensions?: string[],
    defaultPath?: string
  ): Promise<string[]>
  getPathSize(paths: string[]): Promise<number>
  openPathInExplorer(filePath: string): Promise<void>
  openDatabasePathInExplorer(): Promise<void>
  createGameShortcut(gameId: string, targetPath: string): Promise<void>
  updateOpenAtLogin(): Promise<void>
  updateTrayConfig(): Promise<void>
  getAppVersion(): Promise<string>
  isPortableMode(): Promise<boolean>
  switchDatabaseMode(): Promise<any>
  readFileBuffer(filePath: string): Promise<Buffer>
  getLanguage(): Promise<string>
  checkAdminPermissions(): Promise<boolean>
  checkIfPortableDirectoryNeedsAdminRights(): Promise<boolean>
  updateLanguage(language: string): Promise<void>
  minimize(): void
  quitToTray(): void
  restoreAndFocus(): void
  maximize(): void
  close(): void
  relaunchApp(): void
}

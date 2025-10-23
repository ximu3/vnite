import { app } from 'electron'
import contextMenu from 'electron-context-menu'
import log from 'electron-log/main'
import fse from 'fs-extra'
import i18next from 'i18next'
import os from 'os'
import path from 'path'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { convertToIcon, copyFileToClipboard, createUrlShortcut, openPathInExplorer } from '~/utils'
import { getAppTempPath, getLogsPath } from './path'

export async function setupContextMenu(): Promise<void> {
  contextMenu({
    showLearnSpelling: true,
    showLookUpSelection: true,
    showSearchWithGoogle: true,
    showSelectAll: false,
    showCopyImage: true,
    showCopyImageAddress: true,
    showSaveImageAs: true,
    showSaveImage: false,
    showCopyVideoAddress: true,
    showSaveVideoAs: true,
    showSaveVideo: false,
    showCopyLink: false,
    showSaveLinkAs: false,
    labels: {
      learnSpelling: i18next.t('context-menu:learnSpelling'),
      lookUpSelection: i18next.t('context-menu:lookUpSelection'),
      searchWithGoogle: i18next.t('context-menu:searchWithGoogle'),
      cut: i18next.t('context-menu:cut'),
      copy: i18next.t('context-menu:copy'),
      paste: i18next.t('context-menu:paste'),
      selectAll: i18next.t('context-menu:selectAll'),
      saveImage: i18next.t('context-menu:saveImage'),
      saveImageAs: i18next.t('context-menu:saveImageAs'),
      saveVideo: i18next.t('context-menu:saveVideo'),
      saveVideoAs: i18next.t('context-menu:saveVideoAs'),
      copyLink: i18next.t('context-menu:copyLink'),
      saveLinkAs: i18next.t('context-menu:saveLinkAs'),
      copyImage: i18next.t('context-menu:copyImage'),
      copyImageAddress: i18next.t('context-menu:copyImageAddress'),
      copyVideoAddress: i18next.t('context-menu:copyVideoAddress'),
      inspect: i18next.t('context-menu:inspect'),
      services: i18next.t('context-menu:services')
    }
  })
}

export async function setupOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('[Utils] Error toggling open at login:', error)
  }
}

export async function getAppLogContentsInCurrentLifetime(): Promise<string> {
  try {
    const logPath = getLogsPath()
    const logContents = await fse.readFile(logPath, 'utf-8')

    // Split log contents into lines
    const lines = logContents.split('\n')

    // Search for the line containing "[App] App is starting..." from the end
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('[App] App is starting...')) {
        // Return all content from the matching line to the end
        return lines.slice(i).join('\n')
      }
    }

    // If no matching line is found, return all log contents
    return logContents
  } catch (error) {
    log.error('[Utils] Error getting app log path:', error)
    throw error
  }
}

export async function copyAppLogInCurrentLifetimeToClipboardAsFile(): Promise<boolean> {
  try {
    // Get log contents
    const logContents = await getAppLogContentsInCurrentLifetime()

    // Write log to temp file
    const tempFilePath = getAppTempPath('app.log')
    await fse.writeFile(tempFilePath, logContents)

    // Copy file to clipboard
    const success = await copyFileToClipboard(tempFilePath)

    if (success) {
      log.info('[Utils] App log copied to clipboard as file:', tempFilePath)
    } else {
      log.warn('[Utils] Failed to copy app log to clipboard as file:', tempFilePath)
    }

    return success
  } catch (error) {
    log.error('[Utils] Failed to copy app log to clipboard:', error)
    return false
  }
}

export async function openLogPathInExplorer(): Promise<void> {
  try {
    const logPath = getLogsPath()
    await openPathInExplorer(logPath)
    log.info('[Utils] Log folder opened:', logPath)
  } catch (error) {
    log.error('[Utils] Failed to open log folder:', error)
    throw error
  }
}

export async function updateOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('[Utils] Error setting open at login:', error)
  }
}

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Get file icon
    const icon = await app.getFileIcon(filePath)

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon.toPNG())

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

export async function createGameShortcut(gameId: string, targetPath: string): Promise<void> {
  try {
    // Get game information
    const gameName = await GameDBManager.getGameValue(gameId, 'metadata.name')

    const originalIconPath = await GameDBManager.getGameImage(gameId, 'icon', 'file')

    // ico icon path
    const iconPath = getAppTempPath(`icon_${gameId}_${Date.now()}.ico`)

    // Convert icons to ico format
    if (originalIconPath) {
      await convertToIcon(originalIconPath, iconPath, {
        sizes: [32],
        quality: 100
      })
    }
    // Creating URL shortcuts
    await createUrlShortcut({
      url: `vnite://rungameid/${gameId}`,
      iconPath: iconPath,
      targetPath: targetPath,
      name: gameName,
      description: `Launch ${gameName} in Vnite`,
      categories: ['Game']
    })
  } catch (error) {
    log.error('[Utils] Error creating game shortcut:', error)
  }
}

export async function deleteTempFile(filePath: string): Promise<void> {
  try {
    const tempDir = os.tmpdir()
    const resolvedPath = path.resolve(filePath)

    if (path.relative(tempDir, resolvedPath).startsWith('..')) {
      console.warn(`[deleteTempFile] Refused to delete non-temp file: ${resolvedPath}`)
      return
    }

    if (await fse.pathExists(resolvedPath)) {
      await fse.remove(resolvedPath)
      console.log(`[deleteTempFile] Temp file deleted: ${resolvedPath}`)
    }
  } catch (error) {
    console.error('[deleteTempFile] Error deleting temp file:', error)
  }
}

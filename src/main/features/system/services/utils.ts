import { GameDBManager, ConfigDBManager } from '~/core/database'
import { createUrlShortcut, convertToIcon, openPathInExplorer } from '~/utils'
import { getAppTempPath, getLogsPath } from './path'
import log from 'electron-log/main'
import fse from 'fs-extra'
import { app } from 'electron'
import { copyFileToClipboard } from '~/utils'

/**
 * Get the path to the application log file
 * @returns The path to the application log file
 */
export async function setupOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error toggling open at login:', error)
  }
}

export async function getAppLogContentsInCurrentLifetime(): Promise<string> {
  try {
    const logPath = getLogsPath()
    const logContents = await fse.readFile(logPath, 'utf-8')

    // 将日志内容分割成行
    const lines = logContents.split('\n')

    // 从后向前查找包含"[App] App is starting..."的行
    for (let i = lines.length - 1; i >= 0; i--) {
      if (lines[i].includes('[App] App is starting...')) {
        // 找到匹配行后，返回从该行开始到末尾的所有内容
        return lines.slice(i).join('\n')
      }
    }

    // 如果没找到匹配行，返回全部日志内容
    return logContents
  } catch (error) {
    log.error('Error getting app log path:', error)
    throw error
  }
}

export async function copyAppLogInCurrentLifetimeToClipboardAsFile(): Promise<boolean> {
  try {
    // 获取日志内容
    const logContents = await getAppLogContentsInCurrentLifetime()

    // 将日志写入临时文件
    const tempFilePath = getAppTempPath('app.log')
    await fse.writeFile(tempFilePath, logContents)

    // 复制文件到剪贴板
    const success = await copyFileToClipboard(tempFilePath)

    if (success) {
      log.info('应用日志已复制到剪贴板作为文件')
    } else {
      log.warn('无法将应用日志复制到剪贴板作为文件')
    }

    return success
  } catch (error) {
    log.error('复制应用日志到剪贴板失败:', error)
    return false
  }
}

export async function openLogPathInExplorer(): Promise<void> {
  try {
    const logPath = getLogsPath()
    await openPathInExplorer(logPath)
    log.info('日志文件夹已打开:', logPath)
  } catch (error) {
    log.error('打开日志文件夹失败:', error)
    throw error
  }
}

/**
 * Open a path in the file explorer
 * @param filePath The path to open
 */
export async function updateOpenAtLogin(): Promise<void> {
  try {
    const isEnabled = await ConfigDBManager.getConfigValue('general.openAtLogin')
    app.setLoginItemSettings({
      openAtLogin: isEnabled,
      args: ['--hidden']
    })
  } catch (error) {
    log.error('Error setting open at login:', error)
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

/**
 * Create a shortcut for a game
 * @param gameId The ID of the game
 * @param targetPath The path to save the shortcut
 */
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
    log.error('Error creating game shortcut:', error)
  }
}

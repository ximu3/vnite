import { GameDBManager, ConfigDBManager } from '~/core/database'
import { app } from 'electron'
import semver from 'semver'
import log from 'electron-log/main'
import * as fs from 'fs'

/**
 * Run database migrations based on app version
 * This should be called after database initialization but before other services
 */
export async function runMigrations(): Promise<void> {
  try {
    const currentVersion = app.getVersion()
    const lastVersion = (await ConfigDBManager.getConfigValue('app.lastVersion')) || '0.0.0'

    log.info(`[DB] Current version: ${currentVersion}, Last version: ${lastVersion}`)

    if (semver.eq(currentVersion, lastVersion)) {
      return
    } else if (semver.lte(lastVersion, '4.6.0') && semver.gt(currentVersion, '4.6.0')) {
      log.info('[DB] Running migration for version > 4.6.0: Cleaning up zombie games')
      await cleanupZombieGames()
    }

    // Update stored version
    await ConfigDBManager.setConfigValue('app.lastVersion', currentVersion)
    log.info('[DB] Migrations completed successfully')
  } catch (error) {
    log.error('[DB] Migrations failed:', error)
    // Don't throw - allow app to continue even if migration fails
  }
}

/**
 * Clean up zombie games from versions <= 4.6.0
 * 
 * In versions <= 4.6.0, there was a bug where deleted games could leave
 * zombie monitor entries. This function detects and removes games with
 * invalid or missing monitor paths.
 */
async function cleanupZombieGames(): Promise<void> {
  try {
    const allLocal = await GameDBManager.getAllGamesLocal()
    const games = Object.entries(allLocal)
    
    log.info(`[DB] Checking ${games.length} games for zombie monitor paths`)

    const validationResults = await Promise.all(
      games.map(async ([gameId, doc]) => {
        const isValid = await isValidGame(gameId, doc)
        return { gameId, isValid }
      })
    )

    const gamesToRemove = validationResults
      .filter(result => !result.isValid)
      .map(result => result.gameId)

    log.info(`[DB] Found ${gamesToRemove.length} games to remove`)

    for (const gameId of gamesToRemove) {
      try {
        await GameDBManager.removeGame(gameId)
        log.info(`[DB] Removed zombie game ${gameId}`)
      } catch (error) {
        log.error(`[DB] Failed to remove zombie game ${gameId}:`, error)
      }
    }

    if (gamesToRemove.length > 0) {
      log.info(`[DB] Cleanup complete. Removed ${gamesToRemove.length} zombie games.`)
    } else {
      log.info('[DB] No zombie games found.')
    }
  } catch (error) {
    log.error('[DB] Cleanup failed:', error)
  }
}

/**
 * Check if a game has a valid monitor path
 * Returns false for games that should be removed
 */
async function isValidGame(gameId: string, doc: any): Promise<boolean> {
  try {
    // Check if launcher mode exists
    const mode = doc.launcher?.mode
    if (!mode) {
      log.warn(`[DB] Game ${gameId} has no launcher mode`)
      return false
    }

    // Check if mode config exists
    const modeConfig = doc.launcher[`${mode}Config`]
    const monitorPath = modeConfig?.monitorPath

    if (!monitorPath) {
      log.warn(`[DB] Game ${gameId} has no monitor path`)
      return false
    }

    // Check if the monitor path exists asynchronously
    // not desired - e.g., user may have external drive disconnected, doesn't mean game is invalid
    // try {
    //   await fs.promises.access(monitorPath, fs.constants.F_OK)
    //   return true
    // } catch {
    //   log.info(`[DB] Game ${gameId} monitor path does not exist: ${monitorPath}`)
    //   return false
    // }

    return true
  } catch (error) {
    log.warn(`[DB] Error validating game ${gameId}:`, error)
    return false
  }
}
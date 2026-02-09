import { generateUUID, jaro } from '@appUtils'
import log from 'electron-log/main'
import fse from 'fs-extra'
import os from 'os'
import path from 'path'
import { GameDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import { getAppTempPath } from '~/features/system'
import { unzipFile, walkFs, zipFolder } from '~/utils'

export async function backupGameSave(gameId: string): Promise<void> {
  try {
    const saveId = generateUUID()
    const savePaths = await GameDBManager.getGameLocalValue(gameId, 'path.savePaths')
    const maxSaveNumber = await GameDBManager.getGameValue(gameId, 'save.maxBackups')
    const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
    const tempZipPath = getAppTempPath(`save-zip-${Date.now()}/`)
    await fse.ensureDir(tempFilesPath)
    await fse.ensureDir(tempZipPath)

    const saveList = await GameDBManager.getGameValue(gameId, 'save.saveList')

    const saveIds = Object.keys(saveList).filter((key) => !saveList[key].locked)

    // If the number of saves exceeds the maximum, delete the oldest ones
    if (saveIds.length >= maxSaveNumber) {
      saveIds.sort(
        (a, b) => new Date(saveList[a].date).getTime() - new Date(saveList[b].date).getTime()
      )

      const deleteCount = saveIds.length - Number(maxSaveNumber) + 1
      const oldestSaveIds = saveIds.slice(0, deleteCount)

      for (const saveId of oldestSaveIds) {
        delete saveList[saveId]
        await GameDBManager.removeGameSave(gameId, saveId)
      }
    }

    await Promise.all(
      savePaths.map(async (pathInGame) => {
        const backupName = path.basename(pathInGame)
        try {
          // Copy the file to the temporary backup directory
          await fse.copy(pathInGame, path.join(tempFilesPath, backupName))
        } catch (error) {
          log.error(`[Game] Failed to backup ${pathInGame}:`, error)
        }
      })
    )

    // Create a zip file from the temporary backup directory
    const zipPath = await zipFolder(tempFilesPath, tempZipPath, saveId)
    await GameDBManager.setGameSave(gameId, saveId, zipPath)

    saveList[saveId] = { _id: saveId, date: new Date().toISOString(), note: '', locked: false }
    await GameDBManager.setGameValue(gameId, 'save.saveList', saveList)

    await fse.remove(tempFilesPath)
    await fse.remove(tempZipPath)

    // Emit event after saving the game
    eventBus.emit(
      'game:save-created',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error backing up game save:', error)
    throw error
  }
}

export async function restoreGameSave(gameId: string, saveId: string): Promise<void> {
  try {
    const savePaths = await GameDBManager.getGameLocalValue(gameId, 'path.savePaths')
    const tempFilesPath = getAppTempPath(`save-files-${Date.now()}/`)
    const tempZipPath = await GameDBManager.getGameSave(gameId, saveId, 'file')
    await fse.ensureDir(tempFilesPath)

    await unzipFile(tempZipPath, tempFilesPath)

    await Promise.all(
      savePaths.map(async (pathInGame) => {
        const backupName = path.basename(pathInGame)
        try {
          // Copy the file from the temporary backup directory to the game save path
          await fse.copy(path.join(tempFilesPath, backupName), pathInGame)
        } catch (error) {
          log.error(`[Game] Failed to restore ${pathInGame}:`, error)
          throw error
        }
      })
    )

    // Emit event after restoring the game
    eventBus.emit(
      'game:save-restored',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error restoring game save:', error)
    throw error
  }
}

export async function deleteGameSave(gameId: string, saveId: string): Promise<void> {
  try {
    const saveList = await GameDBManager.getGameValue(gameId, 'save.saveList')
    delete saveList[saveId]
    await GameDBManager.setGameValue(gameId, 'save.saveList', saveList)
    await GameDBManager.removeGameSave(gameId, saveId)

    // Emit event after deleting the save
    eventBus.emit(
      'game:save-deleted',
      {
        gameId,
        saveId
      },
      { source: 'game-save' }
    )
  } catch (error) {
    log.error('[Game] Error deleting save:', error)
    throw error
  }
}

async function findInLocalDir(dir: string): Promise<string[]> {
  const BGIMatch = new Set<string>()
  const BGIFeature = ['.arc', '.sud', '.gdb']
  const BGIResult: string[] = []
  const result: string[] = []

  const onDir = (d: string, _depth: number): void => {
    if (path.basename(d) == 'UserData') {
      BGIResult.push(d)
    }
    if (path.basename(d).toLowerCase().includes('save')) {
      result.push(d)
    }
  }

  const onFile = (f: string, _depth: number): void => {
    if (BGIFeature.includes(path.extname(f))) {
      BGIMatch.add(path.extname(f))
    }
    if (path.parse(f).name === 'BGI') {
      BGIResult.push(f)
    }
  }

  /*
   * It is highly unlikely that any game's save files would be located deeper than
   * five directory levels (even general game data is rarely nested to such depth).
   * This limit is therefore imposed purely as a defensive safeguard.
   */
  await walkFs(dir, { maxDepth: 4, onDir, onFile })
  if (BGIMatch.size >= 2) {
    return BGIResult
  }
  return result
}

async function findInUserDir(dirs: string[], targets: string[]): Promise<string[]> {
  const result: {
    path: string
    score: number
  }[] = []

  const onDir = (d: string, _depth: number): void => {
    const name = path.basename(d).toLowerCase()
    const maxScore = Math.max(...targets.map((t) => jaro(name, t.toLowerCase())))
    result.push({ path: d, score: maxScore })
  }

  /*
   * Considering that the vast majority of save data stored under the user directory
   * follows a path pattern such as "Publisher/GameName" or "MyGames/Publisher/GameName",
   * a search depth of 2 is sufficient to reach third-level subdirectory names
   * without traversing deeper into their contents. This provides a reasonable
   * balance between robustness and performance.
   *
   * In practice, when the search depth exceeds 3, unrelated application data
   * (e.g., MATLAB, Adobe products), which often contain large numbers of files
   * nested deeply in the directory tree, significantly increases traversal time
   * and introduces substantial noise in the results (especially for purely
   * English game titles).
   */
  for (const dir of dirs) {
    await walkFs(dir, { maxDepth: 2, onDir })
  }

  if (result.length === 0) return []

  const globalMax = Math.max(...result.map((r) => r.score))
  const threshold = 0.6
  const filtered = result
    .filter((r) => {
      return r.score >= threshold && r.score >= Math.max(threshold, globalMax - 0.1)
    })
    .sort((a, b) => b.score - a.score)
    // .map((r) => `${r.path} (${r.score.toFixed(2)})`)
    .map((r) => r.path)
    .slice(0, 5)

  return filtered
}

export async function searchGameSavePaths(gameId: string): Promise<string[]> {
  const found: string[] = []

  //* Tier 1 - search in game local directory
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')
  const markerPath = await GameDBManager.getGameLocalValue(gameId, 'utils.markPath')
  const gameLocalRoot = gamePath || markerPath

  if (await fse.pathExists(gameLocalRoot)) {
    const st = await fse.stat(gameLocalRoot)
    if (st.isFile()) {
      found.push(...(await findInLocalDir(path.dirname(gameLocalRoot))))
    } else {
      found.push(...(await findInLocalDir(gameLocalRoot)))
    }
  }

  /*
   * Some games may ship with a bundled full-CG save file in the installation directory,
   * while the actual runtime saves are stored under the user directory.
   * Therefore, Tier 1 should not short-circuit or bypass the Tier 2 search.
   */
  //* Tier 2 - search in user directories (Documents, AppData/Roaming)
  const gameName = await GameDBManager.getGameValue(gameId, 'metadata.name')
  const gameOriginalName = await GameDBManager.getGameValue(gameId, 'metadata.originalName')
  const targets = [gameName, gameOriginalName].filter(Boolean)

  if (targets.length > 0) {
    const home = os.homedir()
    const documents = path.join(home, 'Documents')
    const roaming = path.join(home, 'AppData', 'Roaming')
    found.push(...(await findInUserDir([documents, roaming], targets)))
  }

  return [...new Set(found)]
}

// DatabaseV2toV3Converter.ts
import { gameCollectionDoc, gameDoc, gameLocalDoc } from '@appTypes/database'
import { app } from 'electron'
import * as fse from 'fs-extra'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'
import { stopSync } from '~/database'
import { ConfigDBManager } from '~/database/config'
import { GameDBManager } from '~/database/game'
import { getAppTempPath, zipFolder, unzipFile } from '~/utils'

// v2 Database Type Definition
interface V2GameMetadata {
  id: string
  name: string
  originalName: string
  releaseDate: string
  description: string
  developers: string[]
  platforms: string[]
  publishers: string[]
  genres: string[]
  tags: string[]
  relatedSites: {
    label: string
    url: string
  }[]
  steamId?: string
  vndbId?: string
  igdbId?: string
  ymgalId?: string
}

interface V2GameLauncher {
  mode: 'file' | 'url' | 'script'
  fileConfig: {
    path: string
    workingDirectory: string
    timerMode: 'file' | 'folder'
    timerPath: string
  }
  scriptConfig: {
    command: string[]
    workingDirectory: string
    timerMode: 'file' | 'folder'
    timerPath: string
  }
  urlConfig: {
    url: string
    timerMode: 'file' | 'folder'
    timerPath: string
    browserPath: string
  }
  useMagpie: boolean
}

interface V2GameMemory {
  memoryList: {
    [memoryId: string]: {
      id: string
      date: string
      note: string
    }
  }
}

interface V2GamePath {
  gamePath: string
  savePath: string[]
}

interface V2GameRecord {
  addDate: string
  lastRunDate: string
  score: number
  playingTime: number
  playStatus: 'unplayed' | 'playing' | 'finished' | 'multiple' | 'shelved'
  timer: {
    start: string
    end: string
  }[]
}

interface V2GameSave {
  [saveId: string]: {
    id: string
    date: string
    note: string
    locked: boolean
  }
}

interface V2GameUtils {
  logo: {
    position: {
      x: number
      y: number
    }
    size: number
    visible: boolean
  }
}

interface V2Collections {
  [collectionId: string]: {
    id: string
    name: string
    games: string[]
  }
}

interface V2Config {
  general: {
    openAtLogin: boolean
    quitToTray: boolean
  }
  scraper: {
    defaultDataSource: string
  }
  cloudSync: {
    enabled: boolean
    config: {
      webdavUrl: string
      remotePath: string
      username: string
      password: string
      syncInterval: number
    }
  }
  others: {
    showcase: {
      sort: {
        by: string
        order: 'asc' | 'desc'
      }
    }
    gameList: {
      sort: {
        by: string
        order: 'asc' | 'desc'
      }
      selectedGroup: string
      highlightLocalGames: boolean
      markLocalGames: boolean
    }
  }
  advanced: {
    linkage: {
      localeEmulator: {
        path: string
      }
      visualBoyAdvance: {
        path: string
      }
      magpie: {
        path: string
        hotkey: string
      }
    }
  }
  appearances: {
    gameList: {
      showRecentGamesInGameList: boolean
    }
    gameHeader: {
      showOriginalNameInGameHeader: boolean
    }
    sidebar: {
      showThemeSwitchInSidebar: boolean
    }
  }
}

/**
 * Import V2 database from zip file and convert to V3
 * @param zipFilePath zip file path
 */
export async function convertV2toV3Database(zipFilePath: string): Promise<void> {
  console.log('Start importing database from ZIP file...')

  // Creating a Temporary Directory
  const tempDir = getAppTempPath(`v2toV3-${uuidv4()}`)
  stopSync() // desynchronization
  try {
    // Ensure that the temporary directory exists
    await fse.ensureDir(tempDir)

    // Unzip the file
    await unzipFile(zipFilePath, tempDir)

    // Converted data
    await convertGames(tempDir)
    await convertCollections(tempDir)
    await convertConfig(tempDir)

    console.log('Database conversion complete')
  } catch (error) {
    console.error('An error occurred during conversion:', error)
    throw error
  } finally {
    // Cleaning up temporary files
    await new Promise((resolve) => setTimeout(resolve, 100))
    await cleanupTempFiles(tempDir)
    fse.removeSync(tempDir)
    app.relaunch()
    app.exit()
  }
}

/**
 * Convert game data
 */
async function convertGames(basePath: string): Promise<void> {
  console.log('Start converting game data...')

  const gamesPath = path.join(basePath, 'games')
  const exists = await fse.pathExists(gamesPath)
  if (!exists) {
    console.error('Game directory does not exist')
    return
  }

  // Read all subdirectories in the games directory
  const items = await fse.readdir(gamesPath)
  const gameIds: string[] = []

  for (const item of items) {
    const itemPath = path.join(gamesPath, item)
    const stats = await fse.stat(itemPath)
    if (stats.isDirectory() && item !== 'config.json') {
      gameIds.push(item)
    }
  }

  // Handling each game
  for (const gameId of gameIds) {
    try {
      await convertGame(gameId, path.join(gamesPath, gameId))
    } catch (error) {
      console.error(`Error while converting game ${gameId}:`, error)
    }
  }

  console.log(`Successful conversion of ${gameIds.length} games`)
}

/**
 * Convert individual game data
 */
async function convertGame(gameId: string, gamePath: string): Promise<void> {
  console.log(`Converting the game: ${gameId}`)

  // Read game-related JSON files
  try {
    const metadata = await readJsonFile<V2GameMetadata>(path.join(gamePath, 'metadata.json'))
    const launcher = await readJsonFile<V2GameLauncher>(path.join(gamePath, 'launcher.json'))
    const memory = await readJsonFile<V2GameMemory>(path.join(gamePath, 'memory.json'))
    const gamePaths = await readJsonFile<V2GamePath>(path.join(gamePath, 'path.json'))
    const record = await readJsonFile<V2GameRecord>(path.join(gamePath, 'record.json'))
    const save = await readJsonFile<V2GameSave>(path.join(gamePath, 'save.json'))
    const utils = await readJsonFile<V2GameUtils>(path.join(gamePath, 'utils.json'))

    // Creating a game document for v3
    const gameDoc: Partial<gameDoc> = {
      _id: gameId,
      metadata: {
        name: metadata.name || '',
        originalName: metadata.originalName || '',
        releaseDate: metadata.releaseDate || '',
        description: metadata.description || '',
        developers: metadata.developers || [],
        platforms: metadata.platforms || [],
        publishers: metadata.publishers || [],
        genres: metadata.genres || [],
        tags: metadata.tags || [],
        relatedSites: metadata.relatedSites || [],
        steamId: metadata.steamId || '',
        vndbId: metadata.vndbId || '',
        igdbId: metadata.igdbId || '',
        ymgalId: metadata.ymgalId || '',
        extra: []
      },
      record: {
        addDate: record.addDate || '',
        lastRunDate: record.lastRunDate || '',
        score: record.score || -1,
        playTime: record.playingTime || 0,
        playStatus: record.playStatus || 'unplayed',
        timers: record.timer || []
      },
      save: {
        saveList: {},
        maxBackups: 7
      },
      memory: {
        memoryList: {}
      },
      apperance: {
        logo: utils?.logo || {
          position: {
            x: 2,
            y: 29
          },
          size: 100,
          visible: true
        },
        nsfw: false
      }
    }

    // Processing of archived data
    if (save) {
      Object.keys(save).forEach((saveId) => {
        if (!gameDoc.save) gameDoc.save = { saveList: {}, maxBackups: 7 }
        gameDoc.save.saveList[saveId] = {
          _id: save[saveId].id,
          date: save[saveId].date,
          note: save[saveId].note,
          locked: save[saveId].locked
        }
      })
    }

    // Handling of memorized data
    if (memory && memory.memoryList) {
      Object.keys(memory.memoryList).forEach((memoryId) => {
        if (!gameDoc.memory) gameDoc.memory = { memoryList: {} }
        gameDoc.memory.memoryList[memoryId] = {
          _id: memory.memoryList[memoryId].id,
          date: memory.memoryList[memoryId].date,
          note: memory.memoryList[memoryId].note
        }
      })
    }

    // Creating a game local file for v3
    const gameLocalDoc: Partial<gameLocalDoc> = {
      _id: gameId,
      path: {
        gamePath: gamePaths.gamePath,
        savePaths: gamePaths.savePath || []
      },
      launcher: {
        mode: launcher.mode,
        fileConfig: {
          path: launcher.fileConfig.path,
          workingDirectory: launcher.fileConfig.workingDirectory,
          args: [],
          monitorMode: launcher.fileConfig.timerMode,
          monitorPath: launcher.fileConfig.timerPath
        },
        urlConfig: {
          url: launcher.urlConfig.url,
          browserPath: launcher.urlConfig.browserPath,
          monitorMode: launcher.urlConfig.timerMode,
          monitorPath: launcher.urlConfig.timerPath
        },
        scriptConfig: {
          workingDirectory: launcher.scriptConfig.workingDirectory,
          command: launcher.scriptConfig.command,
          monitorMode: launcher.scriptConfig.timerMode,
          monitorPath: launcher.scriptConfig.timerPath
        },
        useMagpie: launcher.useMagpie
      }
    }

    // Save Game Documentation
    await GameDBManager.setGame(gameId, gameDoc)
    await GameDBManager.setGameLocal(gameId, gameLocalDoc)

    // Processing game images
    await processGameImages(gameId, gamePath)

    // Handling game archive attachments
    await processGameSaves(gameId, gamePath)

    // Processing Game Memory Images
    await processGameMemories(gameId, gamePath)

    console.log(`Game ${gameId} Conversion complete`)
  } catch (error) {
    console.error(`Error processing game ${gameId} data:`, error)
    throw error
  }
}

/**
 * Processing game image files
 */
async function processGameImages(gameId: string, gamePath: string): Promise<void> {
  const imageTypes = ['background', 'cover', 'icon', 'logo']
  const possibleExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'ico']

  for (const type of imageTypes) {
    let imageFound = false

    // Try different extensions
    for (const ext of possibleExtensions) {
      const imagePath = path.join(gamePath, `${type}.${ext}`)

      const exists = await fse.pathExists(imagePath)
      if (exists) {
        try {
          const imageData = await fse.readFile(imagePath)
          await GameDBManager.setGameImage(gameId, type as any, imageData, false)

          imageFound = true
          console.log(`Processed ${type} image for game ${gameId}`)
          break
        } catch (error) {
          console.error(`Error processing ${type} image for game ${gameId}:`, error)
        }
      }
    }

    if (!imageFound) {
      console.log(`The game ${gameId} has no ${type} images`)
    }
  }
}

/**
 * Handling game save files
 */
async function processGameSaves(gameId: string, gamePath: string): Promise<void> {
  const savesDir = path.join(gamePath, 'saves')

  const savesDirExists = await fse.pathExists(savesDir)
  if (savesDirExists) {
    const stats = await fse.stat(savesDir)
    if (stats.isDirectory()) {
      // Read all subdirectories under the saves directory (each subdirectory is a saveId)
      const saveFolders = await fse.readdir(savesDir)

      for (const saveId of saveFolders) {
        const saveFolderPath = path.join(savesDir, saveId)

        // Check if it's a directory
        const folderStats = await fse.stat(saveFolderPath)
        if (!folderStats.isDirectory()) continue

        try {
          // Create temporary directory for processing
          const tempZipPath = getAppTempPath(`save-zip-${Date.now()}/`)
          await fse.ensureDir(tempZipPath)

          // Compress the entire save folder
          const zipPath = await zipFolder(saveFolderPath, tempZipPath, saveId)

          // Store to database
          await GameDBManager.setGameSave(gameId, saveId, zipPath)
          console.log(`Processed save directory ${saveId} for game ${gameId}.`)

          // Clean up temporary directory
          await fse.remove(tempZipPath)
        } catch (error) {
          console.error(`Error processing save directory ${saveId} for game ${gameId}:`, error)
        }
      }
    }
  }
}

/**
 * Processing Game Memory Images
 */
async function processGameMemories(gameId: string, gamePath: string): Promise<void> {
  const memoriesDir = path.join(gamePath, 'memories')

  const memoriesDirExists = await fse.pathExists(memoriesDir)
  if (memoriesDirExists) {
    const stats = await fse.stat(memoriesDir)
    if (stats.isDirectory()) {
      // Read all subdirectories under the memories directory (each subdirectory is a memoryId)
      const memoryFolders = await fse.readdir(memoriesDir)

      for (const memoryId of memoryFolders) {
        const memoryFolderPath = path.join(memoriesDir, memoryId)

        // Check if it is a folder
        const folderStats = await fse.stat(memoryFolderPath)
        if (!folderStats.isDirectory()) continue

        // Find a cover file
        const coverFiles = await fse.readdir(memoryFolderPath)
        const coverFile = coverFiles.find((file) => /^cover\.(webp|jpg|jpeg|png|gif)$/i.test(file))

        if (coverFile) {
          const memoryFilePath = path.join(memoryFolderPath, coverFile)

          try {
            const memoryData = await fse.readFile(memoryFilePath)
            await GameDBManager.setGameMemoryImage(gameId, memoryId, memoryData)

            console.log(`Memory image of processed game ${gameId} ${memoryId}`)
          } catch (error) {
            console.error(`Error processing memory image ${memoryId} of game ${gameId}:`, error)
          }
        }
      }
    }
  }
}

/**
 * Convert Collections Data
 */
async function convertCollections(basePath: string): Promise<void> {
  console.log('Start converting collections data...')

  const collectionsPath = path.join(basePath, 'collections.json')

  const exists = await fse.pathExists(collectionsPath)
  if (!exists) {
    console.log('No collections data found')
    return
  }

  try {
    const collections = await readJsonFile<V2Collections>(collectionsPath)

    // Handling each favorite
    for (const collectionId in collections) {
      const collection = collections[collectionId]

      const collectionDoc: Partial<gameCollectionDoc> = {
        _id: collection.id,
        name: collection.name,
        games: collection.games
      }

      await GameDBManager.setCollection(collection.id, collectionDoc)
      console.log(`Converted collection: ${collection.name}`)
    }

    console.log(`Successfully converted ${Object.keys(collections).length} collections`)
  } catch (error) {
    console.error('Error while converting collections data:', error)
    throw error
  }
}

/**
 * Converting configuration data
 */
async function convertConfig(basePath: string): Promise<void> {
  console.log('Start converting configuration data...')

  const configPath = path.join(basePath, 'config.json')

  const exists = await fse.pathExists(configPath)
  if (!exists) {
    console.log('No configuration data found')
    return
  }

  try {
    const v2Config = await readJsonFile<V2Config>(configPath)

    // Convert the general configuration
    await ConfigDBManager.setConfigValue('general', {
      openAtLogin: v2Config.general.openAtLogin,
      quitToTray: v2Config.general.quitToTray,
      language: '',
      hideWindowAfterGameStart: true
    })

    const selectedGroupMap: Record<
      string,
      'none' | 'collection' | 'metadata.genres' | 'metadata.developers' | 'record.playStatus'
    > = {
      none: 'none',
      collection: 'collection',
      genres: 'metadata.genres',
      developers: 'metadata.developers',
      playStatus: 'record.playStatus'
    }

    // Converting game-related configurations
    await ConfigDBManager.setConfigValue('game', {
      scraper: {
        common: {
          defaultDataSource: mapDataSourceName(v2Config.scraper.defaultDataSource)
        },
        vndb: {
          tagSpoilerLevel: 0
        }
      },
      showcase: {
        sort: {
          by: mapSortField(v2Config.others.showcase.sort.by),
          order: v2Config.others.showcase.sort.order
        }
      },
      gameList: {
        sort: {
          by: mapSortField(v2Config.others.gameList.sort.by),
          order: v2Config.others.gameList.sort.order
        },
        selectedGroup: selectedGroupMap[v2Config.others.gameList.selectedGroup] || 'none',
        highlightLocalGames: v2Config.others.gameList.highlightLocalGames,
        markLocalGames: v2Config.others.gameList.markLocalGames,
        showRecentGames: v2Config.appearances.gameList.showRecentGamesInGameList,
        showCollapseButton: true,
        playingStatusOrder: ['unplayed', 'playing', 'finished', 'multiple', 'shelved'],
        playStatusAccordionOpen: ['unplayed', 'playing', 'finished', 'multiple', 'shelved'],
        allGamesAccordionOpen: true,
        recentGamesAccordionOpen: true
      },
      gameHeader: {
        showOriginalName: v2Config.appearances.gameHeader.showOriginalNameInGameHeader
      }
    })

    // Converting Appearance Configuration
    await ConfigDBManager.setConfigValue('appearances.sidebar', {
      showThemeSwitcher: v2Config.appearances.sidebar.showThemeSwitchInSidebar,
      showNSFWBlurSwitcher: true
    })

    // Converting Local Configurations - Game Associations
    await ConfigDBManager.setConfigLocalValue('game.linkage', {
      localeEmulator: {
        path: v2Config.advanced.linkage.localeEmulator.path
      },
      visualBoyAdvance: {
        path: v2Config.advanced.linkage.visualBoyAdvance.path
      },
      magpie: {
        path: v2Config.advanced.linkage.magpie.path,
        hotkey: v2Config.advanced.linkage.magpie.hotkey
      }
    })

    console.log('Configuration conversion complete')
  } catch (error) {
    console.error('Error while converting configuration data:', error)
    throw error
  }
}

/**
 * Mapping Data Source Name
 */
function mapDataSourceName(
  source: string
): 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' | 'dlsite' {
  switch (source) {
    case 'steam':
      return 'steam'
    case 'vndb':
      return 'vndb'
    case 'bangumi':
      return 'bangumi'
    case 'ymgal':
      return 'ymgal'
    case 'igdb':
      return 'igdb'
    case 'dlsite':
      return 'dlsite'
    default:
      return 'steam'
  }
}

/**
 * Mapping Sorted Fields
 */
function mapSortField(
  field: string
):
  | 'metadata.name'
  | 'metadata.releaseDate'
  | 'record.lastRunDate'
  | 'record.addDate'
  | 'record.playTime' {
  switch (field) {
    case 'name':
      return 'metadata.name'
    case 'releaseDate':
      return 'metadata.releaseDate'
    case 'lastRunDate':
      return 'record.lastRunDate'
    case 'addDate':
      return 'record.addDate'
    case 'playingTime':
    case 'playTime':
      return 'record.playTime'
    default:
      return 'metadata.name'
  }
}

/**
 * Reading JSON files
 */
async function readJsonFile<T>(filePath: string): Promise<T> {
  const exists = await fse.pathExists(filePath)
  if (!exists) {
    return {} as T
  }

  try {
    const content = await fse.readFile(filePath, 'utf8')
    return JSON.parse(content) as T
  } catch (error) {
    throw new Error(`Unable to parse JSON file ${filePath}: ${error}`)
  }
}

/**
 * Cleaning up temporary files
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    const exists = await fse.pathExists(tempDir)
    if (exists) {
      console.log(`Cleaning up temporary files: ${tempDir}`)
      await fse.remove(tempDir)
    }
  } catch (error) {
    console.error(`Error clearing temporary files: ${error}`)
  }
}

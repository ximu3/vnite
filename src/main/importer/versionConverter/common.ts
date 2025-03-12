// DatabaseV2toV3Converter.ts
import * as path from 'path'
import * as fse from 'fs-extra'
import * as unzipper from 'unzipper'
import { v4 as uuidv4 } from 'uuid'
import { GameDBManager } from '~/database/game'
import { ConfigDBManager } from '~/database/config'
import { stopSync } from '~/database'
import { gameDoc, gameLocalDoc, gameCollectionDoc } from '@appTypes/database'
import { getAppTempPath } from '~/utils'
import { app } from 'electron'

// v2数据库类型定义
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
 * 主函数：从zip文件导入V2数据库并转换为V3
 * @param zipFilePath zip文件路径
 */
export async function convertV2toV3Database(zipFilePath: string): Promise<void> {
  console.log('开始从ZIP文件导入数据库...')

  // 创建临时目录
  const tempDir = getAppTempPath(`v2toV3-${uuidv4()}`)
  stopSync() // 停止同步
  try {
    // 确保临时目录存在
    await fse.ensureDir(tempDir)

    // 解压文件
    await extractZipFile(zipFilePath, tempDir)

    // 转换数据
    await convertGames(tempDir)
    await convertCollections(tempDir)
    await convertConfig(tempDir)

    console.log('数据库转换完成！')
  } catch (error) {
    console.error('转换过程中发生错误:', error)
    throw error
  } finally {
    // 清理临时文件
    await new Promise((resolve) => setTimeout(resolve, 100))
    await cleanupTempFiles(tempDir)
    fse.removeSync(tempDir)
    app.relaunch()
    app.exit()
  }
}

/**
 * 解压zip文件到指定目录
 */
async function extractZipFile(zipFilePath: string, targetDir: string): Promise<void> {
  console.log(`解压文件 ${zipFilePath} 到 ${targetDir}`)

  return new Promise<void>((resolve, reject) => {
    fse
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: targetDir }))
      .on('error', (err) => {
        reject(new Error(`解压文件失败: ${err}`))
      })
      .on('close', () => {
        console.log('文件解压完成')
        resolve()
      })
  })
}

/**
 * 转换游戏数据
 */
async function convertGames(basePath: string): Promise<void> {
  console.log('开始转换游戏数据...')

  const gamesPath = path.join(basePath, 'games')
  const exists = await fse.pathExists(gamesPath)
  if (!exists) {
    console.error('游戏目录不存在')
    return
  }

  // 读取games目录下的所有子目录
  const items = await fse.readdir(gamesPath)
  const gameIds: string[] = []

  for (const item of items) {
    const itemPath = path.join(gamesPath, item)
    const stats = await fse.stat(itemPath)
    if (stats.isDirectory() && item !== 'config.json') {
      gameIds.push(item)
    }
  }

  // 处理每个游戏
  for (const gameId of gameIds) {
    try {
      await convertGame(gameId, path.join(gamesPath, gameId))
    } catch (error) {
      console.error(`转换游戏 ${gameId} 时出错:`, error)
    }
  }

  console.log(`成功转换 ${gameIds.length} 个游戏`)
}

/**
 * 转换单个游戏数据
 */
async function convertGame(gameId: string, gamePath: string): Promise<void> {
  console.log(`正在转换游戏: ${gameId}`)

  // 读取游戏相关JSON文件
  try {
    const metadata = await readJsonFile<V2GameMetadata>(path.join(gamePath, 'metadata.json'))
    const launcher = await readJsonFile<V2GameLauncher>(path.join(gamePath, 'launcher.json'))
    const memory = await readJsonFile<V2GameMemory>(path.join(gamePath, 'memory.json'))
    const gamePaths = await readJsonFile<V2GamePath>(path.join(gamePath, 'path.json'))
    const record = await readJsonFile<V2GameRecord>(path.join(gamePath, 'record.json'))
    const save = await readJsonFile<V2GameSave>(path.join(gamePath, 'save.json'))
    const utils = await readJsonFile<V2GameUtils>(path.join(gamePath, 'utils.json'))

    // 创建v3的游戏文档
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
        ymgalId: metadata.ymgalId || ''
      },
      record: {
        addDate: record.addDate || '',
        lastRunDate: record.lastRunDate || '',
        score: record.score || -1,
        playTime: record.playingTime || 0, // 字段名称变化
        playStatus: record.playStatus || 'unplayed', // 字段名称变化
        timers: record.timer || [] // 字段名称变化
      },
      save: {
        saveList: {},
        maxBackups: 7 // 默认值
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
        }
      }
    }

    // 处理存档数据
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

    // 处理记忆数据
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

    // 创建v3的游戏本地文档
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
          monitorMode: launcher.fileConfig.timerMode, // 字段名称变化
          monitorPath: launcher.fileConfig.timerPath // 字段名称变化
        },
        urlConfig: {
          url: launcher.urlConfig.url,
          browserPath: launcher.urlConfig.browserPath,
          monitorMode: launcher.urlConfig.timerMode, // 字段名称变化
          monitorPath: launcher.urlConfig.timerPath // 字段名称变化
        },
        scriptConfig: {
          workingDirectory: launcher.scriptConfig.workingDirectory,
          command: launcher.scriptConfig.command,
          monitorMode: launcher.scriptConfig.timerMode, // 字段名称变化
          monitorPath: launcher.scriptConfig.timerPath // 字段名称变化
        },
        useMagpie: launcher.useMagpie
      }
    }

    // 保存游戏文档
    await GameDBManager.setGame(gameId, gameDoc)
    await GameDBManager.setGameLocal(gameId, gameLocalDoc)

    // 处理游戏图像
    await processGameImages(gameId, gamePath)

    // 处理游戏存档附件
    await processGameSaves(gameId, gamePath)

    // 处理游戏记忆图像
    await processGameMemories(gameId, gamePath)

    console.log(`游戏 ${gameId} 转换完成`)
  } catch (error) {
    console.error(`处理游戏 ${gameId} 数据时出错:`, error)
    throw error
  }
}

/**
 * 处理游戏图像文件
 */
async function processGameImages(gameId: string, gamePath: string): Promise<void> {
  const imageTypes = ['background', 'cover', 'icon', 'logo']
  const possibleExtensions = ['webp', 'jpg', 'jpeg', 'png', 'gif', 'ico']

  for (const type of imageTypes) {
    let imageFound = false

    // 尝试不同的扩展名
    for (const ext of possibleExtensions) {
      const imagePath = path.join(gamePath, `${type}.${ext}`)

      const exists = await fse.pathExists(imagePath)
      if (exists) {
        try {
          const imageData = await fse.readFile(imagePath)
          await GameDBManager.setGameImage(gameId, type as any, imageData)

          imageFound = true
          console.log(`已处理游戏 ${gameId} 的 ${type} 图像`)
          break
        } catch (error) {
          console.error(`处理游戏 ${gameId} 的 ${type} 图像时出错:`, error)
        }
      }
    }

    if (!imageFound) {
      console.log(`游戏 ${gameId} 没有 ${type} 图像`)
    }
  }
}

/**
 * 处理游戏存档文件
 */
async function processGameSaves(gameId: string, gamePath: string): Promise<void> {
  const savesDir = path.join(gamePath, 'saves')

  const savesDirExists = await fse.pathExists(savesDir)
  if (savesDirExists) {
    const stats = await fse.stat(savesDir)
    if (stats.isDirectory()) {
      const saveFiles = await fse.readdir(savesDir)

      for (const saveFile of saveFiles) {
        if (saveFile.endsWith('.zip')) {
          const saveId = saveFile.replace('.zip', '')
          const saveFilePath = path.join(savesDir, saveFile)

          try {
            const saveData = await fse.readFile(saveFilePath)
            await GameDBManager.setGameSave(gameId, saveId, saveData)

            console.log(`已处理游戏 ${gameId} 的存档 ${saveId}`)
          } catch (error) {
            console.error(`处理游戏 ${gameId} 的存档 ${saveId} 时出错:`, error)
          }
        }
      }
    }
  }
}

/**
 * 处理游戏记忆图像
 */
async function processGameMemories(gameId: string, gamePath: string): Promise<void> {
  const memoriesDir = path.join(gamePath, 'memories')

  const memoriesDirExists = await fse.pathExists(memoriesDir)
  if (memoriesDirExists) {
    const stats = await fse.stat(memoriesDir)
    if (stats.isDirectory()) {
      const memoryFiles = await fse.readdir(memoriesDir)

      for (const memoryFile of memoryFiles) {
        const fileExtMatch = memoryFile.match(/(.+)\.(webp|jpg|jpeg|png|gif)$/)
        if (fileExtMatch) {
          const memoryId = fileExtMatch[1]
          const memoryFilePath = path.join(memoriesDir, memoryFile)

          try {
            const memoryData = await fse.readFile(memoryFilePath)
            await GameDBManager.setGameMemoryImage(gameId, memoryId, memoryData)

            console.log(`已处理游戏 ${gameId} 的记忆图像 ${memoryId}`)
          } catch (error) {
            console.error(`处理游戏 ${gameId} 的记忆图像 ${memoryId} 时出错:`, error)
          }
        }
      }
    }
  }
}

/**
 * 转换收藏夹数据
 */
async function convertCollections(basePath: string): Promise<void> {
  console.log('开始转换收藏夹数据...')

  const collectionsPath = path.join(basePath, 'collections.json')

  const exists = await fse.pathExists(collectionsPath)
  if (!exists) {
    console.log('没有找到收藏夹数据')
    return
  }

  try {
    const collections = await readJsonFile<V2Collections>(collectionsPath)

    // 处理每个收藏夹
    for (const collectionId in collections) {
      const collection = collections[collectionId]

      const collectionDoc: Partial<gameCollectionDoc> = {
        _id: collection.id,
        name: collection.name,
        games: collection.games
      }

      await GameDBManager.setCollection(collection.id, collectionDoc)
      console.log(`已转换收藏夹: ${collection.name}`)
    }

    console.log(`成功转换 ${Object.keys(collections).length} 个收藏夹`)
  } catch (error) {
    console.error('转换收藏夹数据时出错:', error)
    throw error
  }
}

/**
 * 转换配置数据
 */
async function convertConfig(basePath: string): Promise<void> {
  console.log('开始转换配置数据...')

  const configPath = path.join(basePath, 'games', 'config.json')

  const exists = await fse.pathExists(configPath)
  if (!exists) {
    console.log('没有找到配置数据')
    return
  }

  try {
    const v2Config = await readJsonFile<V2Config>(configPath)

    // 转换一般配置
    await ConfigDBManager.setConfigValue('general', {
      openAtLogin: v2Config.general.openAtLogin,
      quitToTray: v2Config.general.quitToTray,
      language: '' // v2没有语言设置
    })

    // 转换游戏相关配置
    await ConfigDBManager.setConfigValue('game', {
      scraper: {
        defaultDatasSource: mapDataSourceName(v2Config.scraper.defaultDataSource)
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
        selectedGroup: v2Config.others.gameList.selectedGroup as
          | 'collection'
          | 'developers'
          | 'genres',
        highlightLocalGames: v2Config.others.gameList.highlightLocalGames,
        markLocalGames: v2Config.others.gameList.markLocalGames,
        showRecentGames: v2Config.appearances.gameList.showRecentGamesInGameList,
        playingStatusOrder: ['unplayed', 'playing', 'finished', 'multiple', 'shelved'] // 默认顺序
      },
      gameHeader: {
        showOriginalName: v2Config.appearances.gameHeader.showOriginalNameInGameHeader
      }
    })

    // 转换外观配置
    await ConfigDBManager.setConfigValue('appearances', {
      sidebar: {
        showThemeSwitcher: v2Config.appearances.sidebar.showThemeSwitchInSidebar
      }
    })

    // 转换本地配置 - 游戏关联
    await ConfigDBManager.setConfigLocalValue('game', {
      linkage: {
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
      }
    })

    console.log('配置转换完成')
  } catch (error) {
    console.error('转换配置数据时出错:', error)
    throw error
  }
}

/**
 * 映射数据源名称
 */
function mapDataSourceName(source: string): 'steam' | 'vndb' | 'bangumi' | 'ymgal' | 'igdb' {
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
    default:
      return 'steam' // 默认返回steam
  }
}

/**
 * 映射排序字段
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
      return 'metadata.name' // 默认返回名称
  }
}

/**
 * 读取JSON文件
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
    throw new Error(`无法解析JSON文件 ${filePath}: ${error}`)
  }
}

/**
 * 清理临时文件
 */
async function cleanupTempFiles(tempDir: string): Promise<void> {
  try {
    const exists = await fse.pathExists(tempDir)
    if (exists) {
      console.log(`清理临时文件: ${tempDir}`)
      await fse.remove(tempDir)
    }
  } catch (error) {
    console.error(`清理临时文件出错: ${error}`)
  }
}

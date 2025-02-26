import * as fse from 'fs-extra'
import * as path from 'path'
import * as unzipper from 'unzipper'
import { generateUUID } from '@appUtils'
import { launcherPreset } from '~/launcher'
import { app } from 'electron'

// interface definition
interface V1GameDetail {
  name: string
  chineseName: string
  releaseDate: string
  introduction: string
  developer: string
  websites: { title: string; url: string }[]
  addDate: string
  lastVisitDate: number
  playStatus: number
  gameDuration: number
}

interface V1Save {
  id: number
  date: string
  note: string
  path: string
}

interface V2Save {
  id: string
  date: string
  note: string
}

interface V2Metadata {
  id: string
  name: string
  originalName: string
  releaseDate: string
  description: string
  developers: string[]
  relatedSites: { label: string; url: string }[]
}

interface V1Category {
  id: number
  name: string
  games: string[]
}

interface V2Collection {
  id: string
  name: string
  games: string[]
}

interface V2Record {
  addDate: string
  lastRunDate: string
  score: number
  playingTime: number
  timer: any[]
  playStatus: string
}

interface V1Config {
  cloudSync: {
    enabled: boolean
    mode: string
    webdav: {
      url: string
      path: string
      username: string
      password: string
      lastSyncTime: string
    }
    github: {
      clientId: string
      clientSecret: string
      username: string
      accessToken: string
      repoUrl: string
      lastSyncTime: string
    }
  }
  advance: {
    lePath: string
  }
  general: {
    theme: string
    language: string
    quitToTray: boolean
  }
  others: {
    posterWall: {
      sortOrder: string
      sortBy: string
    }
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
    }
  }
  others: {
    showcase: {
      sort: {
        by: string
        order: string
      }
    }
  }
  advanced: {
    linkage: {
      localeEmulator: {
        path: string
      }
    }
  }
}

async function convertConfig(tempDir: string, outputDir: string): Promise<void> {
  const v1ConfigPath = path.join(tempDir, 'config', 'config.json')

  // Default v2 configuration
  const defaultV2Config: V2Config = {
    general: {
      openAtLogin: false,
      quitToTray: false
    },
    scraper: {
      defaultDataSource: 'steam'
    },
    cloudSync: {
      enabled: false,
      config: {
        webdavUrl: '',
        remotePath: '',
        username: '',
        password: ''
      }
    },
    others: {
      showcase: {
        sort: {
          by: 'name',
          order: 'desc'
        }
      }
    },
    advanced: {
      linkage: {
        localeEmulator: {
          path: ''
        }
      }
    }
  }

  // If the v1 configuration file exists, it reads and converts the
  if (await fse.pathExists(v1ConfigPath)) {
    const v1Config: V1Config = await fse.readJson(v1ConfigPath)

    // Create v2 configurations, merge defaults and v1 values that need to be preserved
    const v2Config: V2Config = {
      ...defaultV2Config,
      general: {
        ...defaultV2Config.general,
        quitToTray: v1Config.general.quitToTray
      },
      others: {
        showcase: {
          sort: {
            by: v1Config.others.posterWall.sortBy,
            order: v1Config.others.posterWall.sortOrder
          }
        }
      },
      advanced: {
        linkage: {
          localeEmulator: {
            path: v1Config.advance.lePath
          }
        }
      }
    }

    // Save v2 configuration file
    await fse.writeJson(path.join(outputDir, 'config.json'), v2Config, { spaces: 2 })
  } else {
    // If the v1 configuration file does not exist, the default configuration is used
    await fse.writeJson(path.join(outputDir, 'config.json'), defaultV2Config, { spaces: 2 })
  }
}

export async function importV1Data(zipFilePath: string, outputDir: string): Promise<void> {
  // Create a temporary decompression directory
  const tempDir = path.join(outputDir, '_temp')
  await fse.ensureDir(tempDir)

  try {
    // decompress a file
    await fse
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .promise()

    await convertConfig(tempDir, outputDir)

    // Read v1 data
    const dataJsonPath = path.join(tempDir, 'data', 'data.json')
    const pathsJsonPath = path.join(tempDir, 'path', 'paths.json')
    const categoriesJsonPath = path.join(tempDir, 'data', 'categories.json')

    const dataJson = await fse.readJson(dataJsonPath)
    const pathsJson = await fse.readJson(pathsJsonPath)
    const categories: V1Category[] = await fse.readJson(categoriesJsonPath)

    // Creating a Game ID Mapping Table
    const gameIdMap: Record<string, string> = {}

    // Convert game data
    for (const oldGameId in dataJson) {
      const newGameId = generateUUID()
      gameIdMap[oldGameId] = newGameId

      const gameDetail: V1GameDetail = dataJson[oldGameId].detail
      const gameSaves: V1Save[] | undefined = dataJson[oldGameId].saves
      const v2Metadata: V2Metadata = {
        id: newGameId,
        name: gameDetail.chineseName || gameDetail.name,
        originalName: gameDetail.name,
        releaseDate: gameDetail.releaseDate,
        description: gameDetail.introduction,
        developers: [gameDetail.developer],
        relatedSites: gameDetail.websites.map((site) => ({
          label: site.title,
          url: site.url
        }))
      }

      // Creating game catalogs and saving metadata
      const gameDir = path.join(outputDir, 'games', newGameId)
      await fse.ensureDir(gameDir)
      await fse.writeJson(path.join(gameDir, 'metadata.json'), v2Metadata, { spaces: 2 })

      // Copying Image Files
      const imageFiles = ['background.webp', 'cover.webp', 'icon.png', 'icon.ico']
      for (const file of imageFiles) {
        const srcPath = path.join(tempDir, 'data', 'games', oldGameId, file)
        const destPath = path.join(gameDir, file)
        if (await fse.pathExists(srcPath)) {
          await fse.copy(srcPath, destPath)
        }
      }

      // Processing path information
      const pathInfo = pathsJson[oldGameId]
      if (pathInfo) {
        const gamePath = pathInfo.gamePath || ''
        const savePath = pathInfo.savePath || ''

        const pathData = {
          gamePath: gamePath,
          savePath: {
            mode: isFilePath(savePath) ? 'file' : 'folder',
            folder: isFilePath(savePath) ? [] : [savePath],
            file: isFilePath(savePath) ? [savePath] : []
          }
        }

        await fse.writeJson(path.join(gameDir, 'path.json'), pathData, { spaces: 2 })

        if (gamePath) {
          await launcherPreset('default', newGameId)
        }
      }

      // Creating Record Files
      const v2Record: V2Record = {
        addDate: new Date(gameDetail.addDate).toISOString(),
        lastRunDate: gameDetail.lastVisitDate
          ? new Date(gameDetail.lastVisitDate).toISOString()
          : '',
        score: -1,
        playingTime: gameDetail?.gameDuration * 1000 || 0,
        timer: [],
        playStatus: convertPlayStatus(gameDetail.playStatus)
      }
      await fse.writeJson(path.join(gameDir, 'record.json'), v2Record, { spaces: 2 })

      // Converting archived data
      const v2Saves: Record<string, V2Save> = {}
      if (Array.isArray(gameSaves)) {
        for (const v1Save of gameSaves) {
          const newSaveId = generateUUID()
          v2Saves[newSaveId] = {
            id: newSaveId,
            date: new Date(v1Save.date).toISOString(),
            note: v1Save.note
          }

          // Copying archive files
          const oldSavePath = path.join(
            tempDir,
            'data',
            'games',
            oldGameId,
            'saves',
            v1Save.id.toString()
          )
          const newSavePath = path.join(gameDir, 'saves', newSaveId)

          console.log(`Checking existence of: ${oldSavePath}`)
          if (await fse.pathExists(oldSavePath)) {
            console.log(`Copying save from ${oldSavePath} to ${newSavePath}`)
            await fse.ensureDir(path.dirname(newSavePath))
            await fse.copy(oldSavePath, newSavePath)
          } else {
            console.warn(`Save file does not exist: ${oldSavePath}`)
          }
        }
      }

      // Save v2 archive information
      await fse.writeJson(path.join(gameDir, 'save.json'), v2Saves, { spaces: 2 })
    }

    // Converting Categories to Sets
    const collections: Record<string, V2Collection> = {}
    categories.forEach((category) => {
      // Skip categories with id 0
      if (category.id === 0) {
        return
      }
      // Skip empty classification
      if (category.games.length === 0) {
        return
      }
      const collectionId = generateUUID()
      collections[collectionId] = {
        id: collectionId,
        name: category.name,
        games: category.games
          .filter((oldGameId) => gameIdMap[oldGameId])
          .map((oldGameId) => gameIdMap[oldGameId])
      }
    })

    await fse.writeJson(path.join(outputDir, 'collections.json'), collections, { spaces: 2 })

    return
  } finally {
    // Clean up the temporary catalog
    await new Promise((resolve) => setTimeout(resolve, 100))
    fse.removeSync(tempDir)
    app.relaunch()
    app.exit()
  }
}

// Determine if the path is a file path
function isFilePath(filePath: string): boolean {
  // Simple judgment: if the path has a file extension, it is considered a file path
  return path.extname(filePath) !== ''
}

// Convert the playStatus of v1 to the format of v2
function convertPlayStatus(playStatus: number): string {
  switch (playStatus) {
    case 0:
      return 'unplayed'
    case 1:
      return 'playing'
    case 2:
      return 'finished'
    case 3:
      return 'multiple'
    default:
      return 'unplayed'
  }
}

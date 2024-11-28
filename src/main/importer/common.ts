import * as fse from 'fs-extra'
import * as path from 'path'
import * as unzipper from 'unzipper'
import { generateUUID } from '~/utils'
import { stopWatcher } from '~/watcher'
import { launcherPreset } from '~/launcher'
import { app } from 'electron'

// 接口定义
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

  // 默认的v2配置
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

  // 如果v1配置文件存在，则读取并转换
  if (await fse.pathExists(v1ConfigPath)) {
    const v1Config: V1Config = await fse.readJson(v1ConfigPath)

    // 创建v2配置，合并默认值和需要保留的v1值
    const v2Config: V2Config = {
      ...defaultV2Config,
      general: {
        ...defaultV2Config.general,
        quitToTray: v1Config.general.quitToTray // 保留 quitToTray
      },
      others: {
        showcase: {
          sort: {
            by: v1Config.others.posterWall.sortBy, // 保留 sortBy
            order: v1Config.others.posterWall.sortOrder // 保留 sortOrder
          }
        }
      },
      advanced: {
        linkage: {
          localeEmulator: {
            path: v1Config.advance.lePath // 将 lePath 存储在新的位置
          }
        }
      }
    }

    // 保存v2配置文件
    await fse.writeJson(path.join(outputDir, 'config.json'), v2Config, { spaces: 2 })
  } else {
    // 如果v1配置文件不存在，则使用默认配置
    await fse.writeJson(path.join(outputDir, 'config.json'), defaultV2Config, { spaces: 2 })
  }
}

export async function importV1Data(zipFilePath: string, outputDir: string): Promise<void> {
  // 停止监视器
  stopWatcher()
  // 创建临时解压目录
  const tempDir = path.join(outputDir, '_temp')
  await fse.ensureDir(tempDir)

  try {
    // 解压缩文件
    await fse
      .createReadStream(zipFilePath)
      .pipe(unzipper.Extract({ path: tempDir }))
      .promise()

    await convertConfig(tempDir, outputDir)

    // 读取v1数据
    const dataJsonPath = path.join(tempDir, 'data', 'data.json')
    const pathsJsonPath = path.join(tempDir, 'path', 'paths.json')
    const categoriesJsonPath = path.join(tempDir, 'data', 'categories.json')

    const dataJson = await fse.readJson(dataJsonPath)
    const pathsJson = await fse.readJson(pathsJsonPath)
    const categories: V1Category[] = await fse.readJson(categoriesJsonPath)

    // 创建游戏ID映射表
    const gameIdMap: Record<string, string> = {}

    // 转换游戏数据
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

      // 创建游戏目录和保存元数据
      const gameDir = path.join(outputDir, 'games', newGameId)
      await fse.ensureDir(gameDir)
      await fse.writeJson(path.join(gameDir, 'metadata.json'), v2Metadata, { spaces: 2 })

      // 复制图片文件
      const imageFiles = ['background.webp', 'cover.webp', 'icon.png']
      for (const file of imageFiles) {
        const srcPath = path.join(tempDir, 'data', 'games', oldGameId, file)
        const destPath = path.join(gameDir, file)
        if (await fse.pathExists(srcPath)) {
          await fse.copy(srcPath, destPath)
        }
      }

      // 处理路径信息
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

      // 创建记录文件
      const v2Record: V2Record = {
        addDate: new Date(gameDetail.addDate).toISOString(),
        lastRunDate: gameDetail.lastVisitDate
          ? new Date(gameDetail.lastVisitDate).toISOString()
          : '',
        score: -1, // 假设没有评分信息
        playingTime: gameDetail?.gameDuration || 0, // 假设没有游戏时间信息
        timer: [], // 假设没有计时器信息
        playStatus: convertPlayStatus(gameDetail.playStatus)
      }
      await fse.writeJson(path.join(gameDir, 'record.json'), v2Record, { spaces: 2 })

      // 转换存档数据
      const v2Saves: Record<string, V2Save> = {}
      if (Array.isArray(gameSaves)) {
        for (const v1Save of gameSaves) {
          const newSaveId = generateUUID()
          v2Saves[newSaveId] = {
            id: newSaveId,
            date: new Date(v1Save.date).toISOString(),
            note: v1Save.note
          }

          // 复制存档文件
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

      // 保存v2存档信息
      await fse.writeJson(path.join(gameDir, 'save.json'), v2Saves, { spaces: 2 })
    }

    // 转换分类为集合
    const collections: Record<string, V2Collection> = {}
    categories.forEach((category) => {
      // 跳过id为0的分类
      if (category.id === 0) {
        return
      }
      // 跳过空分类
      if (category.games.length === 0) {
        return
      }
      const collectionId = generateUUID()
      collections[collectionId] = {
        id: collectionId,
        name: category.name,
        games: category.games
          .filter((oldGameId) => gameIdMap[oldGameId]) // 确保游戏ID存在
          .map((oldGameId) => gameIdMap[oldGameId]) // 转换为新UUID
      }
    })

    // 保存collections.json
    await fse.writeJson(path.join(outputDir, 'collections.json'), collections, { spaces: 2 })

    return
  } finally {
    // 清理临时目录
    await fse.remove(tempDir)
    app.relaunch()
    app.exit()
  }
}

// 判断路径是否为文件路径
function isFilePath(filePath: string): boolean {
  // 简单判断：如果路径有文件扩展名，则认为是文件路径
  return path.extname(filePath) !== ''
}

// 将v1的playStatus转换为v2的格式
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

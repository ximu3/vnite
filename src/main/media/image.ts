import fse from 'fs-extra'
import path from 'path'
import { getDataPath } from '~/utils'

const IMAGE_FORMATS = [
  'webp', // 最优先使用 webp
  'jpg',
  'jpeg',
  'png',
  'ico'
] as const

export async function getBackgroundPath(gameId: string): Promise<string> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'background'

  // 按优先级检查每个格式
  for (const format of IMAGE_FORMATS) {
    const filePath = path.join(baseFolder, `${baseName}.${format}`)
    if (await fse.pathExists(filePath)) {
      return filePath
    }
  }

  return ''
}

export async function getCoverPath(gameId: string): Promise<string> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'cover'

  // 按优先级检查每个格式
  for (const format of IMAGE_FORMATS) {
    const filePath = path.join(baseFolder, `${baseName}.${format}`)
    if (await fse.pathExists(filePath)) {
      return filePath
    }
  }

  return ''
}

export async function getIconPath(gameId: string): Promise<string> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'icon'

  // 按优先级检查每个格式
  for (const format of IMAGE_FORMATS) {
    const filePath = path.join(baseFolder, `${baseName}.${format}`)
    if (await fse.pathExists(filePath)) {
      return filePath
    }
  }

  return ''
}

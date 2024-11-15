import fse from 'fs-extra'
import path from 'path'
import { getDataPath } from '~/utils'

const IMAGE_FORMATS = [
  'webp', // 最优先使用 webp
  'jpg',
  'jpeg',
  'jfif',
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

export async function setBackgroundWithFile(gameId: string, filePath: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'background'

  // 检查文件格式
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // 移动文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setBackgroundWithUrl(gameId: string, url: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'background'

  //去除参数
  url = url.split('?')[0]

  // 检查 URL 格式
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // 下载文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setCoverWithFile(gameId: string, filePath: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'cover'

  // 检查文件格式
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // 移动文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setCoverWithUrl(gameId: string, url: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'cover'

  //去除参数
  url = url.split('?')[0]

  // 检查 URL 格式
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // 下载文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setIconWithFile(gameId: string, filePath: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'icon'

  // 检查文件格式
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // 移动文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setIconWithUrl(gameId: string, url: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'icon'

  //去除参数
  url = url.split('?')[0]

  // 检查 URL 格式
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // 下载文件
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // 删除其他格式的文件
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

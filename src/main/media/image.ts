import fse from 'fs-extra'
import path from 'path'
import { getDataPath, getAppTempPath } from '~/utils'

const IMAGE_FORMATS = [
  'webp', // Top priority is given to the use of webp
  'jpg',
  'jpeg',
  'jfif',
  'png',
  'ico'
] as const

export async function getBackgroundPath(gameId: string): Promise<string> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'background'

  // Check each format by priority
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

  // Check each format by priority
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

  // Check each format by priority
  for (const format of IMAGE_FORMATS) {
    const filePath = path.join(baseFolder, `${baseName}.${format}`)
    if (await fse.pathExists(filePath)) {
      return filePath
    }
  }

  return ''
}

export async function getLogoPath(gameId: string): Promise<string> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'logo'

  // Check each format by priority
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

  // Check the file format
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // Moving files
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // Deletion of documents in other formats
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

  // Remove parameters
  url = url.split('?')[0]

  // Checking the URL format
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // Download file
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // Deletion of documents in other formats
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

  // Check the file format
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // Moving files
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // Deletion of documents in other formats
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

  // Remove parameters
  url = url.split('?')[0]

  // Checking the URL format
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // Download file
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // Deletion of documents in other formats
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

  // Check the file format
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // Moving files
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // Deletion of documents in other formats
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

  // Remove parameters
  url = url.split('?')[0]

  // Checking the URL format
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // Download file
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // Deletion of documents in other formats
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setLogoWithFile(gameId: string, filePath: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'logo'

  // Check the file format
  const ext = path.extname(filePath).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported file format: ${ext}`)
  }

  // Moving files
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  await fse.copy(filePath, targetPath, { overwrite: true })

  // Deletion of documents in other formats
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function setLogoWithUrl(gameId: string, url: string): Promise<void> {
  const baseFolder = await getDataPath(`games/${gameId}`)
  const baseName = 'logo'

  // Remove parameters
  url = url.split('?')[0]

  // Checking the URL format
  const ext = path.extname(url).slice(1).toLowerCase()
  if (!IMAGE_FORMATS.includes(ext as any)) {
    throw new Error(`Unsupported URL format: ${ext}`)
  }

  // Download file
  const targetPath = path.join(baseFolder, `${baseName}.${ext}`)
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(targetPath, buffer)

  // Deletion of documents in other formats
  for (const format of IMAGE_FORMATS) {
    if (format !== ext) {
      const otherPath = path.join(baseFolder, `${baseName}.${format}`)
      await fse.remove(otherPath)
    }
  }
}

export async function downloadTempImage(url: string): Promise<string> {
  const tempPath = path.join(getAppTempPath(), `${Date.now()}.png`)

  // Download file
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  await fse.writeFile(tempPath, buffer)

  return tempPath
}

export async function saveTempImage(data: Uint8Array): Promise<string> {
  const tempPath = path.join(getAppTempPath(), `${Date.now()}.png`)
  // Convert Uint8Array to Buffer
  const buffer = Buffer.from(data)
  await fse.writeFile(tempPath, buffer)
  return tempPath
}

export async function getImageBlob(filePath: string): Promise<string> {
  // Returns base64
  const buffer = await fse.readFile(filePath)
  return `image/jpeg;base64,${buffer.toString('base64')}`
}

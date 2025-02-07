import fse from 'fs-extra'
import { generateUUID, getDataPath } from '~/utils'
import { getDBValue, setDBValue } from './services'
import { IMAGE_FORMATS } from '~/media/image'

export async function addMemory(gameId: string): Promise<void> {
  const memoryList = await getDBValue(`games/${gameId}/memory.json`, ['memoryList'], {})
  const memoryId = generateUUID()
  const date = new Date().toISOString()
  const memory = { id: memoryId, date, note: '' }
  memoryList[memoryId] = memory
  await setDBValue(`games/${gameId}/memory.json`, ['memoryList'], memoryList)
}

export async function deleteMemory(gameId: string, memoryId: string): Promise<void> {
  const imgPath = await getDataPath(`games/${gameId}/memories/${memoryId}`)
  await fse.remove(imgPath)
}

export async function updateMemoryCover(
  gameId: string,
  memoryId: string,
  imgPath: string
): Promise<void> {
  const imgExtension = imgPath.split('.').pop()
  const imgSavePath = await getDataPath(
    `games/${gameId}/memories/${memoryId}/cover.${imgExtension}`
  )
  // Clear other covers
  const imgPaths = await getDataPath(`games/${gameId}/memories/${memoryId}/cover.*`)
  await fse.remove(imgPaths)
  await fse.copy(imgPath, imgSavePath)
}

export async function getMemoryCoverPath(gameId: string, memoryId: string): Promise<string> {
  // Iterate over extensions
  for (const format of IMAGE_FORMATS) {
    const filePath = await getDataPath(`games/${gameId}/memories/${memoryId}/cover.${format}`)
    if (await fse.pathExists(filePath)) {
      return filePath
    }
  }
  return ''
}

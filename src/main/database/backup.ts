import { getDataPath, zipFolder, unzipFile } from '~/utils'
import { app } from 'electron'

export async function backupDatabase(targetPath: string, exclude?: string[]): Promise<void> {
  const dataPath = await getDataPath('')
  await zipFolder(dataPath, targetPath, 'vnite-database', {
    exclude: exclude
  })
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  const dataPath = await getDataPath('')
  await unzipFile(sourcePath, dataPath)
  app.relaunch()
  app.exit()
}

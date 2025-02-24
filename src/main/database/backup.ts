import { getDataPath, zipFolder, unzipFile } from '~/utils'
import { app } from 'electron'
import fse from 'fs-extra'

export async function backupDatabase(targetPath: string, exclude?: string[]): Promise<void> {
  const dataPath = getDataPath()
  await zipFolder(dataPath, targetPath, 'vnite-database', {
    exclude: exclude
  })
}

export async function restoreDatabase(sourcePath: string): Promise<void> {
  const dataPath = getDataPath()
  await fse.remove(dataPath)
  await unzipFile(sourcePath, dataPath)
  app.relaunch()
  app.exit()
}

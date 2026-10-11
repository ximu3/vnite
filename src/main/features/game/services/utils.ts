import { app } from 'electron'
import * as native from 'vnite-native'
import { GameDBManager } from '~/core/database'

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Prefer the embedded icon, falling back to the shell icon for scripts and iconless executables.
    const icon = await native.extractExecutableIcon(filePath).catch(async () => {
      const fileIcon = await app.getFileIcon(filePath)
      return fileIcon.toPNG()
    })

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon)

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

import { app } from 'electron'
import { GameDBManager } from '~/core/database'

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Get file icon
    const icon = await app.getFileIcon(filePath)

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon.toPNG())

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

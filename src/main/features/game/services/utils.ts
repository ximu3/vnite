import * as native from 'vnite-native'
import { GameDBManager } from '~/core/database'

export async function saveGameIconByFile(gameId: string, filePath: string): Promise<void> {
  try {
    // Extract the largest image from the executable's primary icon group
    const icon = await native.extractExecutableIcon(filePath)

    // Save icon
    await GameDBManager.setGameImage(gameId, 'icon', icon)

    console.log('Save Icon Successful:', filePath)
  } catch (error) {
    console.error('Failed to save icon:', error)
    throw error
  }
}

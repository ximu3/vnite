import { getCoverPath, getBackgroundPath, getIconPath } from './image'

export async function getMediaPath(
  gameId: string,
  type: 'cover' | 'background' | 'icon'
): Promise<string> {
  switch (type) {
    case 'cover':
      return getCoverPath(gameId)
    case 'background':
      return getBackgroundPath(gameId)
    case 'icon':
      return getIconPath(gameId)
  }
}

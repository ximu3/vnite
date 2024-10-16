import gameIndexManager from './common'
import { toast } from 'sonner'

export * from './store'

export async function searchGames(query: string): Promise<string[]> {
  try {
    return gameIndexManager.search(query)
  } catch (error) {
    console.error(`Failed to search games with query ${query}`, error)
    toast.error(`Failed to search games with query ${query}`)
    return []
  }
}

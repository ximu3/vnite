import { ipcInvoke, ipcOnUnique } from '~/utils'
import { GameIndexdata, gameIndexdataKeys } from './types'
import { useGameIndexStore } from './store'

class GameIndexManager {
  private static instance: GameIndexManager
  private index: Map<string, Partial<GameIndexdata>> = new Map()

  private isInitialized: boolean = false
  private initPromise: Promise<void>

  private constructor() {
    this.initializeListeners()
    this.initPromise = this.rebuildIndex()
      .then(() => {
        this.isInitialized = true
        console.log('Initial index built')
      })
      .catch((error) => {
        console.error('Failed to build initial index:', error)
      })
  }

  public async isReady(): Promise<boolean> {
    await this.initPromise
    return this.isInitialized
  }

  public static getInstance(): GameIndexManager {
    if (!GameIndexManager.instance) {
      GameIndexManager.instance = new GameIndexManager()
    }
    return GameIndexManager.instance
  }

  private initializeListeners(): void {
    ipcOnUnique('rebuild-index', async () => {
      await this.rebuildIndex()
    })
  }

  public async rebuildIndex(): Promise<void> {
    try {
      const metadata: Record<string, GameIndexdata> = await ipcInvoke('get-games-metadata')
      this.index = this.buildIndex(metadata, gameIndexdataKeys)
      const setIndex = useGameIndexStore.getState().setIndex
      setIndex(this.index)
      console.log('Index rebuilt:', this.index)
    } catch (error) {
      console.error('Error rebuilding index:', error)
      throw error
    }
  }

  private buildIndex(
    metadata: Record<string, GameIndexdata>,
    fieldsToIndex: string[]
  ): Map<string, Partial<GameIndexdata>> {
    const newIndex = new Map<string, Partial<GameIndexdata>>()

    for (const [gameId, data] of Object.entries(metadata)) {
      const indexedData: Partial<GameIndexdata> = {}
      fieldsToIndex.forEach((field) => {
        if (data[field] !== undefined) {
          indexedData[field] = data[field]
        }
      })
      newIndex.set(gameId, indexedData)
    }

    return newIndex
  }

  public getIndex(): Map<string, Partial<GameIndexdata>> {
    return this.index
  }

  // 添加其他需要的方法，比如搜索、过滤等
  public search(query: string): string[] {
    const results: string[] = []
    const lowercaseQuery = query.toLowerCase()

    for (const [gameId, metadata] of this.index) {
      const matchFound = Object.values(metadata).some(
        (value) => value && value.toString().toLowerCase().includes(lowercaseQuery)
      )

      if (matchFound) {
        results.push(gameId)
      }
    }

    return results
  }

  // 过滤函数，传入类似{category: ['RPG','xxx'],'dev': ['a']}的数据，返回匹配的gameId数组
  public filter(criteria: Record<string, string[]>): string[] {
    const results: string[] = []

    for (const [gameId, metadata] of this.index) {
      const matchesAllCriteria = Object.entries(criteria).every(([field, values]) => {
        const metadataValue = metadata[field]?.toString().toLowerCase()
        return metadataValue && values.some((value) => metadataValue.includes(value.toLowerCase()))
      })

      if (matchesAllCriteria) {
        results.push(gameId)
      }
    }

    return results
  }
}

// 使用示例
const gameIndexManager = GameIndexManager.getInstance()

// 导出实例，以便其他模块可以使用
export default gameIndexManager

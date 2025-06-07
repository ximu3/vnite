import type { GameMetadata } from '../../types/utils'

export interface TransformerAPI {
  transformMetadata(metadata: GameMetadata, transformerIds: string[]): Promise<GameMetadata>
  exportTransformer(transformer: any, targetPath: string): Promise<void>
  importTransformer(sourcePath: string): Promise<void>
  transformGameById(gameId: string, transformerIds: string[]): Promise<boolean>
  transformAllGames(transformerIds: string[]): Promise<number>
  applyMetadata(gameId: string, metadata: GameMetadata): Promise<void>
}

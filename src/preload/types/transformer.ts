import type { GameMetadata } from '../../types/utils'

export interface TransformerAPI {
  transformMetadata(metadata: GameMetadata, transformerIds: string[]): Promise<GameMetadata>
  exportTransformer(transformer: any, targetPath: string): Promise<void>
  importTransformer(sourcePath: string): Promise<any>
  transformGameById(gameId: string, transformerIds: string[]): Promise<any>
  transformAllGames(transformerIds: string[]): Promise<any>
  applyMetadata(gameId: string, metadata: GameMetadata): Promise<void>
}

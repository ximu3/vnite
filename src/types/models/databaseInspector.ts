export type DatabaseAttachmentCategory = 'media' | 'memory' | 'descriptionImage' | 'save' | 'other'

export type AttachmentCategoryBytes = Record<DatabaseAttachmentCategory, number>

export interface OverviewGameStorageSummary {
  gameId: string
  name: string
  totalLogicalPayloadBytes: number
  estimatedDocBytes: number
  attachmentBytes: number
  attachmentCount: number
  attachmentCategoryBytes: AttachmentCategoryBytes
}

export interface LocalDatabaseStorageReport {
  generatedAt: string
  summary: {
    gamesWithAttachments: number
    physicalBytes: number
    logicalPayloadBytes: number
    attachmentBytes: number
    attachmentCount: number
  }
  attachmentCategoryBytes: AttachmentCategoryBytes
  games: OverviewGameStorageSummary[]
}

export interface GameAttachmentEntry {
  attachmentId: string
  category: DatabaseAttachmentCategory
  bytes: number
  contentType: string | null
}

export interface GameDatabaseStorageSummary {
  totalLogicalPayloadBytes: number
  estimatedDocBytes: number
  attachmentBytes: number
  attachmentCount: number
}

export interface GameDatabaseStorageDetail {
  generatedAt: string
  name: string
  summary: GameDatabaseStorageSummary
  attachmentEntries: GameAttachmentEntry[]
}

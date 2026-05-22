import type {
  AttachmentCategoryBytes,
  DatabaseAttachmentCategory,
  GameAttachmentEntry,
  GameDatabaseStorageDetail,
  GameDatabaseStorageSummary,
  LocalDatabaseStorageReport,
  OverviewGameStorageSummary
} from '@appTypes/models'
import { baseDBManager } from '~/core/database'
import { getDataPath } from '~/features/system'
import { getTotalPathSize } from '~/utils'

type DatabaseName = 'game' | 'game-local' | 'game-collection' | 'config' | 'config-local' | 'plugin'

type AttachmentMetadata = {
  content_type?: string
  length?: number
}

type AttachmentMap = Record<string, AttachmentMetadata>

type DbDoc = Record<string, any> & {
  _id: string
  _attachments?: AttachmentMap
}

const DATABASE_NAMES: DatabaseName[] = [
  'game',
  'game-local',
  'game-collection',
  'config',
  'config-local',
  'plugin'
] as const

const ATTACHMENT_CATEGORIES: DatabaseAttachmentCategory[] = [
  'media',
  'memory',
  'descriptionImage',
  'save',
  'other'
] as const

function createEmptyAttachmentCategoryBytes(): AttachmentCategoryBytes {
  return {
    media: 0,
    memory: 0,
    descriptionImage: 0,
    save: 0,
    other: 0
  }
}

function estimateDocBytes(doc: DbDoc): number {
  const cloned = JSON.parse(JSON.stringify(doc)) as DbDoc
  delete cloned._attachments
  return Buffer.byteLength(JSON.stringify(cloned), 'utf8')
}

function classifyAttachment(attachmentId: string): DatabaseAttachmentCategory {
  switch (attachmentId) {
    case 'images/cover.webp':
    case 'images/background.webp':
    case 'images/icon.webp':
    case 'images/logo.webp':
    case 'images/wideCover.webp':
      return 'media'
    default:
      break
  }

  if (attachmentId.startsWith('images/memories/')) {
    return 'memory'
  }
  if (attachmentId.startsWith('images/description/')) {
    return 'descriptionImage'
  }
  if (attachmentId.startsWith('saves/')) {
    return 'save'
  }
  return 'other'
}

function summarizeAttachments(attachments: AttachmentMap | undefined): {
  totalBytes: number
  totalCount: number
  categoryBytes: AttachmentCategoryBytes
  entries: GameAttachmentEntry[]
} {
  const categoryBytes = createEmptyAttachmentCategoryBytes()
  const entries: GameAttachmentEntry[] = []
  let totalBytes = 0
  let totalCount = 0

  if (!attachments) {
    return { totalBytes, totalCount, categoryBytes, entries }
  }

  for (const [attachmentId, metadata] of Object.entries(attachments)) {
    const bytes = metadata.length ?? 0
    const category = classifyAttachment(attachmentId)

    totalBytes += bytes
    totalCount += 1
    categoryBytes[category] += bytes

    entries.push({
      attachmentId,
      category,
      bytes,
      contentType: metadata.content_type ?? null
    })
  }

  entries.sort((a, b) => {
    if (b.bytes !== a.bytes) return b.bytes - a.bytes
    return a.attachmentId.localeCompare(b.attachmentId)
  })

  return { totalBytes, totalCount, categoryBytes, entries }
}

async function getDatabasePhysicalBytes(dbName: DatabaseName): Promise<number> {
  try {
    const size = await getTotalPathSize([getDataPath(dbName)])
    return Number.isFinite(size) ? size : 0
  } catch {
    return 0
  }
}

async function getDocIfExists(dbName: DatabaseName, docId: string): Promise<DbDoc | undefined> {
  return (await baseDBManager.getExistingDoc<DbDoc>(dbName, docId)) ?? undefined
}

function compareOverviewGameSummary(
  a: OverviewGameStorageSummary,
  b: OverviewGameStorageSummary
): number {
  if (b.totalLogicalPayloadBytes !== a.totalLogicalPayloadBytes) {
    return b.totalLogicalPayloadBytes - a.totalLogicalPayloadBytes
  }
  if (b.attachmentBytes !== a.attachmentBytes) {
    return b.attachmentBytes - a.attachmentBytes
  }
  return a.name.localeCompare(b.name)
}

export async function getLocalStorageReport(): Promise<LocalDatabaseStorageReport> {
  const docsAndSizes = await Promise.all(
    DATABASE_NAMES.flatMap((dbName) => [
      baseDBManager.getAllDocs(dbName),
      getDatabasePhysicalBytes(dbName)
    ])
  )

  const docsByDatabase = new Map<DatabaseName, Record<string, DbDoc>>()
  const physicalBytesByDatabase = new Map<DatabaseName, number>()

  for (let i = 0; i < DATABASE_NAMES.length; i++) {
    const dbName = DATABASE_NAMES[i]
    docsByDatabase.set(dbName, docsAndSizes[i * 2] as Record<string, DbDoc>)
    physicalBytesByDatabase.set(dbName, docsAndSizes[i * 2 + 1] as number)
  }

  const gameDocs = docsByDatabase.get('game') ?? {}
  const gameLocalDocs = docsByDatabase.get('game-local') ?? {}
  const gameIds = Array.from(
    new Set(
      [...Object.keys(gameDocs), ...Object.keys(gameLocalDocs)].filter((id) => id !== 'collections')
    )
  )

  const attachmentCategoryBytes = createEmptyAttachmentCategoryBytes()
  const games: OverviewGameStorageSummary[] = []

  for (const gameId of gameIds) {
    const gameDoc = gameDocs[gameId]
    const gameLocalDoc = gameLocalDocs[gameId]
    const gameDocBytes = gameDoc ? estimateDocBytes(gameDoc) : 0
    const gameLocalDocBytes = gameLocalDoc ? estimateDocBytes(gameLocalDoc) : 0
    const attachmentSummary = summarizeAttachments(gameDoc?._attachments)

    games.push({
      gameId,
      name: gameDoc?.metadata?.name || gameId,
      totalLogicalPayloadBytes: gameDocBytes + gameLocalDocBytes + attachmentSummary.totalBytes,
      estimatedDocBytes: gameDocBytes + gameLocalDocBytes,
      attachmentBytes: attachmentSummary.totalBytes,
      attachmentCount: attachmentSummary.totalCount,
      attachmentCategoryBytes: attachmentSummary.categoryBytes
    })
  }

  games.sort(compareOverviewGameSummary)

  let totalPhysicalBytes = 0
  let totalLogicalPayloadBytes = 0
  let totalAttachmentBytes = 0
  let totalAttachmentCount = 0

  for (const dbName of DATABASE_NAMES) {
    const docs = Object.values(docsByDatabase.get(dbName) ?? {})
    const estimatedDocBytes = docs.reduce((total, doc) => total + estimateDocBytes(doc), 0)
    const attachmentSummaries = docs.map((doc) => summarizeAttachments(doc._attachments))
    const attachmentBytes = attachmentSummaries.reduce(
      (total, summary) => total + summary.totalBytes,
      0
    )
    const attachmentCount = attachmentSummaries.reduce(
      (total, summary) => total + summary.totalCount,
      0
    )

    totalPhysicalBytes += physicalBytesByDatabase.get(dbName) ?? 0
    totalLogicalPayloadBytes += estimatedDocBytes + attachmentBytes
    totalAttachmentBytes += attachmentBytes
    totalAttachmentCount += attachmentCount

    for (const attachmentSummary of attachmentSummaries) {
      for (const category of ATTACHMENT_CATEGORIES) {
        attachmentCategoryBytes[category] += attachmentSummary.categoryBytes[category]
      }
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    summary: {
      gamesWithAttachments: games.filter((game) => game.attachmentCount > 0).length,
      physicalBytes: totalPhysicalBytes,
      logicalPayloadBytes: totalLogicalPayloadBytes,
      attachmentBytes: totalAttachmentBytes,
      attachmentCount: totalAttachmentCount
    },
    attachmentCategoryBytes,
    games
  }
}

export async function getGameStorageDetail(gameId: string): Promise<GameDatabaseStorageDetail> {
  const [gameDoc, gameLocalDoc] = await Promise.all([
    getDocIfExists('game', gameId),
    getDocIfExists('game-local', gameId)
  ])

  const attachmentSummary = summarizeAttachments(gameDoc?._attachments)
  const gameDocBytes = gameDoc ? estimateDocBytes(gameDoc) : 0
  const gameLocalDocBytes = gameLocalDoc ? estimateDocBytes(gameLocalDoc) : 0

  const summary: GameDatabaseStorageSummary = {
    totalLogicalPayloadBytes: gameDocBytes + gameLocalDocBytes + attachmentSummary.totalBytes,
    estimatedDocBytes: gameDocBytes + gameLocalDocBytes,
    attachmentBytes: attachmentSummary.totalBytes,
    attachmentCount: attachmentSummary.totalCount
  }

  return {
    generatedAt: new Date().toISOString(),
    name: gameDoc?.metadata?.name || gameId,
    summary,
    attachmentEntries: attachmentSummary.entries
  }
}

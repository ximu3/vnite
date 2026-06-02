import { configDocs, configLocalDocs, DEFAULT_CONFIG_LOCAL_VALUES } from '@appTypes/models'
import { getValueByPath, satisfiesSemanticVersion } from '@appUtils'
import log from 'electron-log/main'
import type { Get, Paths } from 'type-fest'
import { ConfigDBManager } from './layers/ConfigDBManager'
import { GameDBManager } from './layers/GameDBManager'
import { inferRootPath } from '~/utils'
import path from 'path'

type DatabaseMigration = {
  key: string
  version: string
  description: string
  run: () => Promise<void>
}

type SyncedConfigPath = Paths<configDocs, { bracketNotation: true }>
type LocalConfigPath = Paths<configLocalDocs, { bracketNotation: true }>

const DATABASE_MIGRATIONS: DatabaseMigration[] = [
  {
    key: 'screenshot-hotkeys',
    version: '>4.9.0',
    description: 'Split the screenshot shortcut into mode-specific local hotkeys',
    run: migrateScreenshotHotkeys
  },
  {
    key: 'screenshot-storage-location',
    version: '>4.9.0',
    description: 'Move screenshot storage settings to the local configuration database',
    run: migrateScreenshotStorageLocation
  },
  {
    key: 'game-root-path',
    version: '>=4.10.0',
    description:
      'Infer and populate rootPath for all existing games based on markPath and gamePath',
    run: migrateGameRootPath
  }
]

export async function runDatabaseMigrations(appVersion: string): Promise<void> {
  let migrationCompleted = await ConfigDBManager.getConfigLocalValue('database.migrationCompleted')

  for (const migration of DATABASE_MIGRATIONS) {
    if (!shouldRunMigration(migration, appVersion, migrationCompleted)) {
      continue
    }

    try {
      log.info(`[DatabaseMigration] Running ${migration.key}: ${migration.description}`)
      await migration.run()
      migrationCompleted = await markMigrationCompleted(migrationCompleted, migration)
      log.info(`[DatabaseMigration] Completed ${migration.key}`)
    } catch (error) {
      log.error(`[DatabaseMigration] Failed to run ${migration.key}:`, error)
    }
  }
}

function shouldRunMigration(
  migration: DatabaseMigration,
  appVersion: string,
  migrationCompleted: string[]
): boolean {
  if (migrationCompleted.includes(migration.key)) {
    return false
  }

  if (!satisfiesSemanticVersion(appVersion, migration.version)) {
    return false
  }

  return true
}

async function markMigrationCompleted(
  migrationCompleted: string[],
  migration: DatabaseMigration
): Promise<string[]> {
  const nextMigrationCompleted = Array.from(new Set([...migrationCompleted, migration.key]))

  await ConfigDBManager.setConfigLocalValue('database.migrationCompleted', nextMigrationCompleted)
  return nextMigrationCompleted
}

function getArchiveValue<T>(archive: Record<string, unknown>, path: string): T | undefined {
  return getValueByPath(archive, path) as T | undefined
}

/**
 * Write one config field only when the target field does not already exist in the target archive.
 *
 * @param targetDatabase Target config database to write to.
 * @param targetConfigPath Target field path used to check targetConfigArchive and write the config.
 * @param targetConfigArchive Read-only snapshot of targetDatabase used for idempotency checks.
 * @param targetConfigValue Value to write when targetConfigPath is missing.
 * @param sourceLogPath Full source field path used only in migration logs.
 * @param sourceLogValue Source value used only in migration logs.
 */
async function setConfigValueIfMissing<Path extends SyncedConfigPath>(
  targetDatabase: 'config',
  targetConfigPath: Path,
  targetConfigArchive: Record<string, unknown>,
  targetConfigValue: Get<configDocs, Path>,
  sourceLogPath: string,
  sourceLogValue: unknown
): Promise<void>
async function setConfigValueIfMissing<Path extends LocalConfigPath>(
  targetDatabase: 'config-local',
  targetConfigPath: Path,
  targetConfigArchive: Record<string, unknown>,
  targetConfigValue: Get<configLocalDocs, Path>,
  sourceLogPath: string,
  sourceLogValue: unknown
): Promise<void>
async function setConfigValueIfMissing(
  targetDatabase: 'config' | 'config-local',
  targetConfigPath: string,
  targetConfigArchive: Record<string, unknown>,
  targetConfigValue: unknown,
  sourceLogPath: string,
  sourceLogValue: unknown
): Promise<void> {
  const targetArchiveValue = getArchiveValue<unknown>(targetConfigArchive, targetConfigPath)
  const targetLogPath = `${targetDatabase}.${targetConfigPath}`

  if (targetArchiveValue !== undefined) {
    logFieldMigrationSkipped(sourceLogPath, targetLogPath, targetArchiveValue)
    return
  }

  logFieldMigration(sourceLogPath, targetLogPath, sourceLogValue, targetConfigValue)
  if (targetDatabase === 'config') {
    await ConfigDBManager.setConfigValue(
      targetConfigPath as SyncedConfigPath,
      targetConfigValue as any
    )
  } else {
    await ConfigDBManager.setConfigLocalValue(
      targetConfigPath as LocalConfigPath,
      targetConfigValue as any
    )
  }
}

function logFieldMigration(
  sourceLogPath: string,
  targetLogPath: string,
  sourceLogValue: unknown,
  targetValue: unknown
): void {
  log.info(
    `[DatabaseMigration] migrate ${sourceLogPath} -> ${targetLogPath} from ${formatMigrationValue(sourceLogValue)} to ${formatMigrationValue(targetValue)}`
  )
}

function logFieldMigrationSkipped(
  sourceLogPath: string,
  targetLogPath: string,
  targetValue: unknown
): void {
  log.info(
    `[DatabaseMigration] skip migrate ${sourceLogPath} -> ${targetLogPath}, target already exists as ${formatMigrationValue(targetValue)}`
  )
}

function formatMigrationValue(value: unknown): string {
  if (value === undefined) {
    return '<undefined>'
  }

  if (value === null) {
    return '<null>'
  }

  return `'${String(value)}'`
}

async function migrateScreenshotHotkeys(): Promise<void> {
  type LegacySnippingMode = 'rectangle' | 'activewindow' | 'fullscreen'

  const configs = (await ConfigDBManager.getAllConfigs()) as unknown as Record<string, unknown>
  const localConfigs = (await ConfigDBManager.getAllConfigLocal()) as unknown as Record<
    string,
    unknown
  >
  const snippingMode =
    getArchiveValue<LegacySnippingMode>(configs, 'memory.snippingMode') ?? 'rectangle'
  const capture = getArchiveValue<string>(localConfigs, 'hotkeys.capture')
  const legacyHotkey = capture ?? DEFAULT_CONFIG_LOCAL_VALUES.hotkeys.captureActiveWindow

  const captureRectangle = snippingMode === 'rectangle' ? legacyHotkey : ''
  const captureActiveWindow = snippingMode === 'activewindow' ? legacyHotkey : ''
  const captureFullscreen = snippingMode === 'fullscreen' ? legacyHotkey : ''

  await setConfigValueIfMissing(
    'config-local',
    'hotkeys.captureRectangle',
    localConfigs,
    captureRectangle,
    'config-local.hotkeys.capture',
    capture
  )
  await setConfigValueIfMissing(
    'config-local',
    'hotkeys.captureActiveWindow',
    localConfigs,
    captureActiveWindow,
    'config-local.hotkeys.capture',
    capture
  )
  await setConfigValueIfMissing(
    'config-local',
    'hotkeys.captureFullscreen',
    localConfigs,
    captureFullscreen,
    'config-local.hotkeys.capture',
    capture
  )
}

async function migrateScreenshotStorageLocation(): Promise<void> {
  const configs = (await ConfigDBManager.getAllConfigs()) as unknown as Record<string, unknown>
  const localConfigs = (await ConfigDBManager.getAllConfigLocal()) as unknown as Record<
    string,
    unknown
  >
  const storageBackend = getArchiveValue<configLocalDocs['memory']['image']['storageBackend']>(
    configs,
    'memory.image.storageBackend'
  )
  const saveDir = getArchiveValue<configLocalDocs['memory']['image']['saveDir']>(
    configs,
    'memory.image.saveDir'
  )
  const namingRule = getArchiveValue<configLocalDocs['memory']['image']['namingRule']>(
    configs,
    'memory.image.namingRule'
  )
  const nextStorageBackend =
    storageBackend ?? DEFAULT_CONFIG_LOCAL_VALUES.memory.image.storageBackend
  const nextSaveDir = saveDir ?? DEFAULT_CONFIG_LOCAL_VALUES.memory.image.saveDir
  const nextNamingRule = namingRule ?? DEFAULT_CONFIG_LOCAL_VALUES.memory.image.namingRule

  await setConfigValueIfMissing(
    'config-local',
    'memory.image.storageBackend',
    localConfigs,
    nextStorageBackend,
    'config.memory.image.storageBackend',
    storageBackend
  )
  await setConfigValueIfMissing(
    'config-local',
    'memory.image.saveDir',
    localConfigs,
    nextSaveDir,
    'config.memory.image.saveDir',
    saveDir
  )
  await setConfigValueIfMissing(
    'config-local',
    'memory.image.namingRule',
    localConfigs,
    nextNamingRule,
    'config.memory.image.namingRule',
    namingRule
  )
}

async function migrateGameRootPath(): Promise<void> {
  const games = await GameDBManager.getAllGamesLocal()
  const gameArray = Object.values(games)
  let migrated = 0

  for (const game of gameArray) {
    if (game.utils?.rootPath) continue

    const markPath = game.utils?.markPath ?? ''
    const gamePath = game.path?.gamePath ?? ''
    const inferred = inferRootPath(markPath || (gamePath ? path.dirname(gamePath) : ''))

    if (inferred) {
      await GameDBManager.setGameLocalValue(game._id, 'utils.rootPath', inferred)
      migrated++
    }
  }

  log.info(`[DatabaseMigration] game-root-path: migrated ${migrated} games`)
}

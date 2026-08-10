import type {
  BuiltInLauncherPresetId,
  gameLocalDoc,
  LauncherPreset,
  LauncherPresetApplyResult,
  LauncherPresetVariable
} from '@appTypes/models'
import { isBuiltInLauncherPresetId, LAUNCHER_PRESET_VARIABLES } from '@appTypes/models'
import path from 'path'
import { ConfigDBManager, GameDBManager } from '~/core/database'
import { updateKnownGame } from '~/features/monitor/services/nativeMonitor'

const TEMPLATE_VARIABLE_PATTERN = /\$\{vnite\.(gamePath|gameDirectory|steamId)\}/g

function resolveLauncherPreset(
  preset: LauncherPreset,
  variables: Record<LauncherPresetVariable, string>
): { preset: LauncherPreset; missingVariables: LauncherPresetVariable[] } {
  const missingVariables = new Set<LauncherPresetVariable>()
  const resolveTemplate = (template: string): string =>
    template.replace(
      TEMPLATE_VARIABLE_PATTERN,
      (_matched, variableName: LauncherPresetVariable) => {
        const variable = variableName
        const value = variables[variable]
        if (!value) missingVariables.add(variable)
        return value
      }
    )

  const common = {
    ...preset,
    monitorPath: resolveTemplate(preset.monitorPath)
  }

  if (preset.mode === 'file') {
    return {
      preset: { ...common, mode: 'file', path: resolveTemplate(preset.path) },
      missingVariables: [...missingVariables]
    }
  }
  if (preset.mode === 'url') {
    return {
      preset: {
        ...common,
        mode: 'url',
        url: resolveTemplate(preset.url),
        browserPath: resolveTemplate(preset.browserPath)
      },
      missingVariables: [...missingVariables]
    }
  }
  return {
    preset: {
      ...common,
      mode: 'script',
      workingDirectory: resolveTemplate(preset.workingDirectory),
      command: preset.command.map(resolveTemplate)
    },
    missingVariables: [...missingVariables]
  }
}

async function getBuiltInLauncherPreset(
  presetId: BuiltInLauncherPresetId
): Promise<LauncherPreset> {
  switch (presetId) {
    case 'default':
      return {
        id: presetId,
        name: presetId,
        mode: 'file',
        path: LAUNCHER_PRESET_VARIABLES.gamePath,
        monitorMode: 'folder',
        monitorPath: LAUNCHER_PRESET_VARIABLES.gameDirectory
      }

    case 'le': {
      const localeEmulatorPath = (
        await ConfigDBManager.getConfigLocalValue('game.linkage.localeEmulator.path')
      ).trim()
      if (!localeEmulatorPath) throw new Error('Locale Emulator path not set')

      return {
        id: presetId,
        name: presetId,
        mode: 'script',
        workingDirectory: LAUNCHER_PRESET_VARIABLES.gameDirectory,
        command: [`"${localeEmulatorPath}" "${LAUNCHER_PRESET_VARIABLES.gamePath}"`],
        monitorMode: 'folder',
        monitorPath: LAUNCHER_PRESET_VARIABLES.gameDirectory
      }
    }

    case 'steam':
      return {
        id: presetId,
        name: presetId,
        mode: 'url',
        url: `steam://rungameid/${LAUNCHER_PRESET_VARIABLES.steamId}`,
        browserPath: '',
        monitorMode: 'folder',
        monitorPath: LAUNCHER_PRESET_VARIABLES.gameDirectory
      }

    case 'vba': {
      const visualBoyAdvancePath = (
        await ConfigDBManager.getConfigLocalValue('game.linkage.visualBoyAdvance.path')
      ).trim()
      if (!visualBoyAdvancePath) throw new Error('VisualBoyAdvance path not set')

      const visualBoyAdvanceDirectory = path.dirname(visualBoyAdvancePath)
      return {
        id: presetId,
        name: presetId,
        mode: 'script',
        workingDirectory: visualBoyAdvanceDirectory,
        command: [`"${visualBoyAdvancePath}" "${LAUNCHER_PRESET_VARIABLES.gamePath}"`],
        monitorMode: 'folder',
        monitorPath: visualBoyAdvanceDirectory
      }
    }
  }

  const exhaustiveCheck: never = presetId
  throw new Error(`Unknown built-in launcher preset: ${exhaustiveCheck}`)
}

async function getLauncherPreset(presetId: string): Promise<LauncherPreset> {
  if (isBuiltInLauncherPresetId(presetId)) {
    return getBuiltInLauncherPreset(presetId)
  }

  const customPresets = await ConfigDBManager.getConfigLocalValue('game.launcher.presets')
  const preset = customPresets.find((candidate) => candidate.id === presetId)
  if (!preset) {
    throw new Error(`Unknown launcher preset: ${presetId}`)
  }

  return preset
}

function createNextLauncher(
  currentLauncher: gameLocalDoc['launcher'],
  preset: LauncherPreset
): gameLocalDoc['launcher'] {
  if (preset.mode === 'file') {
    return {
      ...currentLauncher,
      mode: 'file',
      fileConfig: {
        path: preset.path,
        args: [],
        monitorMode: preset.monitorMode,
        monitorPath: preset.monitorPath
      }
    }
  }

  if (preset.mode === 'url') {
    return {
      ...currentLauncher,
      mode: 'url',
      urlConfig: {
        url: preset.url,
        browserPath: preset.browserPath,
        monitorMode: preset.monitorMode,
        monitorPath: preset.monitorPath
      }
    }
  }

  return {
    ...currentLauncher,
    mode: 'script',
    scriptConfig: {
      workingDirectory: preset.workingDirectory,
      command: preset.command,
      monitorMode: preset.monitorMode,
      monitorPath: preset.monitorPath
    }
  }
}

export async function applyLauncherPreset(
  presetId: string,
  gameId: string
): Promise<LauncherPresetApplyResult> {
  const gamePath = await GameDBManager.getGameLocalValue(gameId, 'path.gamePath')
  if (!gamePath.trim()) {
    throw new Error('Game path not set')
  }

  const preset = await getLauncherPreset(presetId)
  const steamId = await GameDBManager.getGameValue(gameId, 'metadata.steamId')
  const { preset: resolvedPreset, missingVariables } = resolveLauncherPreset(preset, {
    gamePath,
    gameDirectory: path.dirname(gamePath),
    steamId: steamId.trim()
  })

  if (missingVariables.includes('steamId')) {
    return { status: 'missing-steam-id' }
  }

  const currentLauncher = await GameDBManager.getGameLocalValue(gameId, 'launcher')
  await GameDBManager.setGameLocalValue(
    gameId,
    'launcher',
    createNextLauncher(currentLauncher, resolvedPreset)
  )
  await updateKnownGame(gameId)

  return { status: 'applied' }
}

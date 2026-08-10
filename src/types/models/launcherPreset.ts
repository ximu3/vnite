export const BUILT_IN_LAUNCHER_PRESET_IDS = ['default', 'le', 'steam', 'vba'] as const

export type BuiltInLauncherPresetId = (typeof BUILT_IN_LAUNCHER_PRESET_IDS)[number]
export type LauncherPresetVariable = 'gamePath' | 'gameDirectory' | 'steamId'
export type LauncherPresetMonitorMode = 'file' | 'folder' | 'process'

export const LAUNCHER_PRESET_VARIABLES: Readonly<Record<LauncherPresetVariable, string>> = {
  gamePath: '${vnite.gamePath}',
  gameDirectory: '${vnite.gameDirectory}',
  steamId: '${vnite.steamId}'
}

export function isBuiltInLauncherPresetId(value: string): value is BuiltInLauncherPresetId {
  return BUILT_IN_LAUNCHER_PRESET_IDS.some((presetId) => presetId === value)
}

interface LauncherPresetBase {
  id: string
  name: string
  monitorMode: LauncherPresetMonitorMode
  monitorPath: string
}

export type LauncherPreset =
  | (LauncherPresetBase & {
      mode: 'file'
      path: string
    })
  | (LauncherPresetBase & {
      mode: 'url'
      url: string
      browserPath: string
    })
  | (LauncherPresetBase & {
      mode: 'script'
      workingDirectory: string
      command: string[]
    })

export type LauncherPresetApplyResult = { status: 'applied' } | { status: 'missing-steam-id' }

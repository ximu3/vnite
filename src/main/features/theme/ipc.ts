import { nativeTheme } from 'electron'
import { ThemeManager, themePreset } from './services'
import { ipcManager } from '~/core/ipc'

export function setupThemeIPC(): void {
  ipcManager.handle('theme:set-mode', (_, mode: 'system' | 'dark' | 'light') => {
    nativeTheme.themeSource = mode
  })

  ipcManager.handle('theme:save', async (_, cssContent: string) => {
    const themeManager = ThemeManager.getInstance()
    await themeManager.saveTheme(cssContent)
  })

  ipcManager.handle('theme:load', async () => {
    const themeManager = ThemeManager.getInstance()
    return await themeManager.loadTheme()
  })

  ipcManager.handle('theme:select-preset', async (_, preset: string) => {
    return await themePreset(preset)
  })
}

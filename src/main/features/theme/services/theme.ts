import { getDataPath } from '~/features/system/services/path'
import { defaultPreset } from './preset'
import fse from 'fs-extra'
import log from 'electron-log/main.js'

export class ThemeManager {
  private static instance: ThemeManager | null = null
  private themePath: string

  private constructor(themePath: string) {
    this.themePath = themePath
  }

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      const themePath = getDataPath('theme.v4.css')
      ThemeManager.instance = new ThemeManager(themePath)
    }
    return ThemeManager.instance
  }

  async saveTheme(cssContent: string): Promise<void> {
    try {
      await fse.writeFile(this.themePath, cssContent, 'utf-8')
    } catch (error) {
      log.error('[Theme] Failed to save theme:', error)
    }
  }

  async loadTheme(): Promise<string | null> {
    try {
      if (await fse.pathExists(this.themePath)) {
        const themeContent = await fse.readFile(this.themePath, 'utf-8')
        if (!themeContent || !themeContent.includes('dark')) {
          return await defaultPreset()
        } else {
          return themeContent
        }
      } else {
        return await defaultPreset()
      }
    } catch (error) {
      log.error('[Theme] Failed to read theme:', error)
    }
    return null
  }
}

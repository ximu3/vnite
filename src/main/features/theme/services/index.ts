import { defaultPreset, mutsumiPreset, moonlightPreset } from './preset'
import { eventBus } from '~/core/events'
import log from 'electron-log/main.js'

export async function themePreset(presetName: string): Promise<string> {
  try {
    if (presetName === 'default') {
      eventBus.emit('theme:preset-changed', { preset: 'default' }, { source: 'theme-service' })
      return await defaultPreset()
    } else if (presetName === 'mutsumi') {
      eventBus.emit('theme:preset-changed', { preset: 'mutsumi' }, { source: 'theme-service' })
      return await mutsumiPreset()
    } else if (presetName === 'moonlight') {
      eventBus.emit('theme:preset-changed', { preset: 'moonlight' }, { source: 'theme-service' })
      return await moonlightPreset()
    } else {
      throw new Error(`Unknown theme preset ${presetName}`)
    }
  } catch (error) {
    log.error(`Failed to set theme preset`, error)
    throw error
  }
}

export { ThemeManager } from './theme'

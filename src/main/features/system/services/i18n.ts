import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import resourcesToBackend from 'i18next-resources-to-backend'
import { app } from 'electron'
import { ConfigDBManager } from '~/core/database'
import { eventBus } from '~/core/events'
import log from 'electron-log/main'

export async function getLanguage(): Promise<string> {
  try {
    const language = await ConfigDBManager.getConfigValue('general.language')
    if (language) {
      return language
    } else {
      await ConfigDBManager.setConfigValue('general.language', app.getLocale())
      return app.getLocale()
    }
  } catch (error) {
    log.error('[I18n] Failed to get language:', error)
    throw error
  }
}

export async function initI18n(): Promise<void> {
  try {
    const language = await getLanguage()

    const namespaces = ['tray', 'scraper']

    const supportedLngs = ['zh-CN', 'zh-TW', 'ja', 'en', 'ru', 'fr', 'ko']

    await i18next
      .use(Backend)
      .use(
        resourcesToBackend(async (language: string, namespace: string) => {
          return import(`@locales/${language}/${namespace}.json`).catch((error) => {
            console.error(`Unable to load translation file: ${language}/${namespace}`, error)
            return {}
          })
        })
      )
      .init({
        lng: language,
        fallbackLng: 'en',
        ns: namespaces,
        defaultNS: 'tray',
        partialBundledLanguages: true,
        supportedLngs
      })
  } catch (error) {
    log.error('[I18n] Initialization error:', error)
    throw error
  }
}

export function updateLanguage(language: string): void {
  try {
    i18next.changeLanguage(language)
    eventBus.emit('language:changed', { newLanguage: language }, { source: 'i18n-service' })
  } catch (error) {
    log.error('[I18n] Failed to update language:', error)
    throw error
  }
}

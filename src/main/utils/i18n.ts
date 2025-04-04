import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import resourcesToBackend from 'i18next-resources-to-backend'
import { getLanguage } from './common'

export async function initI18n(): Promise<void> {
  const language = await getLanguage()

  const namespaces = ['tray', 'scraper']

  const supportedLngs = ['zh-CN', 'zh-TW', 'ja', 'en']

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
}

export function updateLanguage(language: string): void {
  i18next.changeLanguage(language)
}

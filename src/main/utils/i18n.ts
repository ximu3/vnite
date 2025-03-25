import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import { getLanguage } from './common'

import zhCNTray from '@locales/zh-CN/tray.json'
import zhCNScraper from '@locales/zh-CN/scraper.json'

import jaTray from '@locales/ja/tray.json'
import jaScraper from '@locales/ja/scraper.json'

import enTray from '@locales/en/tray.json'
import enScraper from '@locales/en/scraper.json'

const resources = {
  'zh-CN': {
    tray: zhCNTray,
    scraper: zhCNScraper
  },
  ja: {
    tray: jaTray,
    scraper: jaScraper
  },
  en: {
    tray: enTray,
    scraper: enScraper
  }
}

export async function initI18n(): Promise<void> {
  const language = await getLanguage()

  await i18next.use(Backend).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    ns: ['tray', 'scraper'],
    defaultNS: 'tray'
  })
}

export function updateLanguage(language: string): void {
  i18next.changeLanguage(language)
}

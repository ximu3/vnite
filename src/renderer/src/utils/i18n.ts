import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { ipcInvoke } from './ipc'

// Importing translation files for each module
// zh-CN
import zhCNAdder from '@locales/zh-CN/adder.json'
import zhCNConfig from '@locales/zh-CN/config.json'
import zhCNGame from '@locales/zh-CN/game.json'
import zhCNImporter from '@locales/zh-CN/importer.json'
import zhCNRecord from '@locales/zh-CN/record.json'
import zhCNSidebar from '@locales/zh-CN/sidebar.json'
import zhCNUI from '@locales/zh-CN/ui.json'
import zhCNUpdater from '@locales/zh-CN/updater.json'
import zhCNUtils from '@locales/zh-CN/utils.json'

// ja
import jaAdder from '@locales/ja/adder.json'
import jaConfig from '@locales/ja/config.json'
import jaGame from '@locales/ja/game.json'
import jaImporter from '@locales/ja/importer.json'
import jaRecord from '@locales/ja/record.json'
import jaSidebar from '@locales/ja/sidebar.json'
import jaUI from '@locales/ja/ui.json'
import jaUpdater from '@locales/ja/updater.json'
import jaUtils from '@locales/ja/utils.json'

// en
import enAdder from '@locales/en/adder.json'
import enConfig from '@locales/en/config.json'
import enGame from '@locales/en/game.json'
import enImporter from '@locales/en/importer.json'
import enRecord from '@locales/en/record.json'
import enSidebar from '@locales/en/sidebar.json'
import enUI from '@locales/en/ui.json'
import enUpdater from '@locales/en/updater.json'
import enUtils from '@locales/en/utils.json'

const resources = {
  'zh-CN': {
    config: zhCNConfig,
    sidebar: zhCNSidebar,
    game: zhCNGame,
    ui: zhCNUI,
    adder: zhCNAdder,
    importer: zhCNImporter,
    updater: zhCNUpdater,
    utils: zhCNUtils,
    record: zhCNRecord
  },
  ja: {
    config: jaConfig,
    sidebar: jaSidebar,
    game: jaGame,
    ui: jaUI,
    adder: jaAdder,
    importer: jaImporter,
    updater: jaUpdater,
    utils: jaUtils,
    record: jaRecord
  },
  en: {
    config: enConfig,
    sidebar: enSidebar,
    game: enGame,
    ui: enUI,
    adder: enAdder,
    importer: enImporter,
    updater: enUpdater,
    utils: enUtils,
    record: enRecord
  }
}

export async function i18nInit(): Promise<void> {
  const language = (await ipcInvoke('get-language')) as string
  console.warn('[i18n] Language:', language)

  await i18n.use(initReactI18next).init({
    resources,
    lng: language,
    fallbackLng: 'en',
    defaultNS: 'ui',
    fallbackNS: 'ui',
    ns: ['config', 'sidebar', 'ui', 'game', 'adder', 'importer', 'updater', 'utils', 'record'],
    interpolation: {
      escapeValue: false
    }
  })

  i18n.services.formatter?.add('gameTime', (value, lng, _options) => {
    // Calculation of total hours (with fractional part)
    const totalHours = value / (1000 * 60 * 60)
    const minutes = (value % (1000 * 60 * 60)) / (1000 * 60)

    if (totalHours >= 1) {
      // When more than 1 hour, the display is in decimal form with 1 decimal place retained
      const formattedHours = totalHours.toFixed(1)

      // Returns different formats depending on the language
      if (lng === 'zh-CN') {
        return `${formattedHours} 小时`
      } else if (lng === 'ja') {
        return `${formattedHours} 時間`
      } else {
        return `${formattedHours} h`
      }
    } else {
      const formattedMinutes = minutes < 0.5 && minutes > 1e-10 ? '< 1' : `${Math.round(minutes)}`
      // Minutes are still displayed when less than 1 hour has elapsed
      // If it is less than 30s, display '< 1'
      if (lng === 'zh-CN') {
        return `${formattedMinutes} 分钟`
      } else if (lng === 'ja') {
        return `${formattedMinutes} 分`
      } else {
        return `${formattedMinutes} m`
      }
    }
  })

  i18n.services.formatter?.add('niceDate', (value, lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Access to year, month and day
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()

    // Returns formatted dates according to language
    if (lng === 'zh-CN') {
      return `${year}年${month}月${day}日`
    } else if (lng === 'ja') {
      return `${year}年${month}月${day}日`
    } else {
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  })

  i18n.services.formatter?.add('niceISO', (value, _lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Access to year, month and day
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()

    return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`
  })

  i18n.services.formatter?.add('niceDateSeconds', (value, lng, _options) => {
    // Make sure value is a Date object
    const date = value instanceof Date ? value : new Date(value)

    // Get year, month, day, hour, minute, second
    const year = date.getFullYear()
    const month = date.getMonth() + 1 // getMonth() return 0-11
    const day = date.getDate()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')

    // Returns formatted date and time according to language
    if (lng === 'zh-CN') {
      return `${year}年${month}月${day}日 ${hours}:${minutes}:${seconds}`
    } else if (lng === 'ja') {
      return `${year}年${month}月${day}日 ${hours}時${minutes}分${seconds}秒`
    } else {
      return new Intl.DateTimeFormat(lng, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: lng?.startsWith('en') // English uses a 12-hour day, most others use a 24-hour day.
      }).format(date)
    }
  })
}
